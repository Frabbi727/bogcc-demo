/**
 * Fiscal year helpers. The Bangladesh government fiscal year runs July to June,
 * and register serials restart at 1 each fiscal year.
 */

/** Returns e.g. "2026-27" for any date inside that fiscal year. */
export function fiscalYearOf(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const year = d.getFullYear()
  const start = d.getMonth() >= 6 ? year : year - 1 // July = month 6
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

/** The fiscal year containing today. */
export function currentFiscalYear(): string {
  return fiscalYearOf(new Date())
}

/** First day of a fiscal year: 1 July of its start year. */
export function fiscalYearStart(fy: string): Date {
  return new Date(Number(fy.slice(0, 4)), 6, 1)
}

/**
 * 30 June at the end of the given fiscal year, as a local-time ISO string.
 * Kept local (no `Z`) so the calendar day never shifts by timezone.
 */
export function validUntil(fy: string): string {
  const endYear = Number(fy.slice(0, 4)) + 1
  return `${endYear}-06-30T00:00:00`
}

/** Descending list of fiscal years for filter dropdowns. */
export function fiscalYearOptions(count = 3): string[] {
  const startYear = Number(currentFiscalYear().slice(0, 4))
  return Array.from({ length: count }, (_, i) => {
    const s = startYear - i
    return `${s}-${String((s + 1) % 100).padStart(2, '0')}`
  })
}
