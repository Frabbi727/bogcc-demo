import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  SEQ,
  USERS,
  appNoFor,
  buildSeed,
  feeLinesFor,
  feeTotalOf,
  licenceNoFor,
  receiptBookRef,
  registerSerialNo,
} from '@/data/seed'
import { currentFiscalYear, fiscalYearOf } from '@/lib/fiscal'
import { getRegister } from '@/registers'
import type {
  AuditEntry,
  Business,
  FieldChange,
  Licence,
  Owner,
  PaymentMode,
  Receipt,
  RegisterEntry,
  Role,
  Session,
  User,
} from '@/types'

const STORAGE_KEY = 'bogcc-demo-v1'

interface AuditInput {
  action: string
  recordType: AuditEntry['recordType']
  recordKey: string
  recordId: string
  recordLabel: string
  note?: string
  changes?: FieldChange[]
  /** Overrides the acting user, used only by seeded/system entries. */
  actor?: User
}

interface StoreState {
  session: Session | null
  licences: Licence[]
  receipts: Receipt[]
  entries: RegisterEntry[]
  sequences: Record<string, number>
  audit: AuditEntry[]

  login: (role: Role) => void
  logout: () => void
  switchRole: (role: Role) => void

  createLicence: (input: { business: Business; owner: Owner }) => Licence
  verifyLicence: (id: string, note: string) => void
  approveLicence: (id: string) => { serial: number; licenceNo: string } | undefined
  collectFee: (id: string, payment: { mode: PaymentMode; txnRef?: string }) => Receipt | undefined
  cancelLicence: (id: string, reason: string) => void

  createEntry: (registerKey: string, data: Record<string, string | number>) => RegisterEntry | undefined
  advanceEntry: (id: string, extra?: Record<string, string | number>) => string | undefined
  cancelEntry: (id: string, reason: string) => void

  resetDemo: () => void
}

/** Local-time ISO string, so dates never shift across the timezone boundary. */
function now(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

const seed = buildSeed()

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      /** Bumps a sequence and returns the new value. Sequences never skip. */
      function nextSerial(key: string): number {
        const value = (get().sequences[key] ?? 0) + 1
        set((s) => ({ sequences: { ...s.sequences, [key]: value } }))
        return value
      }

      /** Appends one append-only audit entry. Called by every mutating action. */
      function log(input: AuditInput) {
        const session = get().session
        const actor = input.actor ?? (session ? USERS[session.role] : USERS.operator)
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

      function patchLicence(id: string, patch: Partial<Licence>) {
        set((s) => ({
          licences: s.licences.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }))
      }

      function patchEntry(id: string, patch: Partial<RegisterEntry>) {
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }))
      }

      return {
        session: null,
        licences: seed.licences,
        receipts: seed.receipts,
        entries: seed.entries,
        sequences: seed.sequences,
        audit: seed.audit,

        login: (role) => {
          set({ session: { role, name: USERS[role].name, since: now() } })
        },

        logout: () => set({ session: null }),

        switchRole: (role) => {
          const session = get().session
          if (!session || session.role === role) return
          set({ session: { role, name: USERS[role].name, since: now() } })
        },

        /* ---------- Trade licence ---------- */

        createLicence: ({ business, owner }) => {
          const fy = currentFiscalYear()
          const feeLines = feeLinesFor(business.typeKey)
          const licence: Licence = {
            id: newId('tl'),
            appNo: appNoFor(fy, nextSerial(SEQ.app(fy))),
            status: 'submitted',
            fiscalYear: fy,
            business,
            owner,
            feeLines,
            feeTotal: feeTotalOf(feeLines),
            createdAt: now(),
            createdBy: USERS[get().session?.role ?? 'operator'].name,
          }
          set((s) => ({ licences: [licence, ...s.licences] }))
          log({
            action: 'আবেদন গ্রহণ',
            recordType: 'trade-licence',
            recordKey: 'trade-licence',
            recordId: licence.id,
            recordLabel: `${business.nameBn} (${licence.appNo})`,
            note: `নতুন ট্রেড লাইসেন্স আবেদন গ্রহণ করা হয়েছে। মোট ফি ${licence.feeTotal} টাকা।`,
          })
          return licence
        },

        verifyLicence: (id, note) => {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence || licence.status !== 'submitted') return
          patchLicence(id, {
            status: 'verified',
            verifiedAt: now(),
            verifiedBy: USERS.inspector.name,
            verificationNote: note,
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
        },

        /** Approval is the only moment a register serial is written. */
        approveLicence: (id) => {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence || licence.status !== 'verified') return undefined
          const serial = nextSerial(SEQ.licence(licence.fiscalYear))
          const licenceNo = licenceNoFor(licence.fiscalYear, serial)
          patchLicence(id, {
            status: 'approved',
            serial,
            licenceNo,
            approvedAt: now(),
            approvedBy: USERS.officer.name,
          })
          log({
            action: 'অনুমোদন',
            recordType: 'trade-licence',
            recordKey: 'trade-licence',
            recordId: id,
            recordLabel: `${licence.business.nameBn} (${licenceNo})`,
            note: `রেজিস্টারে ক্রমিক নং ${serial} লিপিবদ্ধ হয়েছে।`,
            changes: [
              { field: 'অবস্থা', before: 'যাচাইকৃত', after: 'অনুমোদিত' },
              { field: 'ক্রমিক নং', before: '—', after: String(serial) },
              { field: 'লাইসেন্স নং', before: '—', after: licenceNo },
            ],
          })
          return { serial, licenceNo }
        },

        collectFee: (id, payment) => {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence || licence.status !== 'approved') return undefined
          const collectedAt = now()
          const fy = fiscalYearOf(collectedAt)
          const no = nextSerial(SEQ.receipt(fy))
          const { bookNo, pageNo } = receiptBookRef(no)
          const receipt: Receipt = {
            id: newId('rc'),
            no,
            receiptNo: `MR/${fy}/${String(no).padStart(4, '0')}`,
            bookNo,
            pageNo,
            fiscalYear: fy,
            licenceId: id,
            payerName: licence.owner.name,
            purpose: `ট্রেড লাইসেন্স ফি — ${licence.business.nameBn}`,
            feeLines: licence.feeLines,
            total: licence.feeTotal,
            mode: payment.mode,
            txnRef: payment.txnRef,
            collectedBy: USERS.accounts.name,
            collectedAt,
          }
          set((s) => ({ receipts: [receipt, ...s.receipts] }))
          patchLicence(id, { status: 'issued', issuedAt: collectedAt, receiptId: receipt.id })
          log({
            action: 'ফি আদায় ও ইস্যু',
            recordType: 'trade-licence',
            recordKey: 'trade-licence',
            recordId: id,
            recordLabel: `${licence.business.nameBn} (${licence.licenceNo})`,
            note: `${payment.mode} মাধ্যমে ফি আদায়; রসিদ নং ${receipt.receiptNo}, বই নং ${bookNo}, পাতা ${pageNo}।`,
            changes: [
              { field: 'অবস্থা', before: 'অনুমোদিত', after: 'ইস্যুকৃত' },
              { field: 'রসিদ নং', before: '—', after: receipt.receiptNo },
            ],
          })
          return receipt
        },

        /** Records are never deleted — only cancelled, with a mandatory reason. */
        cancelLicence: (id, reason) => {
          const licence = get().licences.find((l) => l.id === id)
          if (!licence || licence.status === 'cancelled' || !reason.trim()) return
          patchLicence(id, {
            status: 'cancelled',
            cancelledAt: now(),
            cancelledBy: USERS[get().session?.role ?? 'officer'].name,
            cancelReason: reason.trim(),
          })
          log({
            action: 'বাতিল',
            recordType: 'trade-licence',
            recordKey: 'trade-licence',
            recordId: id,
            recordLabel: `${licence.business.nameBn} (${licence.licenceNo ?? licence.appNo})`,
            note: reason.trim(),
            changes: [{ field: 'অবস্থা', before: licence.status, after: 'বাতিল' }],
          })
        },

        /* ---------- Generic registers ---------- */

        /** Serial is written the moment the line is created, like the paper book. */
        createEntry: (registerKey, data) => {
          const config = getRegister(registerKey)
          if (!config) return undefined
          const dateValue = String(data[config.dateField] ?? '')
          const fy = dateValue ? fiscalYearOf(dateValue) : currentFiscalYear()
          const serial = nextSerial(SEQ.register(config.serialPrefix, fy))
          const entry: RegisterEntry = {
            id: newId(config.serialPrefix.toLowerCase()),
            registerKey,
            serial,
            serialNo: registerSerialNo(config.serialPrefix, fy, serial),
            fiscalYear: fy,
            data,
            status: config.statuses[0],
            createdAt: now(),
            createdBy: USERS[get().session?.role ?? 'operator'].name,
          }
          set((s) => ({ entries: [entry, ...s.entries] }))
          log({
            action: 'নতুন এন্ট্রি',
            recordType: 'register-entry',
            recordKey: registerKey,
            recordId: entry.id,
            recordLabel: `${entryLabel(entry)} (${entry.serialNo})`,
            note: `${config.title}-এ ক্রমিক নং ${serial} লিপিবদ্ধ হয়েছে।`,
          })
          return entry
        },

        advanceEntry: (id, extra) => {
          const entry = get().entries.find((e) => e.id === id)
          if (!entry || entry.cancelledAt) return undefined
          const config = getRegister(entry.registerKey)
          if (!config) return undefined
          const index = config.statuses.indexOf(entry.status)
          if (index < 0 || index >= config.statuses.length - 1) return undefined
          const nextStatus = config.statuses[index + 1]

          const data = { ...entry.data, ...(extra ?? {}) }
          const changes: FieldChange[] = [
            { field: 'অবস্থা', before: entry.status, after: nextStatus },
          ]
          for (const [key, value] of Object.entries(extra ?? {})) {
            const field = config.fields.find((f) => f.key === key)
            changes.push({
              field: field?.label ?? key,
              before: String(entry.data[key] ?? '') || '—',
              after: String(value),
            })
          }
          patchEntry(id, { status: nextStatus, data })
          log({
            action: 'অবস্থা পরিবর্তন',
            recordType: 'register-entry',
            recordKey: entry.registerKey,
            recordId: id,
            recordLabel: `${entryLabel({ ...entry, data })} (${entry.serialNo})`,
            note: `অবস্থা পরিবর্তন করে "${nextStatus}" করা হয়েছে।`,
            changes,
          })
          return nextStatus
        },

        cancelEntry: (id, reason) => {
          const entry = get().entries.find((e) => e.id === id)
          if (!entry || entry.cancelledAt || !reason.trim()) return
          patchEntry(id, {
            cancelledAt: now(),
            cancelledBy: USERS[get().session?.role ?? 'officer'].name,
            cancelReason: reason.trim(),
          })
          log({
            action: 'বাতিল',
            recordType: 'register-entry',
            recordKey: entry.registerKey,
            recordId: id,
            recordLabel: `${entryLabel(entry)} (${entry.serialNo})`,
            note: reason.trim(),
            changes: [{ field: 'অবস্থা', before: entry.status, after: 'বাতিল' }],
          })
        },

        resetDemo: () => {
          const fresh = buildSeed()
          const session = get().session
          set({
            licences: fresh.licences,
            receipts: fresh.receipts,
            entries: fresh.entries,
            sequences: fresh.sequences,
            audit: fresh.audit,
          })
          if (session) {
            log({
              action: 'ডেমো রিসেট',
              recordType: 'system',
              recordKey: 'system',
              recordId: 'demo-reset',
              recordLabel: 'ডেমো তথ্য পুনঃস্থাপন',
              note: 'সকল তথ্য প্রাথমিক কাল্পনিক তথ্যে ফিরিয়ে আনা হয়েছে।',
            })
          }
        },
      }
    },
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        session: s.session,
        licences: s.licences,
        receipts: s.receipts,
        entries: s.entries,
        sequences: s.sequences,
        audit: s.audit,
      }),
    },
  ),
)

/** Short human label for a register entry, used in audit rows and search. */
export function entryLabel(entry: RegisterEntry): string {
  const config = getRegister(entry.registerKey)
  if (!config) return entry.serialNo
  const parts = config.fields
    .filter((f) => f.showInBook && f.type !== 'date')
    .slice(0, 2)
    .map((f) => String(entry.data[f.key] ?? ''))
    .filter(Boolean)
  return parts.length ? parts.join(' — ') : entry.serialNo
}

/* ---------- Selectors ---------- */

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
