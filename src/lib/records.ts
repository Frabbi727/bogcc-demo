/**
 * Helpers over the shared record shape.
 *
 * Step timestamps are not stored as separate fields any more — they live in
 * `history`, which is what lets one tracking page and one audit view work for
 * every module. These read them back out.
 */

import type { BaseRecord, HistoryStep, Licence, Receipt, RegisterEntry } from '@/types'

/** When the record first reached `status`, or undefined if it never did. */
export function stepAt(record: BaseRecord, status: string): string | undefined {
  return record.history.find((h) => h.status === status)?.at
}

/** The history step for `status`, if it happened. */
export function stepFor(record: BaseRecord, status: string): HistoryStep | undefined {
  return record.history.find((h) => h.status === status)
}

/** Who completed `status`, if it happened. */
export function stepBy(record: BaseRecord, status: string): string | undefined {
  return record.history.find((h) => h.status === status)?.byName
}

export function reached(record: BaseRecord, status: string): boolean {
  return record.history.some((h) => h.status === status)
}

export function isCancelled(record: BaseRecord): boolean {
  return !!record.cancelled
}

/** The last thing that happened, which is what a timeline leads with. */
export function latestStep(record: BaseRecord): HistoryStep | undefined {
  return record.history[record.history.length - 1]
}

/** Notes staff marked public are the only ones a citizen may read. */
export function publicNotes(record: BaseRecord): HistoryStep[] {
  return record.history.filter((h) => h.publicNote && !!h.note)
}

/* ---------- licence shortcuts ---------- */

export const verifiedAt = (l: Licence) => stepAt(l, 'verified')
export const approvedAt = (l: Licence) => stepAt(l, 'approved')
export const issuedAt = (l: Licence) => stepAt(l, 'issued')
export const approvedBy = (l: Licence) => stepBy(l, 'approved')

/* ---------- receipts ---------- */

/** The receipt issued against a licence or a register entry, if any. */
export function receiptFor(receipts: readonly Receipt[], record: Licence | RegisterEntry) {
  if (record.receiptId) return receipts.find((r) => r.id === record.receiptId)
  return receipts.find((r) => r.source.type !== 'holding' && r.source.id === record.id)
}

/** Where a receipt's record lives, for linking back from the receipt list. */
export function receiptTargetPath(receipt: Receipt): string {
  switch (receipt.source.type) {
    case 'trade-licence':
      return `/office/trade-licence/${receipt.source.id}`
    case 'register-entry':
      return `/office/registers/${receipt.source.registerKey}/${receipt.source.id}`
    case 'holding':
      return `/office/holding/${receipt.source.holdingNo}`
  }
}

/** Every open record, i.e. still waiting on somebody. */
export function isOpen(record: BaseRecord): boolean {
  return !record.closedAt && !record.cancelled
}
