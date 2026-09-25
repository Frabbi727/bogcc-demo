/** Data model for the demo. Kept flat and explicit so a Laravel port is easy. */

/* ---------- People ---------- */

export type Role =
  | 'operator'
  | 'inspector'
  | 'licenceOfficer'
  | 'accounts'
  | 'revenueOfficer'
  | 'electrician'
  | 'conservancy'
  | 'councillor'
  | 'ceo'
  | 'mayor'

export interface User {
  role: Role
  name: string
  title: string
  designation: string
  /** One line explaining the desk, shown on the role picker. */
  hint: string
  /** Set for the councillor, who only sees their own ward. */
  ward?: number
}

export interface Session {
  role: Role
  name: string
  since: string
}

/** A citizen is identified by mobile number plus a simulated OTP. */
export interface CitizenSession {
  mobile: string
  since: string
}

/* ---------- The shared record shape ---------- */

/** Where a request came in from. Drives the অনলাইন badge and the channel reports. */
export type Channel = 'office' | 'online'

/** One completed step, in the order it happened. Replaces per-status timestamps. */
export interface HistoryStep {
  status: string
  at: string
  byName: string
  byRole: Role
  note?: string
  /** Staff decide per note whether the citizen may read it. */
  publicNote?: boolean
}

export interface Feedback {
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  at: string
}

/** Records are never deleted, only cancelled with a mandatory reason. */
export interface Cancellation {
  at: string
  by: string
  reason: string
}

/** One row of the ওয়ারিশ certificate's heirs table. */
export interface Heir {
  name: string
  relation: string
  age: number
}

/** A register field value. Only the heirs table is not a scalar. */
export type FieldValue = string | number | Heir[]

export interface Photo {
  /** Compressed JPEG data URL. */
  dataUrl: string
  caption?: string
  at: string
  /** Complaint photos come in pairs: the problem, then the finished work. */
  kind: 'before' | 'after'
}

/**
 * Every service request — licence, complaint, certificate — shares these fields,
 * which is what lets tracking, SLA, search, dashboards and audit work across all
 * modules without knowing what kind of record they are looking at.
 */
export interface BaseRecord {
  id: string
  serviceKey: string
  /** Shown to the citizen, e.g. BOGCC-2026-000123. */
  trackingNo: string
  channel: Channel
  applicantName: string
  applicantMobile: string
  ward: number
  /** Internal status key; the citizen-facing label comes from the service catalogue. */
  status: string
  history: HistoryStep[]
  createdAt: string
  /** Charter deadline in working days from `createdAt`. */
  dueAt: string
  closedAt?: string
  /** Register serial and number, written only when the register line is created. */
  serial?: number
  registerNo?: string
  fiscalYear: string
  cancelled?: Cancellation
  feedback?: Feedback
  photos?: Photo[]
  /**
   * Internal books like the daily trip log promise nothing to a citizen, so they
   * are not measured against the charter at all.
   */
  slaExempt?: boolean
}

/* ---------- Trade licence ---------- */

export type LicenceStatus = 'submitted' | 'verified' | 'approved' | 'issued' | 'cancelled'

export type BusinessNature = 'একক' | 'অংশীদারি' | 'কোম্পানি'

export interface BusinessType {
  key: string
  label: string
  licenceFee: number
  signboardTax: number
}

export interface Business {
  nameBn: string
  nameEn: string
  typeKey: string
  nature: BusinessNature
  address: string
  area: string
  ward: number
  holdingNo: string
}

export interface Owner {
  name: string
  fatherName: string
  motherName: string
  nid: string
  mobile: string
}

export interface FeeLine {
  label: string
  amount: number
}

export interface Licence extends BaseRecord {
  status: LicenceStatus
  appNo: string
  /** A renewal carries the licence number it renews. */
  kind: 'new' | 'renewal'
  renewalOf?: string
  business: Business
  owner: Owner
  feeLines: FeeLine[]
  feeTotal: number
  verificationNote?: string
  paymentId?: string
  receiptId?: string
}

/* ---------- Generic register entries ---------- */

/** One line in a config-driven register book. */
export interface RegisterEntry extends BaseRecord {
  registerKey: string
  /** Formatted serial, e.g. SL/2026-27/007. Assigned on creation. */
  serialNo: string
  /** Values for the config's fields. */
  data: Record<string, FieldValue>
  /** Certificates carry a fee; complaints do not. */
  feeLines?: FeeLine[]
  feeTotal?: number
  paymentId?: string
  receiptId?: string
  /** Certificate number, assigned when the certificate is issued. */
  certificateNo?: string
}

/* ---------- Money ---------- */

/** Counter collection modes. */
export type PaymentMode = 'নগদ' | 'বিকাশ' | 'ব্যাংক'

/** Mock gateway methods. Neutral labels only — no official logos anywhere. */
export type OnlineMethod = 'bKash' | 'Nagad' | 'কার্ড'

export type PaymentStatus = 'pending' | 'paid' | 'failed'

/** Revenue head, so the daily statement and the Mayor charts can group money. */
export type RevenueHead = 'trade-licence' | 'holding-tax' | 'certificate' | 'other'

export interface Payment {
  id: string
  status: PaymentStatus
  head: RevenueHead
  channel: Channel
  purpose: string
  payerName: string
  payerMobile: string
  feeLines: FeeLine[]
  total: number
  createdAt: string
  paidAt?: string
  /** Counter collections carry a mode; online payments carry a method and txn id. */
  mode?: PaymentMode
  method?: OnlineMethod
  txnRef?: string
  receiptId?: string
  /** What is being paid for. */
  target:
    | { type: 'trade-licence'; id: string }
    | { type: 'register-entry'; id: string; registerKey: string }
    | { type: 'holding'; holdingNo: string; fiscalYear: string; instalment: number }
}

export interface Receipt {
  id: string
  /** Sequential receipt number within the fiscal year. */
  no: number
  receiptNo: string
  /** Paper receipt-book reference: book X, leaf Y. */
  bookNo: number
  pageNo: number
  fiscalYear: string
  head: RevenueHead
  channel: Channel
  paymentId: string
  payerName: string
  purpose: string
  feeLines: FeeLine[]
  total: number
  mode?: PaymentMode
  method?: OnlineMethod
  txnRef?: string
  collectedBy: string
  collectedAt: string
  /** What the receipt was issued against, so it can link back. */
  source:
    | { type: 'trade-licence'; id: string }
    | { type: 'register-entry'; id: string; registerKey: string }
    | { type: 'holding'; holdingNo: string }
}

/* ---------- Holding tax ---------- */

export type PropertyType = 'আবাসিক' | 'বাণিজ্যিক' | 'মিশ্র'

export interface HoldingInstalment {
  /** Quarter 1-4. */
  no: number
  amount: number
  paidAt?: string
  receiptId?: string
}

export interface HoldingBill {
  fiscalYear: string
  lines: FeeLine[]
  /** Current year demand, before arrears. */
  total: number
  instalments: HoldingInstalment[]
  /** Unpaid amount carried over from earlier years. */
  arrears: number
  /** Demo surcharge on arrears. */
  surcharge: number
}

export interface Holding {
  holdingNo: string
  ward: number
  ownerName: string
  ownerMobile: string
  address: string
  area: string
  propertyType: PropertyType
  floors: number
  annualValuation: number
  bills: HoldingBill[]
}

/* ---------- Messages and notices ---------- */

/** A simulated SMS. Nothing is ever actually sent. */
export interface Notification {
  id: string
  mobile: string
  text: string
  at: string
  trackingNo?: string
  read?: boolean
}

export interface Notice {
  id: string
  title: string
  body: string
  at: string
  byName: string
  byRole: Role
}

/* ---------- Audit ---------- */

export interface FieldChange {
  field: string
  before: string
  after: string
}

export type AuditRecordType =
  | 'trade-licence'
  | 'register-entry'
  | 'receipt'
  | 'payment'
  | 'holding'
  | 'notice'
  | 'system'

/** Append-only activity log. There is no action that edits or removes these. */
export interface AuditEntry {
  id: string
  at: string
  userName: string
  role: Role
  action: string
  recordType: AuditRecordType
  recordKey: string
  recordId: string
  recordLabel: string
  note?: string
  changes?: FieldChange[]
}
