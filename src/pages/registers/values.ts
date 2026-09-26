import { normaliseField, validateField, validateHeir } from '@/lib/registerFields'
import type { RegisterField } from '@/registers/types'
import type { FieldValue, Heir } from '@/types'

/**
 * Round-tripping register field values through a web form.
 *
 * Every form in the app keeps its state as `Record<string, string>`, but the
 * heirs table is a list of rows. Rather than widen that state everywhere, the
 * table travels as JSON inside the form and is parsed back on submit.
 *
 * Deliberately not in `src/lib/` — that directory is ported to the Flutter app,
 * and this JSON round-trip is a detail of the web forms, not of the domain.
 */

export const EMPTY_HEIR: Heir = { name: '', relation: '', age: 0 }

export function parseHeirs(raw: string): Heir[] {
  if (!raw.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isHeir)
  } catch {
    return []
  }
}

export function serialiseHeirs(heirs: Heir[]): string {
  return heirs.length ? JSON.stringify(heirs) : ''
}

/**
 * Validates the whole heirs table. `validateField` cannot: to it the JSON blob is
 * just a non-empty string, so a table of blank rows would pass.
 */
export function validateHeirs(raw: string, required?: boolean): string | undefined {
  const heirs = parseHeirs(raw)
  if (heirs.length === 0) {
    return required ? 'অন্তত একজন ওয়ারিশের তথ্য দিন।' : undefined
  }
  for (const [i, heir] of heirs.entries()) {
    const message = validateHeir(heir)
    if (message) return `${i + 1} নম্বর সারি: ${message}`
  }
  return undefined
}

/** Validates one field, including the types `validateField` cannot judge. */
export function validateFormField(field: RegisterField, raw: string): string | undefined {
  if (field.type === 'heirs') return validateHeirs(raw, field.required)
  return validateField(field, raw)
}

/**
 * What gets stored in the entry's `data`. Wraps `normaliseField` so the heirs
 * table lands as `Heir[]` rather than as the JSON string the form carried.
 */
export function fieldValueFrom(field: RegisterField, raw: string): FieldValue {
  if (field.type === 'heirs') return parseHeirs(raw)
  return normaliseField(field, raw)
}

function isHeir(v: unknown): v is Heir {
  if (typeof v !== 'object' || v === null) return false
  const row = v as Record<string, unknown>
  return (
    typeof row.name === 'string' && typeof row.relation === 'string' && typeof row.age === 'number'
  )
}
