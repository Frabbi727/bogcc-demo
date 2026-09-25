/**
 * Citizen-charter service levels.
 *
 * Every service in the catalogue promises a number of working days. The office
 * week here is Sunday to Thursday: Friday and Saturday are the weekend, so they
 * never count towards a deadline.
 */

/** 5 = Friday, 6 = Saturday in `Date.getDay()`. */
function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 5 || day === 6
}

/**
 * The deadline `days` working days after `createdAt`, as a local-time ISO string.
 * Kept local (no `Z`) so the calendar day never shifts by timezone.
 */
export function dueDate(createdAt: string, days: number): string {
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return createdAt
  let remaining = Math.max(0, Math.trunc(days))
  while (remaining > 0) {
    d.setDate(d.getDate() + 1)
    if (!isWeekend(d)) remaining -= 1
  }
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T23:59:59`
}

/** Working days between two dates, ignoring the weekend. Negative if `to` is earlier. */
export function workingDaysBetween(from: string, to: string): number {
  const a = new Date(from)
  const b = new Date(to)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  const sign = b >= a ? 1 : -1
  const start = sign > 0 ? a : b
  const end = sign > 0 ? b : a
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const last = new Date(end)
  last.setHours(0, 0, 0, 0)
  let count = 0
  while (cursor < last) {
    cursor.setDate(cursor.getDate() + 1)
    if (!isWeekend(cursor)) count += 1
  }
  return count * sign
}

export type SlaStatus = 'on-time' | 'due-soon' | 'overdue'

export const SLA_LABEL: Record<SlaStatus, string> = {
  'on-time': 'সময়মতো',
  'due-soon': 'শীঘ্রই মেয়াদ শেষ',
  overdue: 'মেয়াদোত্তীর্ণ',
}

/** The parts of a record the SLA helpers need. Keeps this module free of the data model. */
export interface SlaSubject {
  dueAt: string
  closedAt?: string
  cancelled?: { at: string } | undefined
  /** Records with no citizen-facing promise are never measured. */
  slaExempt?: boolean
}

/**
 * A record is overdue when it is still open past its deadline, or when it was
 * closed after it. A cancelled record is never overdue — nobody is waiting.
 */
export function isOverdue(record: SlaSubject, now: Date = new Date()): boolean {
  if (record.cancelled || record.slaExempt) return false
  const due = new Date(record.dueAt).getTime()
  if (Number.isNaN(due)) return false
  const settled = record.closedAt ? new Date(record.closedAt).getTime() : now.getTime()
  return settled > due
}

/** `due-soon` means one working day or less left. */
export function slaStatus(record: SlaSubject, now: Date = new Date()): SlaStatus {
  if (record.slaExempt) return 'on-time'
  if (isOverdue(record, now)) return 'overdue'
  if (record.closedAt || record.cancelled) return 'on-time'
  return workingDaysBetween(now.toISOString(), record.dueAt) <= 1 ? 'due-soon' : 'on-time'
}

/** Whole days a still-open record is past its deadline; 0 when it is not. */
export function daysOverdue(record: SlaSubject, now: Date = new Date()): number {
  if (!isOverdue(record, now)) return 0
  const due = new Date(record.dueAt)
  const settled = record.closedAt ? new Date(record.closedAt) : now
  return Math.max(1, workingDaysBetween(due.toISOString(), settled.toISOString()))
}
