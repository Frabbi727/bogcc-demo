/**
 * Seed data for the demo.
 *
 * EVERY person, business, NID and phone number here is invented; only the Bogura
 * area names are real. The data is generated **relative to the day the demo is
 * shown**, so the dashboards are never empty and "today's collection" always has
 * something in it. A seeded PRNG keyed on that date keeps it identical on every
 * machine and across reloads of the same day.
 */

import { toBnDigits } from '@/lib/bn'
import { fiscalYearOf } from '@/lib/fiscal'
import {
  certificateNo as certificateNoFor,
  applicationNo,
  holdingNo as holdingNoFor,
  licenceNo as licenceNoFor,
  receiptBookRef,
  receiptNo as receiptNoFor,
  registerSerialNo,
  trackingNo as trackingNoFor,
  txnId,
} from '@/lib/ids'
import { makeRandom, type Rng } from '@/lib/random'
import { dueDate } from '@/lib/sla'
import { REGISTERS, getRegister } from '@/registers'
import type {
  AuditEntry,
  BusinessNature,
  Channel,
  FeeLine,
  Heir,
  Holding,
  HoldingBill,
  HoldingInstalment,
  Licence,
  LicenceStatus,
  Notice,
  Notification,
  OnlineMethod,
  Payment,
  PaymentMode,
  PropertyType,
  Receipt,
  RegisterEntry,
  RevenueHead,
  Role,
  HistoryStep,
} from '@/types'
import { BUSINESS_TYPES, feeLinesFor, feeTotalOf, isLateRenewal } from './businessTypes'
import {
  BUSINESS_NAMES,
  BUSINESS_NAMES_EN,
  CLEANING_TEAMS,
  DESIGNERS,
  DRIVERS,
  FATHER_NAMES,
  FEMALE_NAMES,
  HEIR_RELATIONS,
  MALE_NAMES,
  MARKETS,
  MATERIALS,
  MOTHER_NAMES,
  ROADS,
  SHOP_TRADES,
  SUPERVISORS,
  TECHNICIANS,
  VEHICLES,
} from './names'
import { charterDaysOf, fixedFeeOf } from './services'
import { USERS } from './users'
import { AREAS, WARDS } from './wards'

/**
 * Re-exports for convenience. The definitions live in `users.ts`, `wards.ts` and
 * `businessTypes.ts`; pages may import from either place.
 */
export { USERS, ROLE_ORDER, roleTitle, userFor } from './users'
export { WARDS, AREAS, WARD_INFO, WARD_COUNT, wardInfo, COUNCILLOR_WARD } from './wards'
export {
  BUSINESS_TYPES,
  BUSINESS_NATURES,
  FORM_AND_BOOK_FEE,
  VAT_RATE,
  businessTypeOf,
  feeLinesFor,
  feeTotalOf,
  isLateRenewal,
} from './businessTypes'
export { receiptBookRef, registerSerialNo } from '@/lib/ids'

export const PAYMENT_MODES: PaymentMode[] = ['নগদ', 'বিকাশ', 'ব্যাংক']
export const ONLINE_METHODS: OnlineMethod[] = ['bKash', 'Nagad', 'কার্ড']
export const PROPERTY_TYPES: PropertyType[] = ['আবাসিক', 'বাণিজ্যিক', 'মিশ্র']

/** The mobile number the presenter uses to demonstrate citizen tracking. */
export const DEMO_CITIZEN_MOBILE = '01700000000'

export const SEQ = {
  tracking: (year: number) => `tracking-${year}`,
  app: (fy: string) => `app-${fy}`,
  licence: (fy: string) => `TL-${fy}`,
  receipt: (fy: string) => `receipt-${fy}`,
  register: (prefix: string, fy: string) => `${prefix}-${fy}`,
  certificate: (fy: string) => `cert-${fy}`,
}

export interface SeedData {
  /** The day the data was generated, so the UI can say how fresh it is. */
  seedDate: string
  licences: Licence[]
  entries: RegisterEntry[]
  holdings: Holding[]
  payments: Payment[]
  receipts: Receipt[]
  notifications: Notification[]
  notices: Notice[]
  audit: AuditEntry[]
  /** `<sequence key>` -> last used number. Serials never skip a number. */
  sequences: Record<string, number>
}

/* ---------- date helpers ---------- */

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

/** Local-time ISO string; no `Z`, so a calendar day never shifts by timezone. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function dateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function shift(from: string, days: number, hour?: number, minute?: number): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  if (hour !== undefined) d.setHours(hour, minute ?? 0, 0, 0)
  return iso(d)
}

/* ---------- builder ---------- */

export function buildSeed(today: Date = new Date()): SeedData {
  const rng = makeRandom(`bogcc-${dateOnly(today)}`)

  const sequences: Record<string, number> = {}
  const nextSeq = (key: string): number => {
    sequences[key] = (sequences[key] ?? 0) + 1
    return sequences[key]
  }

  const licences: Licence[] = []
  const entries: RegisterEntry[] = []
  const holdings: Holding[] = []
  const payments: Payment[] = []
  const receipts: Receipt[] = []
  const notifications: Notification[] = []
  const notices: Notice[] = []
  const audit: AuditEntry[] = []

  let auditCount = 0
  function log(e: Omit<AuditEntry, 'id'>) {
    auditCount += 1
    audit.push({ id: `au${pad(auditCount, 5)}`, ...e })
  }

  let smsCount = 0
  function sms(mobile: string, text: string, at: string, trackingNo?: string) {
    smsCount += 1
    notifications.push({
      id: `sm${pad(smsCount, 5)}`,
      mobile,
      text,
      at,
      trackingNo,
      // Older messages are treated as already read.
      read: new Date(at).getTime() < today.getTime() - 3 * 86400_000,
    })
  }

  /** A day offset in the past, at a plausible office hour. */
  function pastDay(minDaysAgo: number, maxDaysAgo: number): string {
    const days = rng.int(minDaysAgo, maxDaysAgo)
    const d = new Date(today)
    d.setDate(d.getDate() - days)
    d.setHours(rng.int(10, 16), rng.int(0, 59), 0, 0)
    return iso(d)
  }

  function mobile(): string {
    const prefix = rng.pick(['013', '014', '015', '016', '017', '018', '019'])
    return prefix + String(rng.int(10_000_000, 99_999_999))
  }

  function nid(): string {
    return String(rng.int(1_000_000_000, 9_999_999_999))
  }

  function trackingFor(at: string): string {
    const year = new Date(at).getFullYear()
    return trackingNoFor(year, nextSeq(SEQ.tracking(year)))
  }

  /* ---------- payment events, collected then numbered in time order ---------- */

  interface PayEvent {
    at: string
    head: RevenueHead
    channel: Channel
    purpose: string
    payerName: string
    payerMobile: string
    feeLines: FeeLine[]
    total: number
    mode?: PaymentMode
    method?: OnlineMethod
    target: Payment['target']
    source: Receipt['source']
    /** Writes the allocated ids back onto whatever record this paid for. */
    link: (paymentId: string, receiptId: string) => void
  }

  const payEvents: PayEvent[] = []

  /**
   * How many still-open records may be past their charter deadline. The spec wants
   * a handful — enough to demonstrate the overdue list, not so many that the office
   * looks broken. Budgeted per area, because licences are generated first and would
   * otherwise use the lot, leaving the complaint registers with none to show.
   */
  const overdueBudget = { licence: rng.int(2, 3), entry: rng.int(3, 5) }

  /**
   * Creation date for a record that is still open. Most are recent enough to be
   * comfortably inside the charter; a budgeted few are backdated past it.
   */
  function openCreatedAt(serviceKey: string, area: 'licence' | 'entry'): string {
    const charter = Math.max(1, charterDaysOf(serviceKey))
    if (overdueBudget[area] > 0 && rng.chance(0.35)) {
      overdueBudget[area] -= 1
      return pastDay(charter + 6, charter + 16)
    }
    return pastDay(0, Math.max(1, charter - 1))
  }

  /* ================= Trade licences ================= */

  // Counts chosen so every status tab and both kinds have something to show.
  const LICENCE_PLAN: { status: LicenceStatus; count: number }[] = [
    { status: 'issued', count: 26 },
    { status: 'approved', count: 5 },
    { status: 'verified', count: 5 },
    { status: 'submitted', count: 7 },
    { status: 'cancelled', count: 2 },
  ]

  interface LicenceDraft {
    licence: Licence
    approvedAt?: string
    paidAt?: string
  }

  const licenceDrafts: LicenceDraft[] = []
  let licenceIndex = 0

  for (const plan of LICENCE_PLAN) {
    for (let i = 0; i < plan.count; i += 1) {
      licenceIndex += 1
      const status = plan.status
      const kind: Licence['kind'] = rng.chance(0.3) ? 'renewal' : 'new'
      const serviceKey = kind === 'renewal' ? 'tl-renew' : 'tl-new'
      const channel: Channel = rng.chance(0.4) ? 'online' : 'office'

      // Issued licences spread across the last 14 months; open ones are recent,
      // except a few deliberately left old so the SLA list is not empty.
      const createdAt =
        status === 'issued'
          ? pastDay(2, 420)
          : status === 'cancelled'
            ? pastDay(30, 200)
            : openCreatedAt(serviceKey, 'licence')

      const fiscalYear = fiscalYearOf(createdAt)
      const type = rng.pick(BUSINESS_TYPES)
      const nameBn = rng.pick(BUSINESS_NAMES[type.key])
      const ward = rng.pick(WARDS)
      const area = rng.pick(AREAS)
      const ownerName = rng.chance(0.25) ? rng.pick(FEMALE_NAMES) : rng.pick(MALE_NAMES)
      const late = kind === 'renewal' && isLateRenewal(fiscalYear, createdAt)
      const feeLines = feeLinesFor(type.key, { renewal: kind === 'renewal', late })
      const applicantMobile = mobile()

      const history: HistoryStep[] = []
      const push = (
        statusKey: string,
        at: string,
        role: Role,
        note?: string,
        publicNote?: boolean,
      ) => {
        history.push({
          status: statusKey,
          at,
          byName: channel === 'online' && statusKey === 'submitted' ? `${ownerName} (অনলাইন)` : USERS[role].name,
          byRole: role,
          note,
          publicNote,
        })
      }

      push(
        'submitted',
        createdAt,
        'operator',
        channel === 'online' ? 'নাগরিক কর্নার থেকে অনলাইনে আবেদন জমা হয়েছে।' : 'কাউন্টারে আবেদন গ্রহণ।',
        true,
      )

      let verifiedAt: string | undefined
      let approvedAt: string | undefined
      let paidAt: string | undefined
      let closedAt: string | undefined
      let cancelled: Licence['cancelled']

      const reached = (s: LicenceStatus) =>
        ['submitted', 'verified', 'approved', 'issued'].indexOf(status) >=
        ['submitted', 'verified', 'approved', 'issued'].indexOf(s)

      if (status !== 'submitted' && status !== 'cancelled' && reached('verified')) {
        verifiedAt = shift(createdAt, rng.int(1, 3), rng.int(11, 15))
        push(
          'verified',
          verifiedAt,
          'inspector',
          kind === 'renewal'
            ? 'নবায়ন — কাগজপত্র যাচাই সম্পন্ন, সরেজমিনে পরিদর্শনের প্রয়োজন হয়নি।'
            : 'সরেজমিনে প্রতিষ্ঠান পরিদর্শন করা হয়েছে; তথ্য সঠিক পাওয়া গেছে।',
          true,
        )
      }
      if (reached('approved') && status !== 'cancelled') {
        approvedAt = shift(verifiedAt ?? createdAt, rng.int(1, 3), rng.int(11, 16))
        push('approved', approvedAt, 'licenceOfficer', undefined, true)
      }
      if (status === 'issued') {
        paidAt = shift(approvedAt ?? createdAt, rng.int(0, 3), rng.int(10, 16))
        closedAt = paidAt
      }
      if (status === 'cancelled') {
        verifiedAt = shift(createdAt, rng.int(1, 3), 12)
        push('verified', verifiedAt, 'inspector', 'সরেজমিনে পরিদর্শন করা হয়েছে।', true)
        const at = shift(verifiedAt, rng.int(1, 5), 15)
        cancelled = {
          at,
          by: USERS.licenceOfficer.name,
          reason: rng.pick([
            'আবেদনে উল্লিখিত ঠিকানায় কোনো প্রতিষ্ঠান পাওয়া যায়নি।',
            'আবেদনকারী নির্ধারিত সময়ে প্রয়োজনীয় কাগজপত্র জমা দেননি।',
          ]),
        }
        history.push({
          status: 'cancelled',
          at,
          byName: USERS.licenceOfficer.name,
          byRole: 'licenceOfficer',
          note: cancelled.reason,
          publicNote: true,
        })
        closedAt = at
      }

      const licence: Licence = {
        id: `tl${pad(licenceIndex, 3)}`,
        serviceKey,
        trackingNo: trackingFor(createdAt),
        channel,
        applicantName: ownerName,
        applicantMobile,
        ward,
        status,
        history,
        createdAt,
        dueAt: dueDate(createdAt, charterDaysOf(serviceKey)),
        closedAt,
        fiscalYear,
        cancelled,
        appNo: '',
        kind,
        business: {
          nameBn,
          nameEn: BUSINESS_NAMES_EN[nameBn] ?? nameBn,
          typeKey: type.key,
          nature: rng.pick<BusinessNature>(['একক', 'একক', 'অংশীদারি', 'কোম্পানি']),
          address: `${rng.pick(ROADS)}, ${area}`,
          area,
          ward,
          holdingNo: holdingNoFor(ward, rng.int(1, 400)),
        },
        owner: {
          name: ownerName,
          fatherName: rng.pick(FATHER_NAMES),
          motherName: rng.pick(MOTHER_NAMES),
          nid: nid(),
          mobile: applicantMobile,
        },
        feeLines,
        feeTotal: feeTotalOf(feeLines),
        verificationNote: verifiedAt
          ? 'সরেজমিনে তথ্য যাচাই করা হয়েছে; প্রতিষ্ঠান চালু অবস্থায় পাওয়া গেছে।'
          : undefined,
      }

      licenceDrafts.push({ licence, approvedAt, paidAt })
      licences.push(licence)
    }
  }

  // Application numbers follow submission order, so the sequence is gapless.
  for (const { licence } of [...licenceDrafts].sort((a, b) =>
    a.licence.createdAt.localeCompare(b.licence.createdAt),
  )) {
    licence.appNo = applicationNo(licence.fiscalYear, nextSeq(SEQ.app(licence.fiscalYear)))
  }

  // The register serial is written at approval — the moment a new line would be
  // added to the paper book — so serials follow approval order, not submission.
  for (const draft of [...licenceDrafts]
    .filter((d) => !!d.approvedAt)
    .sort((a, b) => (a.approvedAt ?? '').localeCompare(b.approvedAt ?? ''))) {
    const { licence } = draft
    const serial = nextSeq(SEQ.licence(licence.fiscalYear))
    licence.serial = serial
    licence.registerNo = licenceNoFor(licence.fiscalYear, serial)
  }

  for (const draft of licenceDrafts) {
    const { licence, paidAt } = draft
    // Audit and SMS for every step that actually happened.
    for (const step of licence.history) {
      log({
        at: step.at,
        userName: step.byName,
        role: step.byRole,
        action: LICENCE_ACTION[step.status] ?? step.status,
        recordType: 'trade-licence',
        recordKey: 'trade-licence',
        recordId: licence.id,
        recordLabel: `${licence.business.nameBn} (${licence.registerNo ?? licence.appNo})`,
        note: step.note,
        changes:
          step.status === 'approved' && licence.serial
            ? [
                { field: 'ক্রমিক নং', before: '—', after: String(licence.serial) },
                { field: 'লাইসেন্স নং', before: '—', after: licence.registerNo ?? '' },
              ]
            : undefined,
      })
      sms(
        licence.applicantMobile,
        `${licence.trackingNo}: ${LICENCE_SMS[step.status] ?? step.status}`,
        step.at,
        licence.trackingNo,
      )
    }

    if (paidAt) {
      const online = licence.channel === 'online' && rng.chance(0.75)
      payEvents.push({
        at: paidAt,
        head: 'trade-licence',
        channel: online ? 'online' : 'office',
        purpose: `${licence.kind === 'renewal' ? 'ট্রেড লাইসেন্স নবায়ন ফি' : 'ট্রেড লাইসেন্স ফি'} — ${licence.business.nameBn}`,
        payerName: licence.owner.name,
        payerMobile: licence.applicantMobile,
        feeLines: licence.feeLines,
        total: licence.feeTotal,
        mode: online ? undefined : rng.pick(PAYMENT_MODES),
        method: online ? rng.pick(ONLINE_METHODS) : undefined,
        target: { type: 'trade-licence', id: licence.id },
        source: { type: 'trade-licence', id: licence.id },
        link: (paymentId, receiptId) => {
          licence.paymentId = paymentId
          licence.receiptId = receiptId
        },
      })
      licence.history.push({
        status: 'issued',
        at: paidAt,
        byName: online ? `${licence.owner.name} (অনলাইন)` : USERS.accounts.name,
        byRole: 'accounts',
        note: online ? 'নাগরিক অনলাইনে ফি পরিশোধ করেছেন।' : 'কাউন্টারে ফি আদায় করা হয়েছে।',
        publicNote: true,
      })
      sms(licence.applicantMobile, `${licence.trackingNo}: ${LICENCE_SMS.issued}`, paidAt, licence.trackingNo)
    }

    // Citizens rate a finished service most of the time.
    if (licence.status === 'issued' && rng.chance(0.65)) {
      licence.feedback = makeFeedback(rng, shift(licence.closedAt ?? licence.createdAt, 1, 19))
    }
  }

  /* ================= Register entries ================= */

  const ENTRY_PLAN: { key: string; count: number }[] = [
    { key: 'streetlight', count: 35 },
    { key: 'garbage', count: 30 },
    { key: 'garbage-trips', count: 40 },
    { key: 'cert-citizen', count: 20 },
    { key: 'cert-warish', count: 8 },
    { key: 'market-rent', count: 36 },
    { key: 'rickshaw-licence', count: 24 },
    { key: 'building-plan', count: 14 },
    { key: 'birth-death', count: 26 },
  ]

  /**
   * Books the office writes in every day rather than case by case. Their lines are
   * dated across the last few weeks so the daily view is never empty.
   */
  const DAILY_BOOKS = new Set(['garbage-trips', 'market-rent', 'birth-death'])

  let entryIndex = 0

  for (const plan of ENTRY_PLAN) {
    const config = getRegister(plan.key)
    if (!config) continue
    const stepKeys = config.steps.map((s) => s.key)

    for (let i = 0; i < plan.count; i += 1) {
      entryIndex += 1

      // How far through the workflow this line has got. Most are finished; a few
      // sit at each earlier step so every status filter has rows.
      // Any intermediate step must be reachable, otherwise statuses in the middle
      // of a longer workflow (a certificate's "ফি পরিশোধিত") never appear at all.
      const roll = rng.next()
      let reachedIndex =
        roll < 0.62 ? stepKeys.length - 1 : rng.int(0, Math.max(0, stepKeys.length - 2))
      const isCancelled = rng.chance(0.04) && stepKeys.length > 1
      if (isCancelled) reachedIndex = Math.min(reachedIndex, stepKeys.length - 2)

      const finished = reachedIndex === stepKeys.length - 1
      const serviceKey = config.serviceKey ?? plan.key
      // Trip logs are a daily book, so they only cover the last few weeks.
      const createdAt = DAILY_BOOKS.has(plan.key)
        ? // The first few lines of a daily book are dated today, so the daily card
          // on the dashboard is never empty whenever the demo is shown.
          i < 4
          ? pastDay(0, 0)
          : pastDay(1, 25)
        : finished
          ? pastDay(2, 400)
          : openCreatedAt(serviceKey, 'entry')

      const fiscalYear = fiscalYearOf(createdAt)
      const ward = pickWardWithContrast(rng, plan.key)
      const channel: Channel = config.citizenFacing && rng.chance(0.45) ? 'online' : 'office'
      const applicantName = rng.chance(0.3) ? rng.pick(FEMALE_NAMES) : rng.pick(MALE_NAMES)
      const applicantMobile = mobile()

      const data = buildEntryData(rng, plan.key, { ward, applicantName, applicantMobile, createdAt })
      const fee = fixedFeeOf(serviceKey)
      const feeLines: FeeLine[] | undefined = fee > 0 ? [{ label: 'সনদ ফি', amount: fee }] : undefined

      const history: HistoryStep[] = []
      let cursor = createdAt
      let paidAt: string | undefined
      let closedAt: string | undefined

      for (let s = 0; s <= reachedIndex; s += 1) {
        const step = config.steps[s]
        const actorRole: Role = step.actors[0] ?? 'operator'
        if (s > 0) cursor = shift(cursor, rng.int(0, 3), rng.int(10, 16))
        if (step.payment) paidAt = cursor
        history.push({
          status: step.key,
          at: cursor,
          byName:
            s === 0 && channel === 'online' ? `${applicantName} (অনলাইন)` : USERS[actorRole].name,
          byRole: actorRole,
          note: stepNote(rng, plan.key, step.key),
          publicNote: true,
        })
        // Staff fields are only filled at the step that asks for them.
        for (const key of step.requiredFields ?? []) {
          if (data[key] === undefined) {
            data[key] = staffFieldValue(rng, key, cursor, data)
          }
        }
      }
      if (finished) closedAt = cursor

      let cancelled: RegisterEntry['cancelled']
      if (isCancelled) {
        const at = shift(cursor, rng.int(1, 4), 15)
        const by = USERS[config.cancelRoles[0] ?? 'ceo']
        cancelled = { at, by: by.name, reason: rng.pick(CANCEL_REASONS) }
        history.push({
          status: 'cancelled',
          at,
          byName: by.name,
          byRole: by.role,
          note: cancelled.reason,
          publicNote: true,
        })
        closedAt = at
      }

      const entry: RegisterEntry = {
        id: `${config.serialPrefix.toLowerCase()}${pad(entryIndex, 3)}`,
        serviceKey,
        trackingNo: trackingFor(createdAt),
        channel,
        applicantName,
        applicantMobile,
        ward,
        status: history[history.length - 1].status === 'cancelled'
          ? stepKeys[reachedIndex]
          : stepKeys[reachedIndex],
        history,
        createdAt,
        dueAt: dueDate(createdAt, charterDaysOf(serviceKey)),
        closedAt,
        fiscalYear,
        cancelled,
        registerKey: config.key,
        slaExempt: !config.citizenFacing,
        serial: 0,
        serialNo: '',
        data,
        feeLines,
        feeTotal: feeLines ? feeTotalOf(feeLines) : undefined,
      }

      if (finished && config.printable === 'certificate') {
        entry.certificateNo = certificateNoFor(fiscalYear, nextSeq(SEQ.certificate(fiscalYear)))
      }
      if (config.citizenFacing && finished && !isCancelled && rng.chance(0.6)) {
        entry.feedback = makeFeedback(rng, shift(closedAt ?? createdAt, 1, 20))
      }

      if (paidAt && feeLines) {
        const online = channel === 'online' && rng.chance(0.7)
        payEvents.push({
          at: paidAt,
          head: 'certificate',
          channel: online ? 'online' : 'office',
          purpose: `${config.title.replace(' রেজিস্টার', '')} ফি — ${applicantName}`,
          payerName: applicantName,
          payerMobile: applicantMobile,
          feeLines,
          total: feeTotalOf(feeLines),
          mode: online ? undefined : rng.pick(PAYMENT_MODES),
          method: online ? rng.pick(ONLINE_METHODS) : undefined,
          target: { type: 'register-entry', id: entry.id, registerKey: config.key },
          source: { type: 'register-entry', id: entry.id, registerKey: config.key },
          link: (paymentId, receiptId) => {
            entry.paymentId = paymentId
            entry.receiptId = receiptId
          },
        })
      }

      entries.push(entry)
    }
  }

  // Engine serials are written on creation, so they follow creation order.
  for (const config of REGISTERS) {
    for (const entry of entries
      .filter((e) => e.registerKey === config.key)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const serial = nextSeq(SEQ.register(config.serialPrefix, entry.fiscalYear))
      entry.serial = serial
      entry.serialNo = registerSerialNo(config.serialPrefix, entry.fiscalYear, serial)
    }
  }

  for (const entry of entries) {
    const config = getRegister(entry.registerKey)
    if (!config) continue
    for (const step of entry.history) {
      log({
        at: step.at,
        userName: step.byName,
        role: step.byRole,
        action: step.status === 'cancelled' ? 'বাতিল' : (config.steps.find((s) => s.key === step.status)?.label ?? step.status),
        recordType: 'register-entry',
        recordKey: config.key,
        recordId: entry.id,
        recordLabel: `${entryLabelOf(entry)} (${entry.serialNo})`,
        note: step.note,
      })
      if (config.citizenFacing) {
        const label = config.steps.find((s) => s.key === step.status)?.citizenLabel ?? 'অবস্থা পরিবর্তন'
        sms(entry.applicantMobile, `${entry.trackingNo}: ${label}`, step.at, entry.trackingNo)
      }
    }
  }

  /* ================= Holdings ================= */

  const currentFy = fiscalYearOf(today)
  const previousFy = `${Number(currentFy.slice(0, 4)) - 1}-${pad(Number(currentFy.slice(0, 4)) % 100)}`

  for (let i = 1; i <= 60; i += 1) {
    const ward = rng.pick(WARDS)
    const area = rng.pick(AREAS)
    const propertyType = rng.pick(PROPERTY_TYPES)
    const floors = propertyType === 'আবাসিক' ? rng.int(1, 3) : rng.int(1, 5)
    const annualValuation = rng.int(12, 90) * 5000
    const ownerName = rng.chance(0.28) ? rng.pick(FEMALE_NAMES) : rng.pick(MALE_NAMES)

    const bill = buildHoldingBill(rng, currentFy, annualValuation)
    const holding: Holding = {
      holdingNo: holdingNoFor(ward, i),
      ward,
      ownerName,
      ownerMobile: mobile(),
      address: `${rng.pick(ROADS)}, ${area}`,
      area,
      propertyType,
      floors,
      annualValuation,
      bills: [bill],
    }

    // Some holdings carry unpaid demand from last year, which is what the
    // defaulter list and the arrears surcharge are there to show.
    if (rng.chance(0.35)) {
      const previous = buildHoldingBill(rng, previousFy, Math.round(annualValuation * 0.95))
      previous.instalments = previous.instalments.map((inst) => ({ ...inst }))
      bill.arrears = previous.total
      bill.surcharge = Math.round(previous.total * 0.05)
      holding.bills.unshift(previous)
    }

    // How much of this year's demand has been collected so far.
    const paidCount = rng.chance(0.2) ? 0 : rng.int(1, 4)
    for (let q = 0; q < paidCount; q += 1) {
      const inst = bill.instalments[q]
      const at = pastDay(1, 300)
      const online = rng.chance(0.35)
      payEvents.push({
        at,
        head: 'holding-tax',
        channel: online ? 'online' : 'office',
        purpose: `হোল্ডিং কর — ${holding.holdingNo}, ${toBnDigits(q + 1)}ম কিস্তি (${toBnDigits(currentFy)})`,
        payerName: holding.ownerName,
        payerMobile: holding.ownerMobile,
        feeLines: [{ label: `${q + 1}ম কিস্তি`, amount: inst.amount }],
        total: inst.amount,
        mode: online ? undefined : rng.pick(PAYMENT_MODES),
        method: online ? rng.pick(ONLINE_METHODS) : undefined,
        target: {
          type: 'holding',
          holdingNo: holding.holdingNo,
          fiscalYear: currentFy,
          instalment: inst.no,
        },
        source: { type: 'holding', holdingNo: holding.holdingNo },
        link: (_paymentId, receiptId) => {
          inst.paidAt = at
          inst.receiptId = receiptId
        },
      })
    }

    holdings.push(holding)
  }

  /* ================= Payments and receipts, in collection order ================= */

  payEvents.sort((a, b) => a.at.localeCompare(b.at))

  payEvents.forEach((event, index) => {
    const fy = fiscalYearOf(event.at)
    const no = nextSeq(SEQ.receipt(fy))
    const { bookNo, pageNo } = receiptBookRef(no)
    const paymentId = `pm${pad(index + 1, 4)}`
    const receiptId = `rc${pad(index + 1, 4)}`

    const payment: Payment = {
      id: paymentId,
      status: 'paid',
      head: event.head,
      channel: event.channel,
      purpose: event.purpose,
      payerName: event.payerName,
      payerMobile: event.payerMobile,
      feeLines: event.feeLines,
      total: event.total,
      createdAt: event.at,
      paidAt: event.at,
      mode: event.mode,
      method: event.method,
      txnRef: event.channel === 'online' ? txnId(rng.next) : undefined,
      receiptId,
      target: event.target,
    }

    const receipt: Receipt = {
      id: receiptId,
      no,
      receiptNo: receiptNoFor(fy, no),
      bookNo,
      pageNo,
      fiscalYear: fy,
      head: event.head,
      channel: event.channel,
      paymentId,
      payerName: event.payerName,
      purpose: event.purpose,
      feeLines: event.feeLines,
      total: event.total,
      mode: event.mode,
      method: event.method,
      txnRef: payment.txnRef,
      collectedBy: event.channel === 'online' ? 'অনলাইন পেমেন্ট গেটওয়ে (ডেমো)' : USERS.accounts.name,
      collectedAt: event.at,
      source: event.source,
    }

    payments.push(payment)
    receipts.push(receipt)
    event.link(paymentId, receiptId)

    log({
      at: event.at,
      userName: receipt.collectedBy,
      role: event.head === 'holding-tax' ? 'revenueOfficer' : 'accounts',
      action: 'ফি আদায়',
      recordType: 'receipt',
      recordKey: event.head,
      recordId: receiptId,
      recordLabel: `${receipt.receiptNo} — ${event.payerName}`,
      note: `${event.channel === 'online' ? 'অনলাইনে' : `${event.mode} মাধ্যমে`} ${event.total} টাকা আদায়; বই নং ${bookNo}, পাতা ${pageNo}।`,
    })
    sms(
      event.payerMobile,
      `রসিদ ${receipt.receiptNo}: ${event.total} টাকা পরিশোধ সম্পন্ন। ধন্যবাদ, বগুড়া সিটি কর্পোরেশন।`,
      event.at,
    )
  })

  /* ================= Notices ================= */

  NOTICE_SEED.forEach((n, i) => {
    const at = pastDay(i * 6 + 1, i * 6 + 6)
    const author = i % 3 === 0 ? USERS.mayor : i % 3 === 1 ? USERS.ceo : USERS.licenceOfficer
    notices.push({
      id: `nt${pad(i + 1, 3)}`,
      title: n.title,
      body: n.body,
      at,
      byName: author.name,
      byRole: author.role,
    })
    log({
      at,
      userName: author.name,
      role: author.role,
      action: 'নোটিশ প্রকাশ',
      recordType: 'notice',
      recordKey: 'notice',
      recordId: `nt${pad(i + 1, 3)}`,
      recordLabel: n.title,
    })
  })

  /* ================= The presenter's demo citizen ================= */

  // Four requests at different stages on one mobile, so "আমার সব আবেদন" always
  // has something interesting to show without hunting for a number.
  const demoPicks = [
    entries.find((e) => e.registerKey === 'streetlight' && !!e.closedAt && !e.cancelled),
    entries.find((e) => e.registerKey === 'garbage' && !e.closedAt),
    entries.find((e) => e.registerKey === 'cert-citizen' && e.status === 'paid') ??
      entries.find((e) => e.registerKey === 'cert-citizen' && !e.closedAt),
    licences.find((l) => l.status === 'approved'),
  ]
  for (const record of demoPicks) {
    if (!record) continue
    const previousMobile = record.applicantMobile
    record.applicantMobile = DEMO_CITIZEN_MOBILE
    if ('owner' in record) record.owner.mobile = DEMO_CITIZEN_MOBILE
    if ('data' in record && record.data.mobile !== undefined) {
      record.data.mobile = DEMO_CITIZEN_MOBILE
    }
    for (const n of notifications) {
      if (n.mobile === previousMobile && n.trackingNo === record.trackingNo) {
        n.mobile = DEMO_CITIZEN_MOBILE
      }
    }
  }

  audit.sort((a, b) => a.at.localeCompare(b.at))
  notifications.sort((a, b) => a.at.localeCompare(b.at))

  return {
    seedDate: iso(today),
    licences,
    entries,
    holdings,
    payments,
    receipts,
    notifications,
    notices,
    audit,
    sequences,
  }
}

/* ---------- small builders ---------- */

const LICENCE_ACTION: Record<string, string> = {
  submitted: 'আবেদন গ্রহণ',
  verified: 'মাঠ যাচাই সম্পন্ন',
  approved: 'অনুমোদন',
  issued: 'ফি আদায় ও ইস্যু',
  cancelled: 'বাতিল',
}

const LICENCE_SMS: Record<string, string> = {
  submitted: 'আপনার ট্রেড লাইসেন্স আবেদন গৃহীত হয়েছে।',
  verified: 'মাঠ পর্যায়ে যাচাই সম্পন্ন হয়েছে।',
  approved: 'আবেদন অনুমোদিত হয়েছে। ফি পরিশোধ করুন।',
  issued: 'ফি পরিশোধ সম্পন্ন; লাইসেন্স প্রস্তুত।',
  cancelled: 'আবেদনটি বাতিল করা হয়েছে (কারণসহ)।',
}

const CANCEL_REASONS = [
  'একই বিষয়ে পূর্বেই অভিযোগ থাকায় নতুন লাইনটি বাতিল করা হলো।',
  'অভিযোগকারীর দেওয়া তথ্য সঠিক পাওয়া যায়নি।',
  'আবেদনকারী নিজেই আবেদন প্রত্যাহার করেছেন।',
]

const NOTICE_SEED = [
  {
    title: 'ট্রেড লাইসেন্স নবায়নের সময়সীমা',
    body: 'চলতি অর্থবছরের ট্রেড লাইসেন্স নবায়নের শেষ সময় ৩০ সেপ্টেম্বর। নির্ধারিত সময়ের পর নবায়ন করলে ১০% বিলম্ব ফি প্রযোজ্য হবে (ডেমো হার)।',
  },
  {
    title: 'হোল্ডিং কর অনলাইনে পরিশোধ',
    body: 'নাগরিক কর্নার থেকে হোল্ডিং নম্বর দিয়ে বকেয়া দেখে কিস্তি বা পূর্ণ অর্থ অনলাইনে পরিশোধ করা যাবে।',
  },
  {
    title: 'পরিচ্ছন্নতা অভিযান — ওয়ার্ড ৫ ও ৬',
    body: 'আগামী সপ্তাহে ওয়ার্ড ৫ ও ৬-এ বিশেষ পরিচ্ছন্নতা অভিযান পরিচালিত হবে। নাগরিকদের নির্দিষ্ট স্থানে বর্জ্য রাখার অনুরোধ করা হচ্ছে।',
  },
  {
    title: 'সড়কবাতি মেরামত কার্যক্রম',
    body: 'শহরের প্রধান সড়কগুলোতে নষ্ট সড়কবাতি পর্যায়ক্রমে মেরামত করা হচ্ছে। অভিযোগ জানাতে নাগরিক কর্নার ব্যবহার করুন।',
  },
  {
    title: 'নাগরিকত্ব সনদের জন্য প্রয়োজনীয় কাগজপত্র',
    body: 'নাগরিকত্ব সনদের আবেদনের সাথে জাতীয় পরিচয়পত্রের কপি ও সর্বশেষ হোল্ডিং কর পরিশোধের রসিদ সংযুক্ত করতে হবে।',
  },
  {
    title: 'অফিস সময়সূচি',
    body: 'সিটি কর্পোরেশন কার্যালয় রবিবার থেকে বৃহস্পতিবার সকাল ৯টা থেকে বিকাল ৫টা পর্যন্ত খোলা থাকবে।',
  },
  {
    title: 'ডিজিটাল রেজিস্টার চালু',
    body: 'হাতে লেখা রেজিস্টার খাতার পাশাপাশি ডিজিটাল রেজিস্টার ব্যবস্থা চালু হয়েছে। এতে আবেদনের অবস্থা নাগরিক নিজেই দেখতে পারবেন।',
  },
  {
    title: 'ওয়ারিশ সনদ আবেদনের নিয়ম',
    body: 'ওয়ারিশ সনদের আবেদনে মৃত্যু সনদের কপি এবং সকল ওয়ারিশের নাম, সম্পর্ক ও বয়সের তালিকা দিতে হবে।',
  },
  {
    title: 'বর্জ্য পরিবহনের নতুন সময়সূচি',
    body: 'আগামী মাস থেকে বর্জ্য সংগ্রহের গাড়ি প্রতিদিন সকাল ৭টা থেকে ১১টার মধ্যে নির্ধারিত রুটে চলাচল করবে।',
  },
  {
    title: 'নাগরিক মতামত আহ্বান',
    body: 'সেবার মান উন্নয়নে নাগরিকদের মতামত ও রেটিং দেওয়ার অনুরোধ করা হচ্ছে। আবেদন সম্পন্ন হলে ট্র্যাকিং পাতায় রেটিং দিতে পারবেন।',
  },
]

/** Ratings average around 4.2, with a few unhappy ones so the number is believable. */
function makeFeedback(rng: Rng, at: string) {
  const roll = rng.next()
  const rating: 1 | 2 | 3 | 4 | 5 = roll < 0.05 ? 2 : roll < 0.15 ? 3 : roll < 0.55 ? 4 : 5
  const comments: Record<number, string[]> = {
    2: ['অনেক দিন ঘুরতে হয়েছে।', 'সময়মতো কাজ হয়নি।'],
    3: ['কাজ হয়েছে, তবে আরেকটু দ্রুত হলে ভালো হতো।'],
    4: ['ভালো সেবা পেয়েছি।', 'অনলাইনে আবেদন করা সহজ ছিল।'],
    5: ['খুব দ্রুত কাজ হয়েছে, ধন্যবাদ।', 'অফিসে যেতে হয়নি, ঘরে বসেই সব হয়েছে।', 'চমৎকার সেবা।'],
  }
  return {
    rating,
    comment: rng.chance(0.7) ? rng.pick(comments[rating]) : undefined,
    at,
  }
}

/** Quarterly demand from the annual valuation, at demo rates. */
function buildHoldingBill(rng: Rng, fiscalYear: string, annualValuation: number): HoldingBill {
  const lines: FeeLine[] = [
    { label: 'হোল্ডিং কর (৭%)', amount: Math.round(annualValuation * 0.07) },
    { label: 'পরিচ্ছন্নতা রেট (৩%)', amount: Math.round(annualValuation * 0.03) },
    { label: 'সড়কবাতি রেট (২%)', amount: Math.round(annualValuation * 0.02) },
  ]
  const total = lines.reduce((s, l) => s + l.amount, 0)
  const quarter = Math.round(total / 4)
  const instalments: HoldingInstalment[] = [1, 2, 3, 4].map((no) => ({
    no,
    // The last instalment absorbs the rounding, so the four always add up.
    amount: no === 4 ? total - quarter * 3 : quarter,
  }))
  // `rng` is threaded through so every holding draws from the same stream.
  void rng
  return { fiscalYear, lines, total, instalments, arrears: 0, surcharge: 0 }
}

/**
 * Wards differ noticeably so the Mayor's ward map has contrast instead of a flat
 * wash of one colour. A few wards deliberately carry more complaints.
 */
function pickWardWithContrast(rng: Rng, registerKey: string): number {
  const busy = [3, 5, 6, 11, 14]
  if ((registerKey === 'streetlight' || registerKey === 'garbage') && rng.chance(0.45)) {
    return rng.pick(busy)
  }
  return rng.pick(WARDS)
}

function stepNote(rng: Rng, registerKey: string, stepKey: string): string | undefined {
  if (registerKey === 'streetlight') {
    if (stepKey === 'assigned') return 'মিস্ত্রি নিযুক্ত করা হয়েছে; আগামীকাল ঘটনাস্থলে যাবেন।'
    if (stepKey === 'repaired') return 'বাতি মেরামত করে চালু করা হয়েছে।'
  }
  if (registerKey === 'garbage') {
    if (stepKey === 'assigned') return 'পরিচ্ছন্নতা দল পাঠানো হয়েছে।'
    if (stepKey === 'cleaned') return 'এলাকা পরিষ্কার করা হয়েছে।'
  }
  if (registerKey === 'cert-warish' && stepKey === 'verified') {
    return 'ওয়ারিশদের তালিকা স্থানীয়ভাবে যাচাই করা হয়েছে।'
  }
  if (stepKey === 'approved') return 'কাউন্সিলর অনুমোদন দিয়েছেন।'
  if (stepKey === 'issued') return 'সনদ প্রস্তুত, আবেদনকারীকে জানানো হয়েছে।'
  return rng.chance(0.3) ? 'কার্যক্রম চলমান।' : undefined
}

function staffFieldValue(
  rng: Rng,
  key: string,
  at: string,
  data: Record<string, string | number | Heir[]>,
): string | number {
  switch (key) {
    case 'technician':
      return rng.pick(TECHNICIANS)
    case 'materials':
      return rng.pick(MATERIALS)
    case 'team':
      return rng.pick(CLEANING_TEAMS)
    case 'repairDate':
    case 'resolvedDate':
    case 'collectedDate':
    case 'issueDate':
    case 'inspectionDate':
    case 'approvalDate':
      return at.slice(0, 10)
    case 'verifyNote':
      return 'ওয়ারিশদের তালিকা যাচাই করা হয়েছে; তথ্য সঠিক পাওয়া গেছে।'
    case 'receiptNo':
    case 'moneyReceiptNo':
      return `R-${rng.int(1000, 9999)}`
    case 'collected': {
      // Most shopkeepers clear the month in full; a few pay part of it.
      const rent = Number(data.monthlyRent ?? 0)
      return rng.chance(0.78) ? rent : Math.round((rent * rng.int(40, 80)) / 100 / 10) * 10
    }
    case 'plateNo': {
      const prefix =
        data.vehicleType === 'ইজিবাইক' ? 'EB' : data.vehicleType === 'ভ্যান' ? 'VN' : 'RK'
      return `${prefix}-${rng.int(1000, 9999)}`
    }
    case 'renewDate': {
      // A licence runs for one year from the day it is issued.
      const d = new Date(at)
      d.setFullYear(d.getFullYear() + 1)
      return dateOnly(d)
    }
    case 'matchResult':
      return rng.chance(0.88) ? 'তথ্য মিলেছে' : rng.pick(['তথ্য মেলেনি', 'নিবন্ধন পাওয়া যায়নি'])
    case 'inspectionNote':
      return rng.pick([
        'সরেজমিনে পরিদর্শন করা হইয়াছে; নকশা অনুযায়ী জমির পরিমাণ ও সেটব্যাক সঠিক পাওয়া গিয়াছে।',
        'পরিদর্শনে দেখা যায় পার্শ্ববর্তী রাস্তার প্রস্থ পর্যাপ্ত; নির্মাণে আপত্তি নাই।',
        'নকশায় উল্লিখিত তলা সংখ্যার সহিত জমির পরিমাণ সঙ্গতিপূর্ণ পাওয়া গিয়াছে।',
      ])
    default:
      return ''
  }
}

function buildEntryData(
  rng: Rng,
  registerKey: string,
  ctx: { ward: number; applicantName: string; applicantMobile: string; createdAt: string },
): Record<string, string | number | Heir[]> {
  const { ward, applicantName, applicantMobile, createdAt } = ctx
  const area = rng.pick(AREAS)

  switch (registerKey) {
    case 'streetlight':
      return {
        poleNo: rng.chance(0.75) ? `P-${ward}-${rng.int(100, 999)}` : '',
        ward,
        road: `${rng.pick(ROADS)}, ${area}`,
        faultType: rng.pick(['বাতি নষ্ট', 'বাতি নষ্ট', 'তার ছেঁড়া', 'খুঁটি হেলে গেছে', 'সুইচ নষ্ট']),
        description: rng.chance(0.5) ? 'রাতে পুরো এলাকা অন্ধকার থাকে।' : '',
        complainant: applicantName,
        complainantMobile: applicantMobile,
      }
    case 'garbage':
      return {
        ward,
        landmark: `${rng.pick(ROADS)} সংলগ্ন, ${area}`,
        problemType: rng.pick([
          'ময়লা জমে আছে',
          'ডাস্টবিন উপচে পড়ছে',
          'ড্রেন বন্ধ',
          'মৃত প্রাণী',
        ]),
        description: rng.chance(0.5) ? 'দুর্গন্ধে চলাচল করা কঠিন হয়ে পড়েছে।' : '',
        complainant: applicantName,
        complainantMobile: applicantMobile,
      }
    case 'garbage-trips':
      return {
        tripDate: createdAt.slice(0, 10),
        vehicleNo: rng.pick(VEHICLES),
        driver: rng.pick(DRIVERS),
        ward,
        route: `${area} — ${rng.pick(ROADS)}`,
        trips: rng.int(2, 6),
        dumpSite: rng.pick(['ঠনঠনিয়া ডাম্পিং', 'নামুজা ডাম্পিং', 'ফুলবাড়ি ডাম্পিং']),
        fuel: rng.int(8, 22),
        supervisor: rng.pick(SUPERVISORS),
      }
    case 'cert-citizen':
      return {
        name: applicantName,
        fatherName: rng.pick(FATHER_NAMES),
        motherName: rng.pick(MOTHER_NAMES),
        dob: `${rng.int(1960, 2005)}-${pad(rng.int(1, 12))}-${pad(rng.int(1, 28))}`,
        nid: String(rng.int(1_000_000_000, 9_999_999_999)),
        address: `${rng.pick(ROADS)}, ${area}`,
        ward,
        mobile: applicantMobile,
      }
    case 'cert-warish': {
      const heirCount = rng.int(2, 5)
      // A person has one widow and one mother, so those relations are drawn at
      // most once; sons, daughters and siblings may repeat.
      const singular = new Set(['স্ত্রী', 'মাতা'])
      const used = new Set<string>()
      const heirs: Heir[] = []
      while (heirs.length < heirCount) {
        const relation = rng.pick(HEIR_RELATIONS)
        if (singular.has(relation) && used.has(relation)) continue
        used.add(relation)
        const female = relation === 'স্ত্রী' || relation === 'মাতা' || relation === 'কন্যা' || relation === 'বোন'
        heirs.push({
          name: female ? rng.pick(FEMALE_NAMES) : rng.pick(MALE_NAMES),
          relation,
          age: relation === 'মাতা' ? rng.int(55, 80) : relation === 'স্ত্রী' ? rng.int(35, 65) : rng.int(18, 50),
        })
      }
      return {
        deceasedName: rng.pick(MALE_NAMES),
        deathDate: shift(createdAt, -rng.int(30, 400)).slice(0, 10),
        applicantName,
        relation: rng.pick(['পুত্র', 'কন্যা', 'স্ত্রী']),
        address: `${rng.pick(ROADS)}, ${area}`,
        ward,
        mobile: applicantMobile,
        heirs,
      }
    }
    case 'market-rent': {
      const rent = rng.int(12, 45) * 500
      return {
        market: rng.pick(MARKETS),
        shopNo: `${rng.pick(['A', 'B', 'C', 'D'])}-${rng.int(1, 48)}`,
        allottee: applicantName,
        allotteeMobile: applicantMobile,
        businessType: rng.pick(SHOP_TRADES),
        month: BN_MONTHS[new Date(createdAt).getMonth()],
        monthlyRent: rent,
        ward,
        // Most shops start the month clear; a few carry an arrear forward.
        due: rng.chance(0.25) ? rent * rng.int(1, 3) : 0,
      }
    }
    case 'rickshaw-licence': {
      const vehicleType = rng.pick(['রিকশা', 'রিকশা', 'ভ্যান', 'ইজিবাইক', 'ঠেলাগাড়ি'])
      const applicationKind = rng.chance(0.55) ? 'নবায়ন' : 'নতুন'
      return {
        vehicleType,
        ownerName: applicantName,
        ownerMobile: applicantMobile,
        ownerNid: String(rng.int(1_000_000_000, 9_999_999_999)),
        driverName: rng.chance(0.6) ? rng.pick(MALE_NAMES) : applicantName,
        address: `${rng.pick(ROADS)}, ${area}`,
        ward,
        fee: vehicleType === 'ইজিবাইক' ? 1500 : vehicleType === 'ভ্যান' ? 800 : 500,
        applicationKind,
      }
    }
    case 'building-plan': {
      const buildingUse = rng.pick(['আবাসিক', 'আবাসিক', 'বাণিজ্যিক', 'মিশ্র', 'শিল্প'])
      const floors = buildingUse === 'আবাসিক' ? rng.int(1, 5) : rng.int(2, 8)
      return {
        applicationDate: createdAt.slice(0, 10),
        applicantName,
        applicantMobile,
        holdingNo: `${ward}/${rng.int(100, 999)}`,
        ward,
        landArea: rng.int(3, 20),
        floors,
        buildingUse,
        designerName: rng.pick(DESIGNERS),
        fee: floors * rng.int(2, 4) * 1000,
      }
    }
    case 'birth-death': {
      const eventType = rng.chance(0.72) ? 'জন্ম' : 'মৃত্যু'
      // BDRIS numbers are 17 digits: a 4-digit year followed by 13 more.
      const year = eventType === 'জন্ম' ? rng.int(1985, 2024) : rng.int(2015, 2025)
      const regNo = `${year}${String(rng.int(1_000_000_000_000, 9_999_999_999_999))}`
      return {
        verifyDate: createdAt.slice(0, 10),
        regNo,
        eventType,
        name: rng.chance(0.4) ? rng.pick(FEMALE_NAMES) : rng.pick(MALE_NAMES),
        fatherName: rng.pick(FATHER_NAMES),
        motherName: rng.pick(MOTHER_NAMES),
        eventDate: `${year}-${pad(rng.int(1, 12))}-${pad(rng.int(1, 28))}`,
        ward,
        usedFor: rng.pick([
          'ট্রেড লাইসেন্স',
          'নাগরিকত্ব সনদ',
          'ওয়ারিশ সনদ',
          'হোল্ডিং কর',
          'অন্যান্য',
        ]),
      }
    }
    default:
      return { ward }
  }
}

/** Bangla month names, indexed by JavaScript's month number. */
const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
]

/** Short human label for a register entry, used in audit rows and search. */
export function entryLabelOf(entry: RegisterEntry): string {
  const config = getRegister(entry.registerKey)
  if (!config) return entry.serialNo
  const parts = config.fields
    .filter((f) => f.showInBook && f.type !== 'date' && f.type !== 'heirs' && f.type !== 'photo')
    .slice(0, 2)
    .map((f) => {
      const value = entry.data[f.key]
      return Array.isArray(value) ? '' : String(value ?? '')
    })
    .filter(Boolean)
  return parts.length ? parts.join(' — ') : entry.serialNo
}
