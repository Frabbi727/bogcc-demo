/**
 * Trade licence fee schedule.
 *
 * These are DEMO rates (ডেমো হার), not the real gazetted schedule. The real
 * system reads them from a rate table an officer can edit per fiscal year.
 */

import type { BusinessNature, BusinessType, FeeLine } from '@/types'

export const BUSINESS_NATURES: BusinessNature[] = ['একক', 'অংশীদারি', 'কোম্পানি']

export const BUSINESS_TYPES: BusinessType[] = [
  { key: 'grocery', label: 'মুদি দোকান', licenceFee: 1200, signboardTax: 300 },
  { key: 'pharmacy', label: 'ঔষধের দোকান', licenceFee: 2500, signboardTax: 500 },
  { key: 'restaurant', label: 'রেস্তোরাঁ', licenceFee: 3500, signboardTax: 700 },
  { key: 'clothing', label: 'কাপড়ের দোকান', licenceFee: 1800, signboardTax: 400 },
  { key: 'electronics', label: 'ইলেকট্রনিক্স', licenceFee: 3000, signboardTax: 600 },
  { key: 'sweets', label: 'দই-মিষ্টির দোকান', licenceFee: 2000, signboardTax: 450 },
  { key: 'mobile-service', label: 'মোবাইল সার্ভিসিং', licenceFee: 1500, signboardTax: 350 },
  { key: 'workshop', label: 'ওয়ার্কশপ', licenceFee: 2200, signboardTax: 500 },
  { key: 'coaching', label: 'কোচিং সেন্টার', licenceFee: 2800, signboardTax: 550 },
  { key: 'wholesale', label: 'পাইকারি ব্যবসা', licenceFee: 5000, signboardTax: 900 },
]

/** Fixed charge for the application form and the licence book. */
export const FORM_AND_BOOK_FEE = 200

export const VAT_RATE = 0.15

/** Demo late surcharge on a renewal filed after 30 September. */
export const RENEWAL_LATE_SURCHARGE = 0.1

export function businessTypeOf(key: string): BusinessType {
  return BUSINESS_TYPES.find((t) => t.key === key) ?? BUSINESS_TYPES[0]
}

export function feeTotalOf(lines: readonly FeeLine[]): number {
  return lines.reduce((sum, l) => sum + l.amount, 0)
}

/**
 * The fee lines charged on a trade licence. A renewal filed after 30 September
 * of the fiscal year carries a demo late surcharge on the licence fee.
 */
export function feeLinesFor(
  typeKey: string,
  options: { renewal?: boolean; late?: boolean } = {},
): FeeLine[] {
  const t = businessTypeOf(typeKey)
  const lines: FeeLine[] = [
    { label: 'লাইসেন্স ফি', amount: t.licenceFee },
    { label: 'সাইনবোর্ড কর', amount: t.signboardTax },
    { label: 'ভ্যাট (লাইসেন্স ফির ১৫%)', amount: Math.round(t.licenceFee * VAT_RATE) },
  ]
  // A renewal reuses the existing licence book, so only new licences are charged for one.
  if (!options.renewal) {
    lines.push({ label: 'আবেদন ফরম ও বই মূল্য', amount: FORM_AND_BOOK_FEE })
  }
  if (options.late) {
    lines.push({
      label: 'বিলম্ব ফি (১০%, ডেমো)',
      amount: Math.round(t.licenceFee * RENEWAL_LATE_SURCHARGE),
    })
  }
  return lines
}

/** True when a renewal for `fiscalYear` is being filed after 30 September. */
export function isLateRenewal(fiscalYear: string, at: string | Date): boolean {
  const d = typeof at === 'string' ? new Date(at) : at
  const cutoff = new Date(Number(fiscalYear.slice(0, 4)), 8, 30, 23, 59, 59)
  return d > cutoff
}
