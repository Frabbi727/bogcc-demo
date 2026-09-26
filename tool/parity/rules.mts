/**
 * Prints SLA, fiscal-year and identifier values for the Flutter port to freeze.
 * See tool/parity/README.md.
 */
import { fiscalYearOf, fiscalYearStart, validUntil } from '../../src/lib/fiscal'
import {
  applicationNo,
  certificateNo,
  holdingNo,
  licenceNo,
  receiptBookRef,
  receiptNo,
  registerSerialNo,
  trackingNo,
} from '../../src/lib/ids'
import { dueDate, workingDaysBetween } from '../../src/lib/sla'

const rows: [string, unknown][] = [
  // The office week is Sunday to Thursday; Friday and Saturday never count.
  // 2026-09-26 is a Saturday, 2026-09-25 a Friday.
  ['dueDate(Sat 09-26, 3)', dueDate('2026-09-26T10:00:00', 3)],
  ['dueDate(Thu 09-24, 7)', dueDate('2026-09-24T10:00:00', 7)],
  ['dueDate(09-28, 0)', dueDate('2026-09-28T10:00:00', 0)],
  ['dueDate(10-28, 5) [month edge]', dueDate('2026-10-28T10:00:00', 5)],

  ['workingDaysBetween(09-24 → 10-01)', workingDaysBetween('2026-09-24T00:00:00', '2026-10-01T00:00:00')],
  ['workingDaysBetween(10-01 → 09-24)', workingDaysBetween('2026-10-01T00:00:00', '2026-09-24T00:00:00')],

  // The fiscal year runs July to June.
  ['fiscalYearOf(2026-06-30)', fiscalYearOf('2026-06-30T12:00:00')],
  ['fiscalYearOf(2026-07-01)', fiscalYearOf('2026-07-01T12:00:00')],
  ['fiscalYearStart(2026-27)', fiscalYearStart('2026-27').toISOString().slice(0, 10)],
  ['validUntil(2026-27)', validUntil('2026-27')],

  ['trackingNo(2026, 123)', trackingNo(2026, 123)],
  ['licenceNo(2026-27, 13)', licenceNo('2026-27', 13)],
  ['applicationNo(2026-27, 7)', applicationNo('2026-27', 7)],
  ['registerSerialNo(SL, 2026-27, 7)', registerSerialNo('SL', '2026-27', 7)],
  ['certificateNo(2026-27, 42)', certificateNo('2026-27', 42)],
  ['receiptNo(2026-27, 104)', receiptNo('2026-27', 104)],
  ['holdingNo(5, 123)', holdingNo(5, 123)],

  // Receipts map onto 100-leaf paper books.
  ['receiptBookRef(1)', JSON.stringify(receiptBookRef(1))],
  ['receiptBookRef(100)', JSON.stringify(receiptBookRef(100))],
  ['receiptBookRef(101)', JSON.stringify(receiptBookRef(101))],
  ['receiptBookRef(250)', JSON.stringify(receiptBookRef(250))],
]

for (const [label, value] of rows) console.log(label.padEnd(36), '=>', value)
