/**
 * Prints Bangla formatting values for the Flutter port to freeze.
 * See tool/parity/README.md.
 */
import {
  amountInWords,
  banglaCalendarDate,
  bnToEnDigits,
  formatDateBn,
  formatDateTimeBn,
  formatDecimalBn,
  formatNumberBn,
  formatTaka,
  formatTimeBn,
  timeAgoBn,
  toBnDigits,
} from '../../src/lib/bn'

const rows: [string, unknown][] = [
  ['toBnDigits(2026)', toBnDigits(2026)],
  ['toBnDigits(BOGCC-2026-000123)', toBnDigits('BOGCC-2026-000123')],
  ['bnToEnDigits(০১৭১২৩৪৫৬৭৮)', bnToEnDigits('০১৭১২৩৪৫৬৭৮')],

  ['formatTaka(125000)', formatTaka(125000)],
  ['formatTaka(0)', formatTaka(0)],
  ['formatTaka(-500)', formatTaka(-500)],
  ['formatNumberBn(10000000)', formatNumberBn(10000000)],
  ['formatDecimalBn(4.2)', formatDecimalBn(4.2)],
  ['formatDecimalBn(4.0)', formatDecimalBn(4.0)],
  ['formatDecimalBn(4.25, 2)', formatDecimalBn(4.25, 2)],

  ['formatDateBn(2026-09-25)', formatDateBn('2026-09-25T15:10:00')],
  ['formatTimeBn(15:10)', formatTimeBn('2026-09-25T15:10:00')],
  ['formatTimeBn(00:00)', formatTimeBn('2026-01-01T00:00:00')],
  ['formatTimeBn(12:00)', formatTimeBn('2026-01-01T12:00:00')],
  ['formatDateTimeBn(2026-09-25 15:10)', formatDateTimeBn('2026-09-25T15:10:00')],

  // The Bangla year rolls over on 14 April; both sides of that matter.
  ['banglaCalendarDate(2026-04-13)', banglaCalendarDate('2026-04-13T12:00:00')],
  ['banglaCalendarDate(2026-04-14)', banglaCalendarDate('2026-04-14T12:00:00')],
  ['banglaCalendarDate(2026-09-25)', banglaCalendarDate('2026-09-25T12:00:00')],

  ['amountInWords(0)', amountInWords(0)],
  ['amountInWords(100)', amountInWords(100)],
  ['amountInWords(1500)', amountInWords(1500)],
  ['amountInWords(125000)', amountInWords(125000)],
  ['amountInWords(1000000)', amountInWords(1000000)],
  ['amountInWords(123456789)', amountInWords(123456789)],

  ['timeAgoBn(-5min)', timeAgoBn('2026-09-26T11:55:00', new Date('2026-09-26T12:00:00'))],
  ['timeAgoBn(-3h)', timeAgoBn('2026-09-26T09:00:00', new Date('2026-09-26T12:00:00'))],
  ['timeAgoBn(-4d)', timeAgoBn('2026-09-22T12:00:00', new Date('2026-09-26T12:00:00'))],
  ['timeAgoBn(-90d)', timeAgoBn('2026-06-28T12:00:00', new Date('2026-09-26T12:00:00'))],
]

for (const [label, value] of rows) console.log(label.padEnd(36), '=>', value)
