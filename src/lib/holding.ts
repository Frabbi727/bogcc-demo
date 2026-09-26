/**
 * Holding tax arithmetic, shared by the citizen page, the office register, the
 * defaulter list and the Mayor dashboard (Spec v2 §10).
 *
 * Nothing here mutates: the store owns the bills, these functions only read
 * them, so every page shows the same numbers for the same holding.
 */

import { bnToEnDigits } from '@/lib/bn'
import type { Holding, HoldingBill } from '@/types'

/** `w05-0123`, `W050123` and `০৫-০১২৩` all have to find the same holding. */
export function normaliseHoldingNo(s: string): string {
  return bnToEnDigits(s)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^W/, '')
}

/** Finds a holding by a number typed in any of those shapes. */
export function findHolding(
  holdings: readonly Holding[],
  typed: string,
): Holding | undefined {
  const needle = normaliseHoldingNo(typed)
  if (!needle) return undefined
  return holdings.find((h) => normaliseHoldingNo(h.holdingNo) === needle)
}

/** The newest bill on the holding — seeded arrears push an older one in front. */
export function currentBill(holding: Holding): HoldingBill | undefined {
  return [...holding.bills].sort((a, b) => b.fiscalYear.localeCompare(a.fiscalYear))[0]
}

export function billFor(holding: Holding, fiscalYear: string): HoldingBill | undefined {
  return holding.bills.find((b) => b.fiscalYear === fiscalYear)
}

/** The instalment the counter should take next: the oldest unpaid one. */
export function nextInstalment(bill: HoldingBill) {
  return bill.instalments.find((i) => !i.paidAt)
}

export function paidOf(bill: HoldingBill): number {
  return bill.instalments.filter((i) => i.paidAt).reduce((s, i) => s + i.amount, 0)
}

/** This year's demand still open, arrears and surcharge excluded. */
export function dueOf(bill: HoldingBill): number {
  return bill.total - paidOf(bill)
}

/** Everything owed on the bill: the year's balance plus arrears and surcharge. */
export function outstandingOf(bill: HoldingBill): number {
  return dueOf(bill) + bill.arrears + bill.surcharge
}

export interface HoldingLedgerRow {
  holding: Holding
  bill: HoldingBill
  demand: number
  paid: number
  due: number
  arrears: number
  surcharge: number
  outstanding: number
  paidCount: number
}

/**
 * One row per holding for the register book and the defaulter list. Holdings
 * with no bill for the chosen year drop out, which is what an empty book page
 * would look like anyway.
 */
export function holdingLedger(
  holdings: readonly Holding[],
  fiscalYear: string,
): HoldingLedgerRow[] {
  const rows: HoldingLedgerRow[] = []
  for (const holding of holdings) {
    const bill = billFor(holding, fiscalYear)
    if (!bill) continue
    const paid = paidOf(bill)
    rows.push({
      holding,
      bill,
      demand: bill.total,
      paid,
      due: bill.total - paid,
      arrears: bill.arrears,
      surcharge: bill.surcharge,
      outstanding: bill.total - paid + bill.arrears + bill.surcharge,
      paidCount: bill.instalments.filter((i) => i.paidAt).length,
    })
  }
  return rows.sort((a, b) => a.holding.holdingNo.localeCompare(b.holding.holdingNo))
}

export interface LedgerTotals {
  demand: number
  paid: number
  due: number
  arrears: number
  surcharge: number
  outstanding: number
  count: number
}

export function ledgerTotals(rows: readonly HoldingLedgerRow[]): LedgerTotals {
  return rows.reduce<LedgerTotals>(
    (t, r) => ({
      demand: t.demand + r.demand,
      paid: t.paid + r.paid,
      due: t.due + r.due,
      arrears: t.arrears + r.arrears,
      surcharge: t.surcharge + r.surcharge,
      outstanding: t.outstanding + r.outstanding,
      count: t.count + 1,
    }),
    { demand: 0, paid: 0, due: 0, arrears: 0, surcharge: 0, outstanding: 0, count: 0 },
  )
}

export interface WardArrears {
  ward: number
  count: number
  arrears: number
  outstanding: number
}

/** Ward-wise arrears, worst first — the shape the defaulter list needs. */
export function arrearsByWard(rows: readonly HoldingLedgerRow[]): WardArrears[] {
  const byWard = new Map<number, WardArrears>()
  for (const row of rows) {
    const ward = row.holding.ward
    const at = byWard.get(ward) ?? { ward, count: 0, arrears: 0, outstanding: 0 }
    at.count += 1
    at.arrears += row.arrears + row.surcharge
    at.outstanding += row.outstanding
    byWard.set(ward, at)
  }
  return [...byWard.values()].sort((a, b) => b.outstanding - a.outstanding)
}

/** Collection rate as a percentage of the year's demand. */
export function collectionRate(totals: LedgerTotals): number {
  return totals.demand === 0 ? 0 : Math.round((totals.paid / totals.demand) * 100)
}
