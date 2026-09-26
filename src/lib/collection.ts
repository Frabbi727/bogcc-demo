/**
 * Daily collection arithmetic for the accounts desk (Spec v2 §14).
 *
 * The screen and the printable statement must never disagree, so both read
 * these functions rather than summing receipts themselves.
 */

import { PAYMENT_MODES } from '@/data/seed'
import { REVENUE_HEAD_LABEL, REVENUE_HEADS } from '@/lib/mayor'
import type { PaymentMode, Receipt, RevenueHead } from '@/types'

/** Local-date key (YYYY-MM-DD). Receipt timestamps are local, so this matches. */
export function dateKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function receiptsOn(receipts: readonly Receipt[], day: string): Receipt[] {
  return receipts
    .filter((r) => r.collectedAt.slice(0, 10) === day)
    .sort((a, b) => a.no - b.no)
}

export interface CollectionLine {
  label: string
  count: number
  total: number
}

/** By revenue head, in a fixed order so the statement's rows never move. */
export function byHead(receipts: readonly Receipt[]): CollectionLine[] {
  return REVENUE_HEADS.map((head: RevenueHead) => {
    const rows = receipts.filter((r) => r.head === head)
    return {
      label: REVENUE_HEAD_LABEL[head],
      count: rows.length,
      total: rows.reduce((s, r) => s + r.total, 0),
    }
  })
}

/**
 * By channel: each counter mode on its own line, then online. That is how a
 * cashier reconciles — the cash drawer is one line, bKash another.
 */
export function byChannel(receipts: readonly Receipt[]): CollectionLine[] {
  const counter = PAYMENT_MODES.map((mode: PaymentMode) => {
    const rows = receipts.filter((r) => r.channel === 'office' && r.mode === mode)
    return { label: mode, count: rows.length, total: rows.reduce((s, r) => s + r.total, 0) }
  })
  const online = receipts.filter((r) => r.channel === 'online')
  return [
    ...counter,
    { label: 'অনলাইন', count: online.length, total: online.reduce((s, r) => s + r.total, 0) },
  ]
}

export function totalOf(receipts: readonly Receipt[]): number {
  return receipts.reduce((s, r) => s + r.total, 0)
}

/** Cash in the drawer at the end of the day, which is what gets deposited. */
export function cashTotal(receipts: readonly Receipt[]): number {
  return receipts
    .filter((r) => r.channel === 'office' && r.mode === 'নগদ')
    .reduce((s, r) => s + r.total, 0)
}

/** Every day that has at least one receipt, newest first. */
export function collectionDays(receipts: readonly Receipt[]): string[] {
  const days = new Set(receipts.map((r) => r.collectedAt.slice(0, 10)))
  return [...days].sort((a, b) => b.localeCompare(a))
}
