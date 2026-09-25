/** Data model for the demo. Kept flat and explicit so a Laravel port is easy. */

export type Role =
  | 'operator'
  | 'inspector'
  | 'officer'
  | 'accounts'
  | 'electrician'
  | 'conservancy'
  | 'ceo'

export interface User {
  role: Role
  name: string
  title: string
  designation: string
}

/** Trade licence workflow. `cancelled` can be reached from any earlier status. */
export type LicenceStatus = 'submitted' | 'verified' | 'approved' | 'issued' | 'cancelled'

export type BusinessNature = 'একক' | 'অংশীদারি' | 'কোম্পানি'

export type PaymentMode = 'নগদ' | 'বিকাশ' | 'ব্যাংক'

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

export interface Licence {
  id: string
  appNo: string
  status: LicenceStatus
  fiscalYear: string
  business: Business
  owner: Owner
  feeLines: FeeLine[]
  feeTotal: number

  createdAt: string
  createdBy: string

  verifiedAt?: string
  verifiedBy?: string
  verificationNote?: string

  /** Serial and licence number exist only from approval onward. */
  serial?: number
  licenceNo?: string
  approvedAt?: string
  approvedBy?: string

  issuedAt?: string
  receiptId?: string

  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string
}

export interface Receipt {
  id: string
  /** Sequential receipt number within the fiscal year. */
  no: number
  receiptNo: string
  /** Paper receipt-book reference: book X, leaf Y (100 leaves per book). */
  bookNo: number
  pageNo: number
  fiscalYear: string
  licenceId: string
  payerName: string
  purpose: string
  feeLines: FeeLine[]
  total: number
  mode: PaymentMode
  txnRef?: string
  collectedBy: string
  collectedAt: string
}

/** One line in a generic (config-driven) register book. */
export interface RegisterEntry {
  id: string
  registerKey: string
  /** Assigned on creation, sequential per register per fiscal year, no gaps. */
  serial: number
  serialNo: string
  fiscalYear: string
  data: Record<string, string | number>
  status: string
  createdAt: string
  createdBy: string
  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string
}

export interface FieldChange {
  field: string
  before: string
  after: string
}

/** Append-only activity log. There is no action that edits or removes these. */
export interface AuditEntry {
  id: string
  at: string
  userName: string
  role: Role
  action: string
  recordType: 'trade-licence' | 'receipt' | 'register-entry' | 'system'
  recordKey: string
  recordId: string
  recordLabel: string
  note?: string
  changes?: FieldChange[]
}

export interface Session {
  role: Role
  name: string
  since: string
}
