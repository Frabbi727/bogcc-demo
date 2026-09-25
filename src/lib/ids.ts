/**
 * Number and identifier formats.
 *
 * Every number a citizen or an officer reads aloud is built here, so the shapes
 * stay consistent between the seed data, the store and the printed documents.
 */

const pad = (n: number, width: number) => String(n).padStart(width, '0')

/** Leaves per paper receipt book. */
export const RECEIPT_BOOK_LEAVES = 100

/**
 * Citizen-facing tracking number, e.g. `BOGCC-2026-000123`.
 * Kept in Latin digits because citizens type it back into the track form.
 */
export function trackingNo(year: number, n: number): string {
  return `BOGCC-${year}-${pad(n, 6)}`
}

/** Trade licence number, e.g. `BOGCC/TL/2026-27/00013`. */
export function licenceNo(fy: string, serial: number): string {
  return `BOGCC/TL/${fy}/${pad(serial, 5)}`
}

/** Application number for a walk-in or online application. */
export function applicationNo(fy: string, n: number): string {
  return `BOGCC/APP/${fy}/${pad(n, 4)}`
}

/** Generic register serial, e.g. `SL/2026-27/007`. */
export function registerSerialNo(prefix: string, fy: string, serial: number): string {
  return `${prefix}/${fy}/${pad(serial, 3)}`
}

/** Certificate number, e.g. `BOGCC/CERT/2026-27/0042`. */
export function certificateNo(fy: string, serial: number): string {
  return `BOGCC/CERT/${fy}/${pad(serial, 4)}`
}

/** Money receipt number, e.g. `MR/2026-27/0104`. */
export function receiptNo(fy: string, n: number): string {
  return `MR/${fy}/${pad(n, 4)}`
}

/**
 * Where a receipt number would sit in the paper receipt book.
 * Receipt 1 is book 1, leaf 1; receipt 101 is book 2, leaf 1.
 */
export function receiptBookRef(n: number): { bookNo: number; pageNo: number } {
  return {
    bookNo: Math.floor((n - 1) / RECEIPT_BOOK_LEAVES) + 1,
    pageNo: ((n - 1) % RECEIPT_BOOK_LEAVES) + 1,
  }
}

/** Holding number, e.g. `W05-0123`. */
export function holdingNo(ward: number, n: number): string {
  return `W${pad(ward, 2)}-${pad(n, 4)}`
}

/** Mock payment gateway transaction id, e.g. `TXN8F3K2QD1`. */
export function txnId(rand: () => number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  let out = ''
  for (let i = 0; i < 8; i += 1) out += alphabet[Math.floor(rand() * alphabet.length)]
  return `TXN${out}`
}
