import type { Role } from '@/types'

export type FieldType = 'text' | 'number' | 'date' | 'ward' | 'select' | 'textarea' | 'phone'

export interface RegisterField {
  key: string
  label: string /** Bangla */
  type: FieldType
  options?: string[] /** for select */
  required?: boolean
  showInBook?: boolean /** show as a column on the register page */
}

export interface RegisterConfig {
  key: string /** used in the URL */
  title: string /** e.g. 'সড়কবাতি মেরামত রেজিস্টার' */
  section: string /** e.g. 'বিদ্যুৎ শাখা' */
  serialPrefix: string /** e.g. 'SL' */
  fields: RegisterField[]
  statuses: string[] /** ordered Bangla labels; the first status is set on creation */
  roles: { create: Role[]; advance: Role[]; cancel: Role[] }
  dateField: string /** field used for the fiscal year and date filters */

  /**
   * Extra fields the engine asks for when advancing *into* a given status —
   * the paper book gets those columns filled at that moment, not before.
   */
  advancePrompts?: Record<string, string[]>
  /** Numeric field keys to sum in the book footer. */
  totals?: string[]
  /** One-line description shown on the register book header. */
  description?: string
}
