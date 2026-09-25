/**
 * Public-facing counts.
 *
 * The landing page and the Citizen Corner show these to anyone, so they must not
 * leak anything about a specific person — only totals.
 */

import { workingDaysBetween } from '@/lib/sla'
import type { BaseRecord } from '@/types'

export interface PublicStats {
  /** Services completed this calendar month. */
  deliveredThisMonth: number
  /** Complaints closed, all time. */
  complaintsSolved: number
  /** Average working days from submission to completion. */
  averageDays: number
  /** Average citizen rating, or 0 when nobody has rated yet. */
  averageRating: number
  onlineShare: number
}

export function publicStats(records: readonly BaseRecord[], now: Date = new Date()): PublicStats {
  const closed = records.filter((r) => r.closedAt && !r.cancelled)

  const deliveredThisMonth = closed.filter((r) => {
    const d = new Date(r.closedAt as string)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const complaintsSolved = closed.filter(
    (r) => r.serviceKey === 'streetlight' || r.serviceKey === 'garbage',
  ).length

  const days = closed.map((r) => workingDaysBetween(r.createdAt, r.closedAt as string))
  const averageDays = days.length
    ? Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10
    : 0

  const rated = records.filter((r) => r.feedback)
  const averageRating = rated.length
    ? Math.round((rated.reduce((s, r) => s + (r.feedback?.rating ?? 0), 0) / rated.length) * 10) / 10
    : 0

  const onlineShare = records.length
    ? Math.round((records.filter((r) => r.channel === 'online').length / records.length) * 100)
    : 0

  return { deliveredThisMonth, complaintsSolved, averageDays, averageRating, onlineShare }
}
