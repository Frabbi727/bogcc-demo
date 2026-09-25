import type { ReactNode } from 'react'

import { bnToEnDigits, formatDateBn, toBnDigits } from '@/lib/bn'
import type { RegisterField } from '@/registers/types'

/** Validates one field value, returning a Bangla message or undefined. */
export function validateField(field: RegisterField, raw: string): string | undefined {
  const value = raw.trim()
  if (field.required && !value) return `${field.label} পূরণ করুন।`
  if (!value) return undefined

  if (field.type === 'number') {
    const n = Number(bnToEnDigits(value))
    if (!Number.isFinite(n)) return `${field.label} একটি সংখ্যা হতে হবে।`
    if (n < 0) return `${field.label} ঋণাত্মক হতে পারে না।`
  }
  if (field.type === 'phone') {
    const digits = bnToEnDigits(value).replace(/\s|-/g, '')
    if (!/^01\d{9}$/.test(digits)) return 'মোবাইল নম্বর ০১ দিয়ে শুরু হয়ে ১১ সংখ্যার হতে হবে।'
  }
  if (field.type === 'ward') {
    const n = Number(bnToEnDigits(value))
    if (!Number.isInteger(n) || n < 1 || n > 21) return 'ওয়ার্ড ১ থেকে ২১ এর মধ্যে হতে হবে।'
  }
  return undefined
}

/** Converts a form value to what gets stored in the entry's `data`. */
export function normaliseField(field: RegisterField, raw: string): string | number {
  const value = raw.trim()
  if (field.type === 'number' || field.type === 'ward') return Number(bnToEnDigits(value) || 0)
  if (field.type === 'phone') return bnToEnDigits(value).replace(/\s|-/g, '')
  return value
}

/** Display form of a stored field value, in Bangla digits. */
export function displayField(field: RegisterField | undefined, value: string | number | undefined): ReactNode {
  if (value === undefined || value === '' || value === null) return '—'
  if (!field) return toBnDigits(String(value))
  if (field.type === 'date') return formatDateBn(String(value))
  if (field.type === 'ward') return toBnDigits(value)
  return toBnDigits(String(value))
}
