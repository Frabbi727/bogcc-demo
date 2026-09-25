import type { Role } from '@/types'

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'ward'
  | 'select'
  | 'textarea'
  | 'phone'
  | 'nid'
  | 'photo'
  | 'heirs'

export interface RegisterField {
  key: string
  /** Bangla label, also the register book column heading. */
  label: string
  type: FieldType
  options?: string[]
  required?: boolean
  /** Show as a column on the register book page. */
  showInBook?: boolean
  /** Ask the citizen for this on the online application form. */
  citizenInput?: boolean
  /** Filled by staff while processing; never shown to the citizen as an input. */
  staffOnly?: boolean
  hint?: string
}

/**
 * One step in a register's workflow. The paper book gets a step's columns filled
 * at the moment that step happens, which is what `requiredFields` encodes.
 */
export interface RegisterStep {
  key: string
  /** Label staff see. */
  label: string
  /** Label the citizen sees on their tracking page. */
  citizenLabel: string
  /** Roles allowed to move a record INTO this step. Empty for the creation step. */
  actors: Role[]
  /** Staff fields that must be filled to complete this step. */
  requiredFields?: string[]
  /**
   * This step is reached by paying, not by a staff click — the citizen pays
   * through the mock gateway or accounts collects at the counter.
   */
  payment?: boolean
}

export interface RegisterConfig {
  key: string
  /** Links to the service catalogue when citizens can apply for this. */
  serviceKey?: string
  title: string
  section: string
  serialPrefix: string
  fields: RegisterField[]
  /** Ordered; the first step is set on creation. */
  steps: RegisterStep[]
  createRoles: Role[]
  cancelRoles: Role[]
  citizenFacing: boolean
  /** The councillor sees only records in their own ward. */
  wardScoped?: boolean
  /** Shows a printable certificate once the final step is reached. */
  printable?: 'certificate'
  /** Field used for the fiscal-year and date-range filters. */
  dateField: string
  /**
   * Which data fields carry the applicant's name and mobile. The record needs both
   * (they drive citizen tracking and SMS), so a register that does not collect them
   * as fields leaves this unset and the intake form asks for them separately.
   */
  applicantFields?: { name: string; mobile: string }
  /** Numeric field keys summed in the book footer. */
  totals?: string[]
  /** One-line description shown on the register book header. */
  description?: string
  /** Extra sections printed on the certificate, in order. */
  certificate?: {
    docTitle: string
    /** Body paragraph; `{{field}}` placeholders are filled from the entry data. */
    body: string
    sections: { label: string; fields: string[] }[]
    signatories: string[]
  }
}

/* ---------- Helpers over a config ---------- */

export function stepAt(config: RegisterConfig, index: number): RegisterStep | undefined {
  return config.steps[index]
}

export function stepIndex(config: RegisterConfig, statusKey: string): number {
  return config.steps.findIndex((s) => s.key === statusKey)
}

export function stepOf(config: RegisterConfig, statusKey: string): RegisterStep | undefined {
  return config.steps.find((s) => s.key === statusKey)
}

/** The step that comes after `statusKey`, or undefined when the work is finished. */
export function nextStep(config: RegisterConfig, statusKey: string): RegisterStep | undefined {
  const i = stepIndex(config, statusKey)
  if (i < 0 || i >= config.steps.length - 1) return undefined
  return config.steps[i + 1]
}

/** Can this role move the record into its next step? */
export function canAdvance(config: RegisterConfig, statusKey: string, role: Role): boolean {
  const next = nextStep(config, statusKey)
  return !!next && next.actors.includes(role)
}

/** Fields shown on the citizen-facing application form, in config order. */
export function citizenFields(config: RegisterConfig): RegisterField[] {
  return config.fields.filter((f) => f.citizenInput)
}

/** Fields an operator fills for a walk-in entry: everything except staff-only. */
export function intakeFields(config: RegisterConfig): RegisterField[] {
  return config.fields.filter((f) => !f.staffOnly)
}

export function fieldOf(config: RegisterConfig, key: string): RegisterField | undefined {
  return config.fields.find((f) => f.key === key)
}

/**
 * Pulls the applicant's name and mobile out of an entry's data, when the register
 * collects them as fields. Registers that do not (the office-only trip log) return
 * undefined, and the caller falls back to the staff member entering the line.
 */
export function applicantFrom(
  config: RegisterConfig,
  data: Record<string, unknown>,
): { name: string; mobile: string } | undefined {
  if (!config.applicantFields) return undefined
  const name = data[config.applicantFields.name]
  const mobile = data[config.applicantFields.mobile]
  if (typeof name !== 'string' || typeof mobile !== 'string') return undefined
  return { name, mobile }
}
