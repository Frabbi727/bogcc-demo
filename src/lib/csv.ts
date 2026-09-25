/**
 * CSV export.
 *
 * Officers open these in Excel, which only reads UTF-8 correctly when the file
 * starts with a byte-order mark — without it every Bangla column turns to
 * mojibake, so the BOM is not optional here.
 */

const BOM = '﻿'

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  // A leading =, + or - makes Excel treat the cell as a formula.
  const guarded = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

export interface CsvColumn<T> {
  header: string
  value: (row: T) => unknown
}

/** Builds the CSV text, BOM included. Exported separately so it can be tested. */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const lines = [columns.map((c) => escapeCell(c.header)).join(',')]
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(c.value(row))).join(','))
  }
  return BOM + lines.join('\r\n')
}

/** Builds the CSV and hands it to the browser as a download. */
export function downloadCsv<T>(
  filename: string,
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
): void {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.append(a)
  a.click()
  a.remove()
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
