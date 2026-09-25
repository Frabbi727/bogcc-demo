/**
 * Bangla language and number formatting helpers.
 *
 * Every number, date, serial and amount shown in the UI goes through one of
 * these, because the register books are read in Bangla digits.
 */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const

/** Converts every 0-9 in the input to ০-৯. Leaves other characters alone. */
export function toBnDigits(v: string | number): string {
  return String(v).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

/** Converts ০-৯ back to 0-9 so form inputs accept Bangla digits. */
export function bnToEnDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d as (typeof BN_DIGITS)[number])))
}

/** Indian digit grouping: 125000 -> "1,25,000". */
function groupIndian(n: number): string {
  const s = Math.abs(Math.trunc(n)).toString()
  if (s.length <= 3) return s
  const head = s.slice(0, s.length - 3)
  const tail = s.slice(-3)
  return head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + tail
}

/** Returns e.g. ৳১,২৫,০০০ */
export function formatTaka(n: number): string {
  const sign = n < 0 ? '-' : ''
  return sign + '৳' + toBnDigits(groupIndian(n))
}

/**
 * A number that keeps its decimals, e.g. ৪.২ — averages and ratings would
 * otherwise be truncated to whole numbers by the grouping helpers.
 * Trailing zeros are dropped, so 4.0 still reads ৪.
 */
export function formatDecimalBn(n: number, places = 1): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const [whole, fraction = ''] = abs.toFixed(places).split('.')
  const decimals = fraction.replace(/0+$/, '')
  return sign + toBnDigits(groupIndian(Number(whole)) + (decimals ? `.${decimals}` : ''))
}

/** Plain grouped number in Bangla digits, no currency symbol. */
export function formatNumberBn(n: number): string {
  return toBnDigits(groupIndian(n))
}

const GREGORIAN_MONTHS_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
]

/** Returns e.g. ২৫ সেপ্টেম্বর ২০২৬ */
export function formatDateBn(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${toBnDigits(d.getDate())} ${GREGORIAN_MONTHS_BN[d.getMonth()]} ${toBnDigits(d.getFullYear())}`
}

/** Bangla name for the part of day a 24-hour clock hour falls in. */
function dayPartBn(hour24: number): string {
  if (hour24 >= 4 && hour24 < 6) return 'ভোর'
  if (hour24 >= 6 && hour24 < 12) return 'সকাল'
  if (hour24 >= 12 && hour24 < 15) return 'দুপুর'
  if (hour24 >= 15 && hour24 < 18) return 'বিকাল'
  if (hour24 >= 18 && hour24 < 20) return 'সন্ধ্যা'
  return 'রাত'
}

/** Returns e.g. ২৫ সেপ্টেম্বর ২০২৬, বিকাল ৩:১০ */
export function formatDateTimeBn(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h24 = d.getHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDateBn(iso)}, ${dayPartBn(h24)} ${toBnDigits(h12)}:${toBnDigits(mm)}`
}

/** Returns e.g. বিকাল ৩:১০ */
export function formatTimeBn(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h24 = d.getHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${dayPartBn(h24)} ${toBnDigits(h12)}:${toBnDigits(mm)}`
}

/* ---------- Revised Bangladesh calendar ---------- */

const BANGLA_MONTHS = [
  'বৈশাখ',
  'জ্যৈষ্ঠ',
  'আষাঢ়',
  'শ্রাবণ',
  'ভাদ্র',
  'আশ্বিন',
  'কার্তিক',
  'অগ্রহায়ণ',
  'পৌষ',
  'মাঘ',
  'ফাল্গুন',
  'চৈত্র',
]

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/** Day count of each Bangla month for a Bangla year that starts in `startYear`. */
function banglaMonthLengths(startYear: number): number[] {
  // Falgun of this Bangla year falls in the Gregorian year after 14 April.
  const falgun = isLeapYear(startYear + 1) ? 30 : 29
  return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgun, 30]
}

function dayNumber(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m, d) / 86400000)
}

/**
 * Revised Bangladesh calendar date, e.g. `১০ আশ্বিন ১৪৩৩ বঙ্গাব্দ`.
 * 1 Boishakh is fixed to 14 April.
 */
export function banglaCalendarDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const gy = date.getFullYear()
  const today = dayNumber(gy, date.getMonth(), date.getDate())
  const newYearThisYear = dayNumber(gy, 3, 14) // 14 April

  // Before 14 April we are still in the Bangla year that began last April.
  const startYear = today >= newYearThisYear ? gy : gy - 1
  const banglaYear = startYear - 593
  let offset = today - dayNumber(startYear, 3, 14)

  const lengths = banglaMonthLengths(startYear)
  let monthIndex = 0
  while (monthIndex < 11 && offset >= lengths[monthIndex]) {
    offset -= lengths[monthIndex]
    monthIndex += 1
  }

  return `${toBnDigits(offset + 1)} ${BANGLA_MONTHS[monthIndex]} ${toBnDigits(banglaYear)} বঙ্গাব্দ`
}

/* ---------- Amount in words ---------- */

const UNITS_BN = [
  'শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
  'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ',
  'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'উনত্রিশ',
  'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'উনচল্লিশ',
  'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'উনপঞ্চাশ',
  'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'উনষাট',
  'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'উনসত্তর',
  'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'উনআশি',
  'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'উননব্বই',
  'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই',
]

/**
 * Bangla words for a taka amount, e.g. `এক হাজার পাঁচশত টাকা মাত্র`.
 * Uses কোটি / লক্ষ / হাজার / শত like a hand-written money receipt.
 */
export function amountInWords(n: number): string {
  const whole = Math.abs(Math.trunc(n))
  if (whole === 0) return 'শূন্য টাকা মাত্র'

  const parts: string[] = []
  let rest = whole

  const crore = Math.floor(rest / 10000000)
  rest %= 10000000
  const lakh = Math.floor(rest / 100000)
  rest %= 100000
  const thousand = Math.floor(rest / 1000)
  rest %= 1000
  const hundred = Math.floor(rest / 100)
  const below = rest % 100

  if (crore > 0) parts.push(`${amountInWords(crore).replace(' টাকা মাত্র', '')} কোটি`)
  if (lakh > 0) parts.push(`${UNITS_BN[lakh]} লক্ষ`)
  if (thousand > 0) parts.push(`${UNITS_BN[thousand]} হাজার`)
  if (hundred > 0) parts.push(`${UNITS_BN[hundred]}শত`)
  if (below > 0) parts.push(UNITS_BN[below])

  const sign = n < 0 ? 'ঋণাত্মক ' : ''
  return `${sign}${parts.join(' ')} টাকা মাত্র`
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Coarse relative time, e.g. "৫ মিনিট আগে". Used on activity feeds where the
 * exact timestamp matters less than how fresh the line is.
 */
export function timeAgoBn(iso: string, from: Date = new Date()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = from.getTime() - then
  if (diff < 0) return 'এখনই'
  if (diff < MINUTE) return 'এইমাত্র'
  if (diff < HOUR) return `${toBnDigits(Math.floor(diff / MINUTE))} মিনিট আগে`
  if (diff < DAY) return `${toBnDigits(Math.floor(diff / HOUR))} ঘণ্টা আগে`
  const days = Math.floor(diff / DAY)
  if (days < 30) return `${toBnDigits(days)} দিন আগে`
  const months = Math.floor(days / 30)
  if (months < 12) return `${toBnDigits(months)} মাস আগে`
  return `${toBnDigits(Math.floor(months / 12))} বছর আগে`
}
