import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEMO_CITIZEN_MOBILE, SEQ, buildSeed, entryLabelOf } from '@/data/seed'
import { charterDaysOf, citizenLabel, serviceOf } from '@/data/services'
import { USERS } from '@/data/users'
import { feeTotalOf, feeLinesFor, isLateRenewal } from '@/data/businessTypes'
import {
  applicationNo,
  certificateNo as certificateNoFor,
  licenceNo as licenceNoFor,
  receiptBookRef,
  receiptNo as receiptNoFor,
  registerSerialNo,
  trackingNo as trackingNoFor,
  txnId,
} from '@/lib/ids'
import { currentFiscalYear, fiscalYearOf } from '@/lib/fiscal'
import { dueDate } from '@/lib/sla'
import { getRegister } from '@/registers'
import type {
  AuditEntry,
  Business,
  Channel,
  CitizenSession,
  FeeLine,
  FieldValue,
  Holding,
  Licence,
  Notice,
  Notification,
  OnlineMethod,
  Owner,
  Payment,
  PaymentMode,
  Receipt,
  RegisterEntry,
  RevenueHead,
  Role,
  Session,
  User,
} from '@/types'

// Bumped when the seed gains records an already-open browser would otherwise miss:
// the persisted state is restored wholesale, so a new register's book would stay
// empty on any machine the demo had been shown on before.
const STORAGE_KEY = 'bogcc-demo-v3'

/* ---------- small helpers ---------- */

/** Local-time ISO string, so dates never shift across the timezone boundary. */
function now(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

interface AuditInput {
  action: string
  recordType: AuditEntry['recordType']
  recordKey: string
  recordId: string
  recordLabel: string
  note?: string
  changes?: AuditEntry['changes']
  /** Overrides the acting user; used when a citizen acts, or the gateway does. */
  actor?: { name: string; role: Role }
}

export interface CounterPayment {
  mode: PaymentMode
  txnRef?: string
}

interface StoreState {
  seedDate: string
  session: Session | null
  citizen: CitizenSession | null

  licences: Licence[]
  entries: RegisterEntry[]
  holdings: Holding[]
  payments: Payment[]
  receipts: Receipt[]
  notifications: Notification[]
  notices: Notice[]
  audit: AuditEntry[]
  sequences: Record<string, number>

  /* office session */
  login: (role: Role) => void
  logout: () => void
  switchRole: (role: Role) => void

  /* citizen session */
  citizenLogin: (mobile: string) => void
  citizenLogout: () => void

  /* trade licence */
  createLicence: (input: {
    business: Business
    owner: Owner
    channel: Channel
    kind?: Licence['kind']
    renewalOf?: string
  }) => Licence
  verifyLicence: (id: string, note: string) => void
  approveLicence: (id: string) => { serial: number; registerNo: string } | undefined
  cancelLicence: (id: string, reason: string) => void

  /* config-driven registers */
  createEntry: (
    registerKey: string,
    data: Record<string, FieldValue>,
    applicant: { name: string; mobile: string; ward: number; channel: Channel },
  ) => RegisterEntry | undefined
  advanceEntry: (id: string, extra?: Record<string, FieldValue>) => string | undefined
  cancelEntry: (id: string, reason: string) => void

  /* money */
  startPayment: (input: {
    target: Payment['target']
    head: RevenueHead
    purpose: string
    payerName: string
    payerMobile: string
    feeLines: FeeLine[]
    channel: Channel
  }) => Payment
  /** The mock gateway succeeded: issue the receipt and advance whatever was paid for. */
  completePayment: (paymentId: string, input: { method: OnlineMethod }) => Receipt | undefined
  failPayment: (paymentId: string) => void
  /** Accounts collects at the counter, which pays and settles in one step. */
  collectAtCounter: (
    input: Parameters<StoreState['startPayment']>[0],
    payment: CounterPayment,
  ) => Receipt | undefined
  /** Convenience wrappers that build the payment for a specific record. */
  payForLicence: (id: string, channel: Channel) => Payment | undefined
  payForEntry: (id: string, channel: Channel) => Payment | undefined
  payHoldingInstalment: (
    holdingNo: string,
    fiscalYear: string,
    instalmentNo: number,
    channel: Channel,
  ) => Payment | undefined

  /* citizen extras */
  rateRecord: (id: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string) => void
  markMessagesRead: (mobile: string) => void

  /* oversight */
  postNotice: (input: { title: string; body: string }) => Notice

  resetDemo: () => void
}

const seed = buildSeed()

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      /* ---------- internals ---------- */

      /** Bumps a sequence and returns the new value. Sequences never skip. */
      function nextSeq(key: string): number {
        const value = (get().sequences[key] ?? 0) + 1
        set((s) => ({ sequences: { ...s.sequences, [key]: value } }))
        return value
      }

      function actingUser(): User {
        const session = get().session
        return session ? USERS[session.role] : USERS.operator
      }

      /** Appends one append-only audit entry. Called by every mutating action. */
      function log(input: AuditInput) {
        const actor = input.actor ?? actingUser()
        const entry: AuditEntry = {
          id: newId('au'),
          at: now(),
          userName: actor.name,
          role: actor.role,
          action: input.action,
          recordType: input.recordType,
          recordKey: input.recordKey,
          recordId: input.recordId,
          recordLabel: input.recordLabel,
          note: input.note,
          changes: input.changes,
        }
        set((s) => ({ audit: [...s.audit, entry] }))
      }

      /** Queues a simulated SMS. Nothing is ever actually sent. */
      function notify(mobile: string, text: string, trackingNo?: string) {
        if (!mobile) return
        const item: Notification = { id: newId('sm'), mobile, text, at: now(), trackingNo }
        set((s) => ({ notifications: [...s.notifications, item] }))
      }

      function patchLicence(id: string, patch: Partial<Licence>) {
        set((s) => ({ licences: s.licences.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
      }

      function patchEntry(id: string, patch: Partial<RegisterEntry>) {
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
      }

      function trackingFor(at: string): string {
        const year = new Date(at).getFullYear()
        return trackingNoFor(year, nextSeq(SEQ.tracking(year)))
      }

      /** Appends a history step to a licence or an entry. */
      function pushHistory(
        kind: 'licence' | 'entry',
        id: string,
        step: { status: string; byName: string; byRole: Role; note?: string; publicNote?: boolean },
      ) {
        const at = now()
        if (kind === 'licence') {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence) return
          patchLicence(id, { history: [...licence.history, { ...step, at }] })
        } else {
          const entry = get().entries.find((e) => e.id === id)
          if (!entry) return
          patchEntry(id, { history: [...entry.history, { ...step, at }] })
        }
      }

      /**
       * Turns a paid payment into a money receipt and applies whatever the payment
       * was for. This is the single place a receipt is ever created, so the receipt
       * book stays gapless no matter which channel the money came through.
       */
      function settle(payment: Payment, collectedBy: string): Receipt {
        const collectedAt = now()
        const fy = fiscalYearOf(collectedAt)
        const no = nextSeq(SEQ.receipt(fy))
        const { bookNo, pageNo } = receiptBookRef(no)

        const receipt: Receipt = {
          id: newId('rc'),
          no,
          receiptNo: receiptNoFor(fy, no),
          bookNo,
          pageNo,
          fiscalYear: fy,
          head: payment.head,
          channel: payment.channel,
          paymentId: payment.id,
          payerName: payment.payerName,
          purpose: payment.purpose,
          feeLines: payment.feeLines,
          total: payment.total,
          mode: payment.mode,
          method: payment.method,
          txnRef: payment.txnRef,
          collectedBy,
          collectedAt,
          source:
            payment.target.type === 'holding'
              ? { type: 'holding', holdingNo: payment.target.holdingNo }
              : payment.target.type === 'trade-licence'
                ? { type: 'trade-licence', id: payment.target.id }
                : {
                    type: 'register-entry',
                    id: payment.target.id,
                    registerKey: payment.target.registerKey,
                  },
        }

        set((s) => ({
          receipts: [receipt, ...s.receipts],
          payments: s.payments.map((p) =>
            p.id === payment.id ? { ...p, status: 'paid', paidAt: collectedAt, receiptId: receipt.id } : p,
          ),
        }))

        applyPaidTarget(payment, receipt)

        log({
          action: 'ফি আদায়',
          recordType: 'receipt',
          recordKey: payment.head,
          recordId: receipt.id,
          recordLabel: `${receipt.receiptNo} — ${payment.payerName}`,
          note: `${payment.channel === 'online' ? 'অনলাইনে' : `${payment.mode} মাধ্যমে`} ${payment.total} টাকা আদায়; বই নং ${bookNo}, পাতা ${pageNo}।`,
          actor: { name: collectedBy, role: payment.head === 'holding-tax' ? 'revenueOfficer' : 'accounts' },
        })
        notify(
          payment.payerMobile,
          `রসিদ ${receipt.receiptNo}: ${payment.total} টাকা পরিশোধ সম্পন্ন। ধন্যবাদ, বগুড়া সিটি কর্পোরেশন।`,
        )
        return receipt
      }

      /** Moves the record the payment was for into its next state. */
      function applyPaidTarget(payment: Payment, receipt: Receipt) {
        if (payment.target.type === 'trade-licence') {
          const id = payment.target.id
          const found = get().licences.find((l) => l.id === id)
          if (!found) return
          patchLicence(id, {
            status: 'issued',
            closedAt: receipt.collectedAt,
            paymentId: payment.id,
            receiptId: receipt.id,
          })
          pushHistory('licence', id, {
            status: 'issued',
            byName: payment.channel === 'online' ? `${payment.payerName} (অনলাইন)` : USERS.accounts.name,
            byRole: 'accounts',
            note: payment.channel === 'online' ? 'নাগরিক অনলাইনে ফি পরিশোধ করেছেন।' : 'কাউন্টারে ফি আদায় করা হয়েছে।',
            publicNote: true,
          })
          notify(
            found.applicantMobile,
            `${found.trackingNo}: ${citizenLabel(found.serviceKey, 'issued')}`,
            found.trackingNo,
          )
          return
        }

        if (payment.target.type === 'register-entry') {
          const id = payment.target.id
          const entry = get().entries.find((e) => e.id === id)
          const config = entry ? getRegister(entry.registerKey) : undefined
          if (!entry || !config) return
          const payStep = config.steps.find((s) => s.payment)
          if (!payStep) return
          patchEntry(id, { status: payStep.key, paymentId: payment.id, receiptId: receipt.id })
          pushHistory('entry', id, {
            status: payStep.key,
            byName: payment.channel === 'online' ? `${payment.payerName} (অনলাইন)` : USERS.accounts.name,
            byRole: 'accounts',
            note: payment.channel === 'online' ? 'নাগরিক অনলাইনে ফি পরিশোধ করেছেন।' : 'কাউন্টারে ফি আদায় করা হয়েছে।',
            publicNote: true,
          })
          notify(entry.applicantMobile, `${entry.trackingNo}: ${payStep.citizenLabel}`, entry.trackingNo)
          return
        }

        // Holding tax: mark that instalment paid on the matching bill.
        const target = payment.target
        set((s) => ({
          holdings: s.holdings.map((h) => {
            if (h.holdingNo !== target.holdingNo) return h
            return {
              ...h,
              bills: h.bills.map((bill) =>
                bill.fiscalYear !== target.fiscalYear
                  ? bill
                  : {
                      ...bill,
                      instalments: bill.instalments.map((inst) =>
                        inst.no === target.instalment
                          ? { ...inst, paidAt: receipt.collectedAt, receiptId: receipt.id }
                          : inst,
                      ),
                    },
              ),
            }
          }),
        }))
      }

      return {
        seedDate: seed.seedDate,
        session: null,
        citizen: null,
        licences: seed.licences,
        entries: seed.entries,
        holdings: seed.holdings,
        payments: seed.payments,
        receipts: seed.receipts,
        notifications: seed.notifications,
        notices: seed.notices,
        audit: seed.audit,
        sequences: seed.sequences,

        /* ---------- sessions ---------- */

        login: (role) => set({ session: { role, name: USERS[role].name, since: now() } }),
        logout: () => set({ session: null }),
        switchRole: (role) => {
          const session = get().session
          if (!session || session.role === role) return
          set({ session: { role, name: USERS[role].name, since: now() } })
        },

        citizenLogin: (mobile) => set({ citizen: { mobile, since: now() } }),
        citizenLogout: () => set({ citizen: null }),

        /* ---------- trade licence ---------- */

        createLicence: ({ business, owner, channel, kind = 'new', renewalOf }) => {
          const createdAt = now()
          const fy = currentFiscalYear()
          const serviceKey = kind === 'renewal' ? 'tl-renew' : 'tl-new'
          const late = kind === 'renewal' && isLateRenewal(fy, createdAt)
          const feeLines = feeLinesFor(business.typeKey, { renewal: kind === 'renewal', late })
          const byName = channel === 'online' ? `${owner.name} (অনলাইন)` : actingUser().name

          const licence: Licence = {
            id: newId('tl'),
            serviceKey,
            trackingNo: trackingFor(createdAt),
            channel,
            applicantName: owner.name,
            applicantMobile: owner.mobile,
            ward: business.ward,
            status: 'submitted',
            history: [
              {
                status: 'submitted',
                at: createdAt,
                byName,
                byRole: channel === 'online' ? 'operator' : actingUser().role,
                note:
                  channel === 'online'
                    ? 'নাগরিক কর্নার থেকে অনলাইনে আবেদন জমা হয়েছে।'
                    : 'কাউন্টারে আবেদন গ্রহণ।',
                publicNote: true,
              },
            ],
            createdAt,
            dueAt: dueDate(createdAt, charterDaysOf(serviceKey)),
            fiscalYear: fy,
            appNo: applicationNo(fy, nextSeq(SEQ.app(fy))),
            kind,
            renewalOf,
            business,
            owner,
            feeLines,
            feeTotal: feeTotalOf(feeLines),
          }

          set((s) => ({ licences: [licence, ...s.licences] }))
          log({
            action: kind === 'renewal' ? 'নবায়ন আবেদন গ্রহণ' : 'আবেদন গ্রহণ',
            recordType: 'trade-licence',
            recordKey: 'trade-licence',
            recordId: licence.id,
            recordLabel: `${business.nameBn} (${licence.appNo})`,
            note: `ট্র্যাকিং নং ${licence.trackingNo}; মোট ফি ${licence.feeTotal} টাকা।`,
          })
          notify(
            owner.mobile,
            `${licence.trackingNo}: ${citizenLabel(serviceKey, 'submitted')}`,
            licence.trackingNo,
          )
          return licence
        },

        verifyLicence: (id, note) => {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence || licence.status !== 'submitted') return
          patchLicence(id, { status: 'verified', verificationNote: note })
          pushHistory('licence', id, {
            status: 'verified',
            byName: USERS.inspector.name,
            byRole: 'inspector',
            note,
            publicNote: true,
          })
          log({
            action: 'মাঠ যাচাই সম্পন্ন',
            recordType: 'trade-licence',
            recordKey: 'trade-licence',
            recordId: id,
            recordLabel: `${licence.business.nameBn} (${licence.appNo})`,
            note,
            changes: [{ field: 'অবস্থা', before: 'আবেদন জমা', after: 'যাচাইকৃত' }],
          })
          notify(
            licence.applicantMobile,
            `${licence.trackingNo}: ${citizenLabel(licence.serviceKey, 'verified')}`,
            licence.trackingNo,
          )
        },

        /** Approval is the only moment a register serial is written. */
        approveLicence: (id) => {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence || licence.status !== 'verified') return undefined
          const serial = nextSeq(SEQ.licence(licence.fiscalYear))
          const registerNo = licenceNoFor(licence.fiscalYear, serial)
          patchLicence(id, { status: 'approved', serial, registerNo })
          pushHistory('licence', id, {
            status: 'approved',
            byName: USERS.licenceOfficer.name,
            byRole: 'licenceOfficer',
            note: `রেজিস্টারে ক্রমিক নং ${serial} লিপিবদ্ধ হয়েছে।`,
            publicNote: true,
          })
          log({
            action: 'অনুমোদন',
            recordType: 'trade-licence',
            recordKey: 'trade-licence',
            recordId: id,
            recordLabel: `${licence.business.nameBn} (${registerNo})`,
            note: `রেজিস্টারে ক্রমিক নং ${serial} লিপিবদ্ধ হয়েছে।`,
            changes: [
              { field: 'অবস্থা', before: 'যাচাইকৃত', after: 'অনুমোদিত' },
              { field: 'ক্রমিক নং', before: '—', after: String(serial) },
              { field: 'লাইসেন্স নং', before: '—', after: registerNo },
            ],
          })
          notify(
            licence.applicantMobile,
            `${licence.trackingNo}: ${citizenLabel(licence.serviceKey, 'approved')}`,
            licence.trackingNo,
          )
          return { serial, registerNo }
        },

        /** Records are never deleted — only cancelled, with a mandatory reason. */
        cancelLicence: (id, reason) => {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence || licence.status === 'cancelled' || !reason.trim()) return
          const at = now()
          const actor = actingUser()
          patchLicence(id, {
            status: 'cancelled',
            closedAt: at,
            cancelled: { at, by: actor.name, reason: reason.trim() },
          })
          pushHistory('licence', id, {
            status: 'cancelled',
            byName: actor.name,
            byRole: actor.role,
            note: reason.trim(),
            publicNote: true,
          })
          log({
            action: 'বাতিল',
            recordType: 'trade-licence',
            recordKey: 'trade-licence',
            recordId: id,
            recordLabel: `${licence.business.nameBn} (${licence.registerNo ?? licence.appNo})`,
            note: reason.trim(),
            changes: [{ field: 'অবস্থা', before: licence.status, after: 'বাতিল' }],
          })
          notify(
            licence.applicantMobile,
            `${licence.trackingNo}: ${citizenLabel(licence.serviceKey, 'cancelled')} — ${reason.trim()}`,
            licence.trackingNo,
          )
        },

        /* ---------- config-driven registers ---------- */

        /** The serial is written the moment the line is created, like the paper book. */
        createEntry: (registerKey, data, applicant) => {
          const config = getRegister(registerKey)
          if (!config) return undefined
          const createdAt = now()
          const rawDate = data[config.dateField]
          const dateValue = typeof rawDate === 'string' || typeof rawDate === 'number' ? String(rawDate) : ''
          const fy = dateValue && config.dateField !== 'createdAt' ? fiscalYearOf(dateValue) : fiscalYearOf(createdAt)
          const serial = nextSeq(SEQ.register(config.serialPrefix, fy))
          const serviceKey = config.serviceKey ?? config.key
          const service = serviceOf(serviceKey)
          const fee = service?.fee.kind === 'fixed' ? (service.fee.amount ?? 0) : 0
          const feeLines: FeeLine[] | undefined = fee > 0 ? [{ label: 'সনদ ফি', amount: fee }] : undefined
          const firstStep = config.steps[0]
          const byName =
            applicant.channel === 'online' ? `${applicant.name} (অনলাইন)` : actingUser().name

          const entry: RegisterEntry = {
            id: newId(config.serialPrefix.toLowerCase()),
            serviceKey,
            trackingNo: trackingFor(createdAt),
            channel: applicant.channel,
            applicantName: applicant.name,
            applicantMobile: applicant.mobile,
            ward: applicant.ward,
            status: firstStep.key,
            history: [
              {
                status: firstStep.key,
                at: createdAt,
                byName,
                byRole: applicant.channel === 'online' ? 'operator' : actingUser().role,
                note:
                  applicant.channel === 'online'
                    ? 'নাগরিক কর্নার থেকে অনলাইনে জমা হয়েছে।'
                    : 'কাউন্টারে গ্রহণ করা হয়েছে।',
                publicNote: true,
              },
            ],
            createdAt,
            dueAt: dueDate(createdAt, charterDaysOf(serviceKey)),
            fiscalYear: fy,
            registerKey,
            slaExempt: !config.citizenFacing,
            serial,
            serialNo: registerSerialNo(config.serialPrefix, fy, serial),
            data,
            feeLines,
            feeTotal: feeLines ? feeTotalOf(feeLines) : undefined,
          }

          set((s) => ({ entries: [entry, ...s.entries] }))
          log({
            action: 'নতুন এন্ট্রি',
            recordType: 'register-entry',
            recordKey: registerKey,
            recordId: entry.id,
            recordLabel: `${entryLabelOf(entry)} (${entry.serialNo})`,
            note: `${config.title}-এ ক্রমিক নং ${serial} লিপিবদ্ধ হয়েছে। ট্র্যাকিং নং ${entry.trackingNo}।`,
          })
          if (config.citizenFacing) {
            notify(
              applicant.mobile,
              `${entry.trackingNo}: ${firstStep.citizenLabel}`,
              entry.trackingNo,
            )
          }
          return entry
        },

        advanceEntry: (id, extra) => {
          const entry = get().entries.find((e) => e.id === id)
          if (!entry || entry.cancelled) return undefined
          const config = getRegister(entry.registerKey)
          if (!config) return undefined
          const index = config.steps.findIndex((s) => s.key === entry.status)
          if (index < 0 || index >= config.steps.length - 1) return undefined
          const step = config.steps[index + 1]
          // A payment step is reached by paying, never by a staff click.
          if (step.payment) return undefined

          const data = { ...entry.data, ...(extra ?? {}) }
          const changes = [{ field: 'অবস্থা', before: entry.status, after: step.label }]
          for (const [key, value] of Object.entries(extra ?? {})) {
            const field = config.fields.find((f) => f.key === key)
            const before = entry.data[key]
            changes.push({
              field: field?.label ?? key,
              before: Array.isArray(before) ? '—' : String(before ?? '') || '—',
              after: Array.isArray(value) ? `${value.length} জন` : String(value),
            })
          }

          const isLast = index + 1 === config.steps.length - 1
          const actor = actingUser()
          const patch: Partial<RegisterEntry> = { status: step.key, data }
          if (isLast) patch.closedAt = now()
          if (isLast && config.printable === 'certificate' && !entry.certificateNo) {
            patch.certificateNo = certificateNoFor(
              entry.fiscalYear,
              nextSeq(SEQ.certificate(entry.fiscalYear)),
            )
          }
          patchEntry(id, patch)
          pushHistory('entry', id, {
            status: step.key,
            byName: actor.name,
            byRole: actor.role,
            publicNote: true,
          })
          log({
            action: step.label,
            recordType: 'register-entry',
            recordKey: entry.registerKey,
            recordId: id,
            recordLabel: `${entryLabelOf({ ...entry, data })} (${entry.serialNo})`,
            note: `অবস্থা পরিবর্তন করে "${step.label}" করা হয়েছে।`,
            changes,
          })
          if (config.citizenFacing) {
            notify(entry.applicantMobile, `${entry.trackingNo}: ${step.citizenLabel}`, entry.trackingNo)
          }
          return step.key
        },

        cancelEntry: (id, reason) => {
          const entry = get().entries.find((e) => e.id === id)
          if (!entry || entry.cancelled || !reason.trim()) return
          const at = now()
          const actor = actingUser()
          patchEntry(id, {
            closedAt: at,
            cancelled: { at, by: actor.name, reason: reason.trim() },
          })
          pushHistory('entry', id, {
            status: 'cancelled',
            byName: actor.name,
            byRole: actor.role,
            note: reason.trim(),
            publicNote: true,
          })
          log({
            action: 'বাতিল',
            recordType: 'register-entry',
            recordKey: entry.registerKey,
            recordId: id,
            recordLabel: `${entryLabelOf(entry)} (${entry.serialNo})`,
            note: reason.trim(),
            changes: [{ field: 'অবস্থা', before: entry.status, after: 'বাতিল' }],
          })
          const config = getRegister(entry.registerKey)
          if (config?.citizenFacing) {
            notify(
              entry.applicantMobile,
              `${entry.trackingNo}: বাতিল করা হয়েছে — ${reason.trim()}`,
              entry.trackingNo,
            )
          }
        },

        /* ---------- money ---------- */

        startPayment: (input) => {
          const payment: Payment = {
            id: newId('pm'),
            status: 'pending',
            head: input.head,
            channel: input.channel,
            purpose: input.purpose,
            payerName: input.payerName,
            payerMobile: input.payerMobile,
            feeLines: input.feeLines,
            total: feeTotalOf(input.feeLines),
            createdAt: now(),
            target: input.target,
          }
          set((s) => ({ payments: [payment, ...s.payments] }))
          return payment
        },

        completePayment: (paymentId, { method }) => {
          const payment = get().payments.find((p) => p.id === paymentId)
          if (!payment || payment.status === 'paid') return undefined
          const paid: Payment = {
            ...payment,
            status: 'paid',
            method,
            channel: 'online',
            txnRef: txnId(Math.random),
          }
          set((s) => ({ payments: s.payments.map((p) => (p.id === paymentId ? paid : p)) }))
          return settle(paid, 'অনলাইন পেমেন্ট গেটওয়ে (ডেমো)')
        },

        failPayment: (paymentId) => {
          set((s) => ({
            payments: s.payments.map((p) => (p.id === paymentId ? { ...p, status: 'failed' } : p)),
          }))
        },

        collectAtCounter: (input, counter) => {
          const payment = get().startPayment({ ...input, channel: 'office' })
          const withMode: Payment = {
            ...payment,
            mode: counter.mode,
            txnRef: counter.txnRef,
            channel: 'office',
          }
          set((s) => ({ payments: s.payments.map((p) => (p.id === payment.id ? withMode : p)) }))
          return settle(withMode, USERS.accounts.name)
        },

        payForLicence: (id, channel) => {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence || licence.status !== 'approved') return undefined
          return get().startPayment({
            target: { type: 'trade-licence', id },
            head: 'trade-licence',
            purpose: `${licence.kind === 'renewal' ? 'ট্রেড লাইসেন্স নবায়ন ফি' : 'ট্রেড লাইসেন্স ফি'} — ${licence.business.nameBn}`,
            payerName: licence.owner.name,
            payerMobile: licence.applicantMobile,
            feeLines: licence.feeLines,
            channel,
          })
        },

        payForEntry: (id, channel) => {
          const entry = get().entries.find((e) => e.id === id)
          const config = entry ? getRegister(entry.registerKey) : undefined
          if (!entry || !config || !entry.feeLines) return undefined
          return get().startPayment({
            target: { type: 'register-entry', id, registerKey: entry.registerKey },
            head: 'certificate',
            purpose: `${config.title.replace(' রেজিস্টার', '')} ফি — ${entry.applicantName}`,
            payerName: entry.applicantName,
            payerMobile: entry.applicantMobile,
            feeLines: entry.feeLines,
            channel,
          })
        },

        payHoldingInstalment: (holdingNo, fiscalYear, instalmentNo, channel) => {
          const holding = get().holdings.find((h) => h.holdingNo === holdingNo)
          const bill = holding?.bills.find((b) => b.fiscalYear === fiscalYear)
          const inst = bill?.instalments.find((i) => i.no === instalmentNo)
          if (!holding || !bill || !inst || inst.paidAt) return undefined
          return get().startPayment({
            target: { type: 'holding', holdingNo, fiscalYear, instalment: instalmentNo },
            head: 'holding-tax',
            purpose: `হোল্ডিং কর — ${holdingNo}, ${instalmentNo}ম কিস্তি (${fiscalYear})`,
            payerName: holding.ownerName,
            payerMobile: holding.ownerMobile,
            feeLines: [{ label: `${instalmentNo}ম কিস্তি`, amount: inst.amount }],
            channel,
          })
        },

        /* ---------- citizen extras ---------- */

        rateRecord: (id, rating, comment) => {
          const at = now()
          const feedback = { rating, comment: comment?.trim() || undefined, at }
          const licence = get().licences.find((l) => l.id === id)
          if (licence) {
            patchLicence(id, { feedback })
          } else {
            const entry = get().entries.find((e) => e.id === id)
            if (!entry) return
            patchEntry(id, { feedback })
          }
          log({
            action: 'নাগরিক মতামত',
            recordType: licence ? 'trade-licence' : 'register-entry',
            recordKey: licence ? 'trade-licence' : 'feedback',
            recordId: id,
            recordLabel: `${rating} তারা`,
            note: feedback.comment,
            actor: { name: 'নাগরিক', role: 'operator' },
          })
        },

        markMessagesRead: (mobile) => {
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.mobile === mobile ? { ...n, read: true } : n,
            ),
          }))
        },

        /* ---------- oversight ---------- */

        postNotice: ({ title, body }) => {
          const actor = actingUser()
          const notice: Notice = {
            id: newId('nt'),
            title: title.trim(),
            body: body.trim(),
            at: now(),
            byName: actor.name,
            byRole: actor.role,
          }
          set((s) => ({ notices: [notice, ...s.notices] }))
          log({
            action: 'নোটিশ প্রকাশ',
            recordType: 'notice',
            recordKey: 'notice',
            recordId: notice.id,
            recordLabel: notice.title,
          })
          return notice
        },

        resetDemo: () => {
          const fresh = buildSeed(new Date())
          const session = get().session
          set({
            seedDate: fresh.seedDate,
            licences: fresh.licences,
            entries: fresh.entries,
            holdings: fresh.holdings,
            payments: fresh.payments,
            receipts: fresh.receipts,
            notifications: fresh.notifications,
            notices: fresh.notices,
            audit: fresh.audit,
            sequences: fresh.sequences,
            citizen: null,
          })
          if (session) {
            log({
              action: 'ডেমো রিসেট',
              recordType: 'system',
              recordKey: 'system',
              recordId: 'demo-reset',
              recordLabel: 'ডেমো তথ্য পুনঃস্থাপন',
              note: 'সকল তথ্য আজকের তারিখ ধরে নতুন করে তৈরি করা হয়েছে।',
            })
          }
        },
      }
    },
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        seedDate: s.seedDate,
        session: s.session,
        citizen: s.citizen,
        licences: s.licences,
        entries: s.entries,
        holdings: s.holdings,
        payments: s.payments,
        receipts: s.receipts,
        notifications: s.notifications,
        notices: s.notices,
        audit: s.audit,
        sequences: s.sequences,
      }),
    },
  ),
)

/**
 * Cross-tab live sync.
 *
 * The side-by-side demo has the Citizen Corner in one window and the Office in
 * another. `storage` fires in every *other* tab when one of them writes, so
 * rehydrating here makes a citizen's submission show up in the office window
 * within about a second, with no refresh and no server.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      void useStore.persist.rehydrate()
    }
  })
}

export { DEMO_CITIZEN_MOBILE }

/* ---------- selectors ---------- */

export function useSession(): Session | null {
  return useStore((s) => s.session)
}

export function useCurrentUser(): User | null {
  const session = useStore((s) => s.session)
  return session ? USERS[session.role] : null
}

export function useRole(): Role | null {
  return useStore((s) => s.session?.role ?? null)
}

export function useCitizen(): CitizenSession | null {
  return useStore((s) => s.citizen)
}

/** Short human label for a register entry. Re-exported so pages have one import. */
export { entryLabelOf as entryLabel }
