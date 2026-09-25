/**
 * The numbers behind the Mayor dashboard (Spec v2 §15).
 *
 * Everything here is a pure function over the store's records, so the dashboard,
 * the ward drill-down and the presentation view all read the same figures, and a
 * change made in another browser window shows up in all three at once.
 *
 * Two conventions run through the whole file:
 *
 * - a service is *delivered* on `closedAt`, and delivered *on time* when that
 *   fell on or before `dueAt` — the same charter promise the SLA badges use;
 * - a cancelled record is nobody's achievement and nobody's failure, so it is
 *   left out of every rate and average, and only counted where a raw total of
 *   what came in is meant.
 */

import { entryLabelOf } from '@/data/seed'
import { serviceOf } from '@/data/services'
import { WARDS } from '@/data/wards'
import { formatDecimalBn, formatTaka, toBnDigits } from '@/lib/bn'
import { isOpen } from '@/lib/records'
import { daysOverdue, isOverdue, workingDaysBetween } from '@/lib/sla'
import { nextActionFor } from '@/lib/status'
import { REGISTERS, getRegister } from '@/registers'
import type { Holding, Licence, Receipt, RegisterEntry, RevenueHead, Role } from '@/types'

/** Every citizen-facing record, whatever module it came from. */
export type ServiceRecord = Licence | RegisterEntry

function isLicence(record: ServiceRecord): record is Licence {
  return 'appNo' in record
}

/** The section that owns a record, read from the one service catalogue. */
export function sectionOf(record: ServiceRecord): string {
  return serviceOf(record.serviceKey)?.section ?? 'অন্যান্য'
}

export function serviceNameOf(record: ServiceRecord): string {
  return serviceOf(record.serviceKey)?.name ?? record.serviceKey
}

/** What a record is called in a list: the business, or the register's own label. */
export function recordTitle(record: ServiceRecord): string {
  if (isLicence(record)) return record.business.nameBn
  // A register line's own label is a pole or bin number; on an oversight screen
  // the person still waiting reads better, with the label kept as a fallback.
  return record.applicantName || entryLabelOf(record)
}

/** Where a record lives in the office side. */
export function recordPath(record: ServiceRecord): string {
  return isLicence(record)
    ? `/office/trade-licence/${record.id}`
    : `/office/registers/${record.registerKey}/${record.id}`
}

const COMPLAINT_SERVICES = ['streetlight', 'garbage']

export function isComplaint(record: ServiceRecord): boolean {
  return COMPLAINT_SERVICES.includes(record.serviceKey)
}

/* ---------------------------------------------------------------- months */

export interface MonthBucket {
  /** `YYYY-MM`, which is also what `iso.slice(0, 7)` gives. */
  key: string
  label: string
  year: number
  month: number
}

const MONTHS_SHORT_BN = [
  'জানু.',
  'ফেব্রু.',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগ.',
  'সেপ্টে.',
  'অক্টো.',
  'নভে.',
  'ডিসে.',
]

function bucketOf(d: Date): MonthBucket {
  const month = d.getMonth()
  const year = d.getFullYear()
  return {
    key: `${year}-${String(month + 1).padStart(2, '0')}`,
    label: MONTHS_SHORT_BN[month],
    year,
    month,
  }
}

/** The last `count` calendar months, oldest first, ending with the current one. */
export function lastMonths(count: number, now: Date = new Date()): MonthBucket[] {
  const out: MonthBucket[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    out.push(bucketOf(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  return out
}

const monthKey = (iso: string) => iso.slice(0, 7)

/* ------------------------------------------------------------------ KPIs */

export interface Kpi {
  key: string
  label: string
  value: string
  hint?: string
  /** Percent change against last month; undefined when last month had nothing to compare. */
  delta?: number
  /**
   * Open complaints and processing days read the other way round: a fall is the
   * good news, so the arrow is green when the number goes down.
   */
  goodWhenDown?: boolean
}

/** Percent change from `before` to `after`, or undefined when there is no base. */
function delta(after: number, before: number): number | undefined {
  if (!before) return undefined
  return Math.round(((after - before) / before) * 100)
}

const deliveredIn = (records: readonly ServiceRecord[], key: string) =>
  records.filter((r) => !r.cancelled && r.closedAt && monthKey(r.closedAt) === key)

const createdIn = (records: readonly ServiceRecord[], key: string) =>
  records.filter((r) => monthKey(r.createdAt) === key)

/** Share of a delivered set that met the charter deadline. */
function onTimeShare(delivered: readonly ServiceRecord[]): number {
  const measured = delivered.filter((r) => !r.slaExempt)
  if (measured.length === 0) return 0
  const onTime = measured.filter((r) => new Date(r.closedAt as string) <= new Date(r.dueAt))
  return Math.round((onTime.length / measured.length) * 100)
}

/** Complaints that were still waiting on somebody at a given moment. */
function openComplaintsAt(records: readonly ServiceRecord[], at: Date): number {
  return records.filter((r) => {
    if (!isComplaint(r) || r.cancelled) return false
    if (new Date(r.createdAt) > at) return false
    return !r.closedAt || new Date(r.closedAt) > at
  }).length
}

function averageRatingIn(records: readonly ServiceRecord[], key: string): number {
  const rated = records.filter((r) => r.feedback && monthKey(r.feedback.at) === key)
  if (rated.length === 0) return 0
  const sum = rated.reduce((s, r) => s + (r.feedback?.rating ?? 0), 0)
  return Math.round((sum / rated.length) * 10) / 10
}

/**
 * The KPI row. Each figure is this calendar month against last, which is what a
 * mayor is actually asked in a council meeting.
 */
export function mayorKpis(
  records: readonly ServiceRecord[],
  receipts: readonly Receipt[],
  fiscalYear: string,
  now: Date = new Date(),
): Kpi[] {
  const [previous, current] = lastMonths(2, now)

  const deliveredNow = deliveredIn(records, current.key)
  const deliveredBefore = deliveredIn(records, previous.key)

  const revenueNow = receipts
    .filter((r) => monthKey(r.collectedAt) === current.key)
    .reduce((s, r) => s + r.total, 0)
  const revenueBefore = receipts
    .filter((r) => monthKey(r.collectedAt) === previous.key)
    .reduce((s, r) => s + r.total, 0)
  const revenueFy = receipts
    .filter((r) => r.fiscalYear === fiscalYear)
    .reduce((s, r) => s + r.total, 0)

  const createdNow = createdIn(records, current.key)
  const createdBefore = createdIn(records, previous.key)
  const onlineShare = (list: readonly ServiceRecord[]) =>
    list.length ? Math.round((list.filter((r) => r.channel === 'online').length / list.length) * 100) : 0

  const openNow = openComplaintsAt(records, now)
  const openBefore = openComplaintsAt(records, new Date(now.getFullYear(), now.getMonth(), 0, 23, 59))

  const ratingNow = averageRatingIn(records, current.key)
  const ratingBefore = averageRatingIn(records, previous.key)

  return [
    {
      key: 'delivered',
      label: 'এ মাসে সেবা প্রদান',
      value: toBnDigits(deliveredNow.length),
      hint: `গত মাসে ${toBnDigits(deliveredBefore.length)}টি`,
      delta: delta(deliveredNow.length, deliveredBefore.length),
    },
    {
      key: 'on-time',
      label: 'সময়মতো সেবা',
      value: `${toBnDigits(onTimeShare(deliveredNow))}%`,
      hint: 'সিটিজেন চার্টারের সময়ের মধ্যে',
      delta: delta(onTimeShare(deliveredNow), onTimeShare(deliveredBefore)),
    },
    {
      key: 'revenue',
      label: 'মোট রাজস্ব (অর্থবছর)',
      value: formatTaka(revenueFy),
      hint: `এ মাসে ${formatTaka(revenueNow)}`,
      delta: delta(revenueNow, revenueBefore),
    },
    {
      key: 'online',
      label: 'অনলাইন আবেদন',
      value: `${toBnDigits(onlineShare(createdNow))}%`,
      hint: 'এ মাসের আবেদনের মধ্যে',
      delta: delta(onlineShare(createdNow), onlineShare(createdBefore)),
    },
    {
      key: 'complaints',
      label: 'অমীমাংসিত অভিযোগ',
      value: toBnDigits(openNow),
      hint: 'সড়কবাতি ও পরিচ্ছন্নতা',
      delta: delta(openNow, openBefore),
      goodWhenDown: true,
    },
    {
      key: 'rating',
      label: 'নাগরিক সন্তুষ্টি',
      value: ratingNow ? `★ ${formatDecimalBn(ratingNow)}` : '—',
      hint: ratingBefore ? `গত মাসে ★ ${formatDecimalBn(ratingBefore)}` : 'এ মাসের রেটিং',
      delta: delta(ratingNow, ratingBefore),
    },
  ]
}

/* ------------------------------------------------------------------ wards */

export type WardMetric = 'complaints' | 'revenue' | 'days'

export const WARD_METRIC_LABEL: Record<WardMetric, string> = {
  complaints: 'অমীমাংসিত অভিযোগ',
  revenue: 'আদায় (অর্থবছর)',
  days: 'গড় নিষ্পত্তির সময়',
}

export interface WardStat {
  ward: number
  /** Complaints still waiting on somebody. */
  complaints: number
  revenue: number
  /** Average working days from submission to delivery. */
  days: number
  received: number
  delivered: number
  onTime: number
}

/**
 * Per-ward figures for the map and the drill-down.
 *
 * Receipts carry no ward of their own — money is attributed to the ward of the
 * record it was collected against, which is why the holdings are needed here.
 */
export function wardStats(
  records: readonly ServiceRecord[],
  receipts: readonly Receipt[],
  holdings: readonly Holding[],
  fiscalYear: string,
): WardStat[] {
  const wardOfRecord = new Map<string, number>()
  for (const r of records) wardOfRecord.set(r.id, r.ward)
  const wardOfHolding = new Map<string, number>()
  for (const h of holdings) wardOfHolding.set(h.holdingNo, h.ward)

  const revenue = new Map<number, number>()
  for (const receipt of receipts) {
    if (receipt.fiscalYear !== fiscalYear) continue
    const ward =
      receipt.source.type === 'holding'
        ? wardOfHolding.get(receipt.source.holdingNo)
        : wardOfRecord.get(receipt.source.id)
    if (ward === undefined) continue
    revenue.set(ward, (revenue.get(ward) ?? 0) + receipt.total)
  }

  return WARDS.map((ward) => {
    const mine = records.filter((r) => r.ward === ward)
    const delivered = mine.filter((r) => !r.cancelled && r.closedAt && !r.slaExempt)
    const days = delivered.map((r) => workingDaysBetween(r.createdAt, r.closedAt as string))

    return {
      ward,
      complaints: mine.filter((r) => isComplaint(r) && isOpen(r)).length,
      revenue: revenue.get(ward) ?? 0,
      days: days.length
        ? Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10
        : 0,
      received: mine.filter((r) => !r.slaExempt).length,
      delivered: delivered.length,
      onTime: onTimeShare(delivered),
    }
  })
}

export function wardMetricValue(stat: WardStat, metric: WardMetric): number {
  return metric === 'revenue' ? stat.revenue : metric === 'days' ? stat.days : stat.complaints
}

export function formatWardMetric(value: number, metric: WardMetric): string {
  if (metric === 'revenue') return formatTaka(value)
  if (metric === 'days') return value ? `${formatDecimalBn(value)} দিন` : '—'
  return toBnDigits(value)
}

/* ----------------------------------------------------------------- charts */

export const REVENUE_HEAD_LABEL: Record<RevenueHead, string> = {
  'trade-licence': 'ট্রেড লাইসেন্স',
  'holding-tax': 'হোল্ডিং কর',
  certificate: 'সনদ ফি',
  other: 'অন্যান্য',
}

export const REVENUE_HEADS: RevenueHead[] = ['trade-licence', 'holding-tax', 'certificate', 'other']

export interface RevenueMonthRow extends Record<RevenueHead, number> {
  label: string
}

/** Monthly collection split by revenue head, for the stacked bars. */
export function revenueByMonth(
  receipts: readonly Receipt[],
  months: readonly MonthBucket[],
): RevenueMonthRow[] {
  return months.map((m) => {
    const row = { label: m.label } as RevenueMonthRow
    for (const head of REVENUE_HEADS) row[head] = 0
    for (const receipt of receipts) {
      if (monthKey(receipt.collectedAt) !== m.key) continue
      row[receipt.head] += receipt.total
    }
    return row
  })
}

/** How many requests arrived at a desk versus online, month by month. */
export function channelByMonth(
  records: readonly ServiceRecord[],
  months: readonly MonthBucket[],
): { label: string; office: number; online: number }[] {
  return months.map((m) => {
    const mine = createdIn(records, m.key)
    return {
      label: m.label,
      office: mine.filter((r) => r.channel === 'office').length,
      online: mine.filter((r) => r.channel === 'online').length,
    }
  })
}

/** Complaints in versus complaints closed — the line a mayor watches. */
export function complaintFlow(
  records: readonly ServiceRecord[],
  months: readonly MonthBucket[],
): { label: string; received: number; resolved: number }[] {
  const complaints = records.filter(isComplaint)
  return months.map((m) => ({
    label: m.label,
    received: createdIn(complaints, m.key).length,
    resolved: deliveredIn(complaints, m.key).length,
  }))
}

/** Actual processing time against the promise, per service. */
export function processingVsCharter(
  records: readonly ServiceRecord[],
): { label: string; actual: number; charter: number }[] {
  const byService = new Map<string, ServiceRecord[]>()
  for (const r of records) {
    if (r.slaExempt || r.cancelled || !r.closedAt) continue
    const list = byService.get(r.serviceKey) ?? []
    list.push(r)
    byService.set(r.serviceKey, list)
  }

  return [...byService.entries()]
    .map(([key, list]) => {
      const service = serviceOf(key)
      const days = list.map((r) => workingDaysBetween(r.createdAt, r.closedAt as string))
      return {
        label: service?.name ?? key,
        actual: Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10,
        charter: service?.charterDays ?? 0,
      }
    })
    .sort((a, b) => b.actual - b.charter - (a.actual - a.charter))
}

/* ---------------------------------------------------------------- overdue */

export interface OverdueItem {
  id: string
  to: string
  title: string
  section: string
  serviceName: string
  ward: number
  days: number
  /** The desk the file is sitting on right now. */
  deskLabel: string
  deskRole?: Role
}

/** Which desk a still-open record is waiting on, across both modules. */
function nextDesk(record: ServiceRecord): { label: string; role?: Role } {
  if (isLicence(record)) {
    const next = nextActionFor(record.status)
    return next ? { label: next.action, role: next.role } : { label: 'নিষ্পত্তির অপেক্ষায়' }
  }
  const config = getRegister(record.registerKey)
  const index = config?.steps.findIndex((s) => s.key === record.status) ?? -1
  const step = index >= 0 ? config?.steps[index + 1] : undefined
  return step ? { label: step.label, role: step.actors[0] } : { label: 'নিষ্পত্তির অপেক্ষায়' }
}

/** Open work past its charter deadline, worst first. */
export function overdueItems(
  records: readonly ServiceRecord[],
  now: Date = new Date(),
): OverdueItem[] {
  return records
    .filter((r) => isOpen(r) && isOverdue(r, now))
    .map((r) => {
      const desk = nextDesk(r)
      return {
        id: r.id,
        to: recordPath(r),
        title: recordTitle(r),
        section: sectionOf(r),
        serviceName: serviceNameOf(r),
        ward: r.ward,
        days: daysOverdue(r, now),
        deskLabel: desk.label,
        deskRole: desk.role,
      }
    })
    .sort((a, b) => b.days - a.days)
}

/* ---------------------------------------------------- section performance */

export interface SectionRow {
  section: string
  received: number
  completed: number
  onTime: number
  days: number
  rating: number
}

export function sectionPerformance(records: readonly ServiceRecord[]): SectionRow[] {
  const bySection = new Map<string, ServiceRecord[]>()
  for (const r of records) {
    if (r.slaExempt) continue
    const key = sectionOf(r)
    const list = bySection.get(key) ?? []
    list.push(r)
    bySection.set(key, list)
  }

  return [...bySection.entries()]
    .map(([section, list]) => {
      const done = list.filter((r) => !r.cancelled && r.closedAt)
      const days = done.map((r) => workingDaysBetween(r.createdAt, r.closedAt as string))
      const rated = list.filter((r) => r.feedback)
      return {
        section,
        received: list.length,
        completed: done.length,
        onTime: onTimeShare(done),
        days: days.length
          ? Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10
          : 0,
        rating: rated.length
          ? Math.round(
              (rated.reduce((s, r) => s + (r.feedback?.rating ?? 0), 0) / rated.length) * 10,
            ) / 10
          : 0,
      }
    })
    .sort((a, b) => b.received - a.received)
}

/* -------------------------------------------------------- citizen's voice */

export interface VoiceItem {
  id: string
  to: string
  title: string
  serviceName: string
  ward: number
  rating: number
  comment?: string
  at: string
}

/** The most recent ratings citizens left, newest first. */
export function citizenVoice(records: readonly ServiceRecord[], limit = 6): VoiceItem[] {
  return records
    .filter((r) => r.feedback)
    .sort((a, b) => (b.feedback as { at: string }).at.localeCompare((a.feedback as { at: string }).at))
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      to: recordPath(r),
      title: recordTitle(r),
      serviceName: serviceNameOf(r),
      ward: r.ward,
      rating: r.feedback?.rating ?? 0,
      comment: r.feedback?.comment,
      at: r.feedback?.at ?? r.createdAt,
    }))
}

/* ------------------------------------------------------------ paper saved */

/**
 * A rough idea of how much writing the office no longer does by hand.
 *
 * Deliberately crude, and labelled as an estimate everywhere it is shown: one
 * register line plus the forms, notices and receipt copies that used to be
 * written alongside it come to roughly three sheets of paper.
 */
export const SHEETS_PER_ENTRY = 3

export function paperSaved(records: readonly ServiceRecord[], receipts: readonly Receipt[]) {
  const lines = records.length + receipts.length
  return { lines, sheets: lines * SHEETS_PER_ENTRY }
}

/* -------------------------------------------------------------- live feed */

/** Registers a mayor might be asked about, in sidebar order. Used for the ward drill-down. */
export const REGISTER_TITLES = new Map(REGISTERS.map((r) => [r.key, r.title]))
