/**
 * Seed data for the demo.
 *
 * EVERY person, business, NID and phone number here is invented. Only the
 * Bogura area names are real. Dates are fixed so the demo looks the same on
 * every machine, except the garbage trip log and the newest fee collection,
 * which are anchored to today so the daily dashboard cards are not empty.
 */

import { fiscalYearOf } from '@/lib/fiscal'
import type {
  AuditEntry,
  BusinessNature,
  BusinessType,
  FeeLine,
  Licence,
  LicenceStatus,
  PaymentMode,
  Receipt,
  RegisterEntry,
  Role,
  User,
} from '@/types'

export const WARDS: number[] = Array.from({ length: 21 }, (_, i) => i + 1)

export const AREAS = [
  'সাতমাথা',
  'ঠনঠনিয়া',
  'জলেশ্বরীতলা',
  'মালতিনগর',
  'চেলোপাড়া',
  'সূত্রাপুর',
  'নামাজগড়',
  'কালিতলা',
  'বাদুড়তলা',
  'ফুলবাড়ি',
  'কামারগাড়ি',
  'রহমাননগর',
]

export const BUSINESS_NATURES: BusinessNature[] = ['একক', 'অংশীদারি', 'কোম্পানি']

export const PAYMENT_MODES: PaymentMode[] = ['নগদ', 'বিকাশ', 'ব্যাংক']

/** Fictional staff, one per role. */
export const USERS: Record<Role, User> = {
  operator: {
    role: 'operator',
    name: 'মোঃ রফিকুল ইসলাম',
    title: 'ডাটা এন্ট্রি অপারেটর',
    designation: 'রাজস্ব শাখা',
  },
  inspector: {
    role: 'inspector',
    name: 'শাহানা পারভীন',
    title: 'লাইসেন্স পরিদর্শক',
    designation: 'রাজস্ব শাখা',
  },
  officer: {
    role: 'officer',
    name: 'মোঃ আনিসুর রহমান',
    title: 'লাইসেন্স অফিসার',
    designation: 'রাজস্ব শাখা',
  },
  accounts: {
    role: 'accounts',
    name: 'সুমন কুমার দাস',
    title: 'হিসাবরক্ষক / ক্যাশিয়ার',
    designation: 'হিসাব শাখা',
  },
  electrician: {
    role: 'electrician',
    name: 'মোঃ জাহিদ হাসান',
    title: 'ইলেকট্রিশিয়ান',
    designation: 'বিদ্যুৎ শাখা',
  },
  conservancy: {
    role: 'conservancy',
    name: 'নাজমা বেগম',
    title: 'পরিচ্ছন্নতা পরিদর্শক',
    designation: 'পরিচ্ছন্নতা শাখা',
  },
  ceo: {
    role: 'ceo',
    name: 'ড. মোস্তাফিজুর রহমান',
    title: 'প্রধান নির্বাহী কর্মকর্তা',
    designation: 'প্রধান কার্যালয়',
  },
}

export const ROLE_ORDER: Role[] = [
  'operator',
  'inspector',
  'officer',
  'accounts',
  'electrician',
  'conservancy',
  'ceo',
]

/** Demo rates only (ডেমো হার) — not the real gazetted schedule. */
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

export function businessTypeOf(key: string): BusinessType {
  return BUSINESS_TYPES.find((t) => t.key === key) ?? BUSINESS_TYPES[0]
}

/** The four fee lines charged on every trade licence. */
export function feeLinesFor(typeKey: string): FeeLine[] {
  const t = businessTypeOf(typeKey)
  return [
    { label: 'লাইসেন্স ফি', amount: t.licenceFee },
    { label: 'সাইনবোর্ড কর', amount: t.signboardTax },
    { label: 'ভ্যাট (লাইসেন্স ফির ১৫%)', amount: Math.round(t.licenceFee * VAT_RATE) },
    { label: 'আবেদন ফরম ও বই মূল্য', amount: FORM_AND_BOOK_FEE },
  ]
}

export function feeTotalOf(lines: FeeLine[]): number {
  return lines.reduce((sum, l) => sum + l.amount, 0)
}

/** Formats the paper receipt-book reference: 100 leaves per book. */
export function receiptBookRef(no: number): { bookNo: number; pageNo: number } {
  return { bookNo: Math.floor((no - 1) / 100) + 1, pageNo: ((no - 1) % 100) + 1 }
}

export function licenceNoFor(fy: string, serial: number): string {
  return `BOGCC/TL/${fy}/${String(serial).padStart(5, '0')}`
}

export function registerSerialNo(prefix: string, fy: string, serial: number): string {
  return `${prefix}/${fy}/${String(serial).padStart(4, '0')}`
}

export function appNoFor(fy: string, n: number): string {
  return `APP/${fy}/${String(n).padStart(4, '0')}`
}

/** Local-time ISO string for `n` days before today, at a fixed clock time. */
function daysAgo(n: number, time = '10:30:00'): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T${time}`
}

/** Local-time ISO date (no clock) for `n` days before today. */
function dateAgo(n: number): string {
  return daysAgo(n).slice(0, 10)
}

/* ---------------- Trade licences ---------------- */

interface RawLicence {
  status: LicenceStatus
  nameBn: string
  nameEn: string
  typeKey: string
  nature: BusinessNature
  area: string
  ward: number
  holdingNo: string
  owner: [name: string, father: string, mother: string, nid: string, mobile: string]
  created: string
  verified?: string
  verifyNote?: string
  approved?: string
  issued?: string
  mode?: PaymentMode
  txnRef?: string
  cancelled?: string
  cancelReason?: string
}

/**
 * Listed in the order the paper register would have received them, so serials
 * follow approval order within each fiscal year.
 */
const RAW_LICENCES: RawLicence[] = [
  // ---- FY 2025-26: five issued licences ----
  {
    status: 'issued',
    nameBn: 'মেসার্স রহমান স্টোর',
    nameEn: 'Messrs Rahman Store',
    typeKey: 'grocery',
    nature: 'একক',
    area: 'সাতমাথা',
    ward: 5,
    holdingNo: '১১২/ক',
    owner: ['মোঃ মিজানুর রহমান', 'মোঃ আব্দুল হামিদ', 'রোকেয়া বেগম', '১৯৮৫৩৪৫৬৭৮', '০১৭১১২৩৪৫৬৭'],
    created: '2025-08-04T10:15:00',
    verified: '2025-08-07T12:40:00',
    verifyNote: 'দোকান ও সাইনবোর্ড সরেজমিনে দেখা হয়েছে, তথ্য সঠিক পাওয়া গেছে।',
    approved: '2025-08-11T11:05:00',
    issued: '2025-08-11T15:20:00',
    mode: 'নগদ',
  },
  {
    status: 'issued',
    nameBn: 'নূর ফার্মেসি',
    nameEn: 'Noor Pharmacy',
    typeKey: 'pharmacy',
    nature: 'একক',
    area: 'ঠনঠনিয়া',
    ward: 8,
    holdingNo: '৪৭/খ',
    owner: ['ডাঃ নুরুল আমিন', 'মোঃ ইয়াকুব আলী', 'ফাতেমা খাতুন', '৪৭১২৯৮৩৪৫৬১২৩', '০১৮১৯৮৭৬৫৪৩'],
    created: '2025-09-02T09:50:00',
    verified: '2025-09-06T11:10:00',
    verifyNote: 'ঔষধ প্রশাসনের ড্রাগ লাইসেন্সের কপি যাচাই করা হয়েছে।',
    approved: '2025-09-09T10:30:00',
    issued: '2025-09-10T12:05:00',
    mode: 'বিকাশ',
    txnRef: 'BKS8FQ2104',
  },
  {
    status: 'issued',
    nameBn: 'স্বাদ রেস্টুরেন্ট',
    nameEn: 'Shad Restaurant',
    typeKey: 'restaurant',
    nature: 'অংশীদারি',
    area: 'জলেশ্বরীতলা',
    ward: 3,
    holdingNo: '২০৫',
    owner: ['মোঃ সেলিম উদ্দিন', 'মোঃ কামাল উদ্দিন', 'সুফিয়া বেগম', '৬৫২৩৪৫৬৭৮৯', '০১৯১২৩৩৪৪৫৫'],
    created: '2025-10-12T11:20:00',
    verified: '2025-10-16T13:00:00',
    verifyNote: 'রান্নাঘরের পরিচ্ছন্নতা ও বর্জ্য ব্যবস্থাপনা সন্তোষজনক।',
    approved: '2025-10-20T10:10:00',
    issued: '2025-10-21T11:45:00',
    mode: 'নগদ',
  },
  {
    status: 'issued',
    nameBn: 'তানিয়া বস্ত্রালয়',
    nameEn: 'Tania Bastralaya',
    typeKey: 'clothing',
    nature: 'একক',
    area: 'মালতিনগর',
    ward: 11,
    holdingNo: '৭৮/গ',
    owner: ['তানিয়া আক্তার', 'মোঃ শফিকুল ইসলাম', 'নাসিমা আক্তার', '১৯৯১৭৬৫৪৩২১০৯৮৭৬', '০১৫৫৮৮৭৭৬৬৫'],
    created: '2025-11-05T10:00:00',
    verified: '2025-11-09T12:20:00',
    verifyNote: 'ভাড়ার চুক্তিপত্র ও হোল্ডিং কর পরিশোধের রসিদ দেখা হয়েছে।',
    approved: '2025-11-13T11:30:00',
    issued: '2025-11-13T14:10:00',
    mode: 'নগদ',
  },
  {
    status: 'issued',
    nameBn: 'চেলোপাড়া ইলেকট্রনিক্স',
    nameEn: 'Chelopara Electronics',
    typeKey: 'electronics',
    nature: 'একক',
    area: 'চেলোপাড়া',
    ward: 14,
    holdingNo: '৯',
    owner: ['মোঃ শাহ আলম', 'মোঃ নুরুল হক', 'আমেনা বেগম', '৩৩৪৫৬৭৮৯০১২৩৪', '০১৭৭৬৬৫৫৪৪৩'],
    created: '2025-12-01T09:40:00',
    verified: '2025-12-04T11:55:00',
    verifyNote: 'গুদাম ও প্রদর্শনী কক্ষে অগ্নিনির্বাপক ব্যবস্থা রয়েছে।',
    approved: '2025-12-08T10:25:00',
    issued: '2025-12-09T12:30:00',
    mode: 'ব্যাংক',
    txnRef: 'SBL/CHQ/442198',
  },

  // ---- FY 2026-27: six issued ----
  {
    status: 'issued',
    nameBn: 'সূত্রাপুর মিষ্টান্ন ভাণ্ডার',
    nameEn: 'Sutrapur Mistanna Bhandar',
    typeKey: 'sweets',
    nature: 'একক',
    area: 'সূত্রাপুর',
    ward: 6,
    holdingNo: '৩৩',
    owner: ['গোপাল চন্দ্র ঘোষ', 'নিমাই চন্দ্র ঘোষ', 'অঞ্জলি রানী ঘোষ', '৭৭১২৩৪৫৬৭৮', '০১৭১২৩৪৫৬৭৮'],
    created: '2026-07-06T10:05:00',
    verified: '2026-07-09T12:15:00',
    verifyNote: 'দই তৈরির স্থান ও পানির ব্যবস্থা সরেজমিনে দেখা হয়েছে।',
    approved: '2026-07-13T10:40:00',
    issued: '2026-07-14T11:50:00',
    mode: 'নগদ',
  },
  {
    status: 'issued',
    nameBn: 'হাসান মোবাইল কেয়ার',
    nameEn: 'Hasan Mobile Care',
    typeKey: 'mobile-service',
    nature: 'একক',
    area: 'নামাজগড়',
    ward: 9,
    holdingNo: '১২১',
    owner: ['মোঃ হাসান মাহমুদ', 'মোঃ আবুল কালাম', 'রাশিদা বেগম', '১৯৯৪৮৮৭৭৬৬৫৫৪৪৩৩', '০১৬২২৩৩৪৪৫৫'],
    created: '2026-07-20T09:30:00',
    verified: '2026-07-23T11:40:00',
    verifyNote: 'সার্ভিসিং যন্ত্রপাতি ও বৈদ্যুতিক সংযোগ যাচাই করা হয়েছে।',
    approved: '2026-07-27T10:15:00',
    issued: '2026-07-27T14:25:00',
    mode: 'বিকাশ',
    txnRef: 'BKS9TR4471',
  },
  {
    status: 'issued',
    nameBn: 'কালিতলা অটো ওয়ার্কশপ',
    nameEn: 'Kalitala Auto Workshop',
    typeKey: 'workshop',
    nature: 'অংশীদারি',
    area: 'কালিতলা',
    ward: 17,
    holdingNo: '৬৪/ক',
    owner: ['মোঃ রুবেল মিয়া', 'মোঃ ছাত্তার মিয়া', 'জরিনা বেগম', '২২৩৪৫৬৭৮৯০১২৩', '০১৩১১২২৩৩৪৪'],
    created: '2026-08-03T10:50:00',
    verified: '2026-08-06T13:05:00',
    verifyNote: 'রাস্তার উপর যন্ত্রাংশ না রাখার শর্তে সুপারিশ করা হলো।',
    approved: '2026-08-10T11:00:00',
    issued: '2026-08-11T12:35:00',
    mode: 'নগদ',
  },
  {
    status: 'issued',
    nameBn: 'আলোকিত কোচিং সেন্টার',
    nameEn: 'Alokito Coaching Centre',
    typeKey: 'coaching',
    nature: 'একক',
    area: 'বাদুড়তলা',
    ward: 2,
    holdingNo: '১৫',
    owner: ['মোছাঃ সুরাইয়া ইয়াসমিন', 'মোঃ লুৎফর রহমান', 'হালিমা খাতুন', '৫৫১২৩৪৫৬৭৮', '০১৭৩৪৫৫৬৬৭৭'],
    created: '2026-08-17T09:45:00',
    verified: '2026-08-20T11:30:00',
    verifyNote: 'শ্রেণিকক্ষের ধারণক্ষমতা ও সিঁড়ির প্রস্থ পরিদর্শন করা হয়েছে।',
    approved: '2026-08-24T10:20:00',
    issued: '2026-08-25T11:15:00',
    mode: 'বিকাশ',
    txnRef: 'BKS1LM8830',
  },
  {
    status: 'issued',
    nameBn: 'ফুলবাড়ি ট্রেডার্স',
    nameEn: 'Fulbari Traders',
    typeKey: 'wholesale',
    nature: 'কোম্পানি',
    area: 'ফুলবাড়ি',
    ward: 19,
    holdingNo: '৩০১',
    owner: ['মোঃ জাকির হোসেন', 'মোঃ মোকছেদ আলী', 'ছবিরন নেছা', '৪৪৫৫৬৬৭৭৮৮৯৯০', '০১৮৭৭৬৬৫৫৪৪'],
    created: '2026-09-01T10:10:00',
    verified: '2026-09-04T12:50:00',
    verifyNote: 'গুদামের আয়তন ও পণ্য পরিবহনের পথ যাচাই করা হয়েছে।',
    approved: '2026-09-08T11:25:00',
    issued: '2026-09-09T13:40:00',
    mode: 'ব্যাংক',
    txnRef: 'JBL/PO/771204',
  },
  {
    status: 'issued',
    nameBn: 'মায়ের দোয়া জেনারেল স্টোর',
    nameEn: 'Mayer Doa General Store',
    typeKey: 'grocery',
    nature: 'একক',
    area: 'কামারগাড়ি',
    ward: 12,
    holdingNo: '৮৮',
    owner: ['মোঃ ইলিয়াস আলী', 'মোঃ সোবহান আলী', 'মরিয়ম বেগম', '৬৬১২৩৪৫৬৭৮', '০১৯৪৪৩৩২২১১'],
    created: '2026-09-14T09:55:00',
    verified: '2026-09-17T11:20:00',
    verifyNote: 'পণ্যের মেয়াদ ও ওজন যন্ত্রের সনদ দেখা হয়েছে।',
    approved: '2026-09-21T10:35:00',
    issued: daysAgo(0, '11:40:00'),
    mode: 'নগদ',
  },

  // ---- FY 2026-27: two approved, awaiting fee collection ----
  {
    status: 'approved',
    nameBn: 'রহমাননগর ফার্মেসি',
    nameEn: 'Rahmannagar Pharmacy',
    typeKey: 'pharmacy',
    nature: 'একক',
    area: 'রহমাননগর',
    ward: 20,
    holdingNo: '৫৫',
    owner: ['মোঃ সাইফুল ইসলাম', 'মোঃ আব্দুল মালেক', 'রেহানা পারভীন', '৮৮১২৩৪৫৬৭৮', '০১৭৫৫৪৪৩৩২২'],
    created: '2026-09-15T10:25:00',
    verified: '2026-09-18T12:10:00',
    verifyNote: 'ফ্রিজ ও ঔষধ সংরক্ষণের তাপমাত্রা ঠিক আছে।',
    approved: '2026-09-22T11:05:00',
  },
  {
    status: 'approved',
    nameBn: 'সাতমাথা কাবাব ঘর',
    nameEn: 'Satmatha Kabab Ghar',
    typeKey: 'restaurant',
    nature: 'অংশীদারি',
    area: 'সাতমাথা',
    ward: 5,
    holdingNo: '১১৯',
    owner: ['মোঃ শাকিল আহমেদ', 'মোঃ বেলাল হোসেন', 'নূরজাহান বেগম', '৯৯১২৩৪৫৬৭৮৯০১২৩', '০১৬৮৮৭৭৬৬৫৫'],
    created: '2026-09-16T11:15:00',
    verified: '2026-09-19T13:25:00',
    verifyNote: 'ধোঁয়া নির্গমনের চিমনি ও গ্যাস সিলিন্ডার সংরক্ষণ সঠিক।',
    approved: '2026-09-23T10:50:00',
  },

  // ---- FY 2026-27: two verified, awaiting approval ----
  {
    status: 'verified',
    nameBn: 'ঠনঠনিয়া বস্ত্র বিতান',
    nameEn: 'Thonthonia Bastra Bitan',
    typeKey: 'clothing',
    nature: 'একক',
    area: 'ঠনঠনিয়া',
    ward: 8,
    holdingNo: '৭১',
    owner: ['মোঃ আরিফুল হক', 'মোঃ মোজাম্মেল হক', 'শাহিদা বেগম', '৩১১২৩৪৫৬৭৮', '০১৭৯৯৮৮৭৭৬৬'],
    created: '2026-09-18T10:05:00',
    verified: '2026-09-22T12:35:00',
    verifyNote: 'দোকানের পরিমাপ ও সাইনবোর্ডের আয়তন লিপিবদ্ধ করা হয়েছে।',
  },
  {
    status: 'verified',
    nameBn: 'দিগন্ত ইলেকট্রনিক্স',
    nameEn: 'Digonto Electronics',
    typeKey: 'electronics',
    nature: 'একক',
    area: 'জলেশ্বরীতলা',
    ward: 3,
    holdingNo: '২৪০',
    owner: ['মোঃ নাজমুল হুদা', 'মোঃ আফসার আলী', 'সালেহা খাতুন', '২৭১২৩৪৫৬৭৮৯০১২৩', '০১৮২২১১৩৩৪৪'],
    created: '2026-09-19T09:35:00',
    verified: '2026-09-23T11:45:00',
    verifyNote: 'বৈদ্যুতিক লোড ও আর্থিং ব্যবস্থা পরীক্ষা করা হয়েছে।',
  },

  // ---- FY 2026-27: two freshly submitted ----
  {
    status: 'submitted',
    nameBn: 'মালতিনগর মোবাইল হাব',
    nameEn: 'Maltinagar Mobile Hub',
    typeKey: 'mobile-service',
    nature: 'একক',
    area: 'মালতিনগর',
    ward: 11,
    holdingNo: '৯৬',
    owner: ['মোঃ তানভীর হাসান', 'মোঃ আলতাফ হোসেন', 'রুমা বেগম', '৪৯১২৩৪৫৬৭৮', '০১৭১৮৮৮৯৯০০'],
    created: '2026-09-22T10:45:00',
  },
  {
    status: 'submitted',
    nameBn: 'নবীন কোচিং একাডেমি',
    nameEn: 'Nobin Coaching Academy',
    typeKey: 'coaching',
    nature: 'একক',
    area: 'চেলোপাড়া',
    ward: 14,
    holdingNo: '২৭',
    owner: ['মোছাঃ ফারজানা ইয়াসমিন', 'মোঃ হাবিবুর রহমান', 'জাহানারা বেগম', '৫৮১২৩৪৫৬৭৮৯০১২৩', '০১৫৬৬৫৫৪৪৩৩'],
    created: '2026-09-24T09:20:00',
  },

  // ---- FY 2026-27: one cancelled at the verification stage (so it holds no serial) ----
  {
    status: 'cancelled',
    nameBn: 'চেলোপাড়া মোটর ওয়ার্কশপ',
    nameEn: 'Chelopara Motor Workshop',
    typeKey: 'workshop',
    nature: 'একক',
    area: 'চেলোপাড়া',
    ward: 14,
    holdingNo: '৫২',
    owner: ['মোঃ বাবুল আক্তার', 'মোঃ দেলোয়ার হোসেন', 'হাসনা হেনা', '৬১১২৩৪৫৬৭৮', '০১৩৯৯০০১১২২'],
    created: '2026-08-26T10:30:00',
    verified: '2026-08-30T12:05:00',
    verifyNote: 'আবেদনে উল্লেখিত হোল্ডিং নম্বরে উক্ত প্রতিষ্ঠান পাওয়া যায়নি।',
    cancelled: '2026-09-02T11:15:00',
    cancelReason:
      'আবেদনে উল্লেখিত হোল্ডিং নম্বরের সাথে মাঠ পর্যায়ের তথ্যের অসঙ্গতি পাওয়া গেছে। সংশোধিত কাগজপত্রসহ পুনরায় আবেদন করতে হবে।',
  },
]

/* ---------------- Street light repairs ---------------- */

interface RawStreetLight {
  poleNo: string
  ward: number
  road: string
  faultType: string
  complaintDate: string
  complainant: string
  complainantMobile: string
  technician?: string
  repairDate?: string
  materials?: string
  remarks?: string
  status: string
  /** When each status was reached, for the audit trail. */
  assignedAt?: string
  repairedAt?: string
}

const RAW_STREETLIGHTS: RawStreetLight[] = [
  {
    poleNo: 'SM-014', ward: 5, road: 'সাতমাথা প্রধান সড়ক', faultType: 'বাতি নষ্ট',
    complaintDate: '2026-07-08', complainant: 'মোঃ আব্দুল বারিক', complainantMobile: '০১৭১১৪৪৫৫৬৬',
    technician: 'মোঃ সোহেল রানা', repairDate: '2026-07-11', materials: 'এলইডি বাতি ৫০ওয়াট ১টি',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-07-09T11:20:00', repairedAt: '2026-07-11T16:10:00',
  },
  {
    poleNo: 'TH-031', ward: 8, road: 'ঠনঠনিয়া বাজার রোড', faultType: 'তার ছেঁড়া',
    complaintDate: '2026-07-15', complainant: 'সাবিনা ইয়াসমিন', complainantMobile: '০১৮২২৩৩৪৪৫৫',
    technician: 'মোঃ কামরুল ইসলাম', repairDate: '2026-07-19', materials: 'তার ২০ মিটার, টেপ ২টি',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-07-16T10:40:00', repairedAt: '2026-07-19T15:30:00',
  },
  {
    poleNo: 'JL-007', ward: 3, road: 'জলেশ্বরীতলা স্কুল রোড', faultType: 'সুইচ নষ্ট',
    complaintDate: '2026-07-24', complainant: 'মোঃ রেজাউল করিম', complainantMobile: '০১৯১১২২৩৩৪৪',
    technician: 'মোঃ সোহেল রানা', repairDate: '2026-07-26', materials: 'সুইচ ১টি',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-07-25T09:50:00', repairedAt: '2026-07-26T14:20:00',
  },
  {
    poleNo: 'ML-022', ward: 11, road: 'মালতিনগর মেইন রোড', faultType: 'খুঁটি হেলে গেছে',
    complaintDate: '2026-08-02', complainant: 'মোঃ ফরহাদ হোসেন', complainantMobile: '০১৭৭৩৩৪৪৫৫৬',
    technician: 'মোঃ নজরুল ইসলাম', repairDate: '2026-08-08', materials: 'সিমেন্ট ২ ব্যাগ, খুঁটি সোজাকরণ',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-08-03T11:00:00', repairedAt: '2026-08-08T17:00:00',
    remarks: 'খুঁটির গোড়ায় নতুন ঢালাই দেওয়া হয়েছে।',
  },
  {
    poleNo: 'CH-045', ward: 14, road: 'চেলোপাড়া ব্রিজ রোড', faultType: 'বাতি নষ্ট',
    complaintDate: '2026-08-09', complainant: 'মোছাঃ রোকসানা বেগম', complainantMobile: '০১৬৫৫৬৬৭৭৮৮',
    technician: 'মোঃ কামরুল ইসলাম', repairDate: '2026-08-12', materials: 'এলইডি বাতি ৩০ওয়াট ২টি',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-08-10T10:15:00', repairedAt: '2026-08-12T15:45:00',
  },
  {
    poleNo: 'SU-018', ward: 6, road: 'সূত্রাপুর কলোনি রোড', faultType: 'বাতি নষ্ট',
    complaintDate: '2026-08-18', complainant: 'দীপক কুমার সাহা', complainantMobile: '০১৭১২২১১৩৩৪',
    technician: 'মোঃ সোহেল রানা', repairDate: '2026-08-21', materials: 'এলইডি বাতি ৫০ওয়াট ১টি, হোল্ডার ১টি',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-08-19T09:30:00', repairedAt: '2026-08-21T16:35:00',
  },
  {
    poleNo: 'NM-009', ward: 9, road: 'নামাজগড় কবরস্থান রোড', faultType: 'তার ছেঁড়া',
    complaintDate: '2026-08-27', complainant: 'মোঃ জহুরুল হক', complainantMobile: '০১৮৮৮৭৭৬৬৫৫',
    technician: 'মোঃ নজরুল ইসলাম', repairDate: '2026-09-01', materials: 'তার ৩৫ মিটার',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-08-28T11:45:00', repairedAt: '2026-09-01T15:05:00',
  },
  {
    poleNo: 'KL-033', ward: 17, road: 'কালিতলা হাট রোড', faultType: 'সুইচ নষ্ট',
    complaintDate: '2026-09-03', complainant: 'মোঃ আনোয়ার হোসেন', complainantMobile: '০১৩৩৪৪৫৫৬৬৭',
    technician: 'মোঃ কামরুল ইসলাম', repairDate: '2026-09-05', materials: 'সুইচ ১টি, ফিউজ ২টি',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-09-04T10:20:00', repairedAt: '2026-09-05T14:50:00',
  },
  {
    poleNo: 'BD-012', ward: 2, road: 'বাদুড়তলা মসজিদ রোড', faultType: 'বাতি নষ্ট',
    complaintDate: '2026-09-10', complainant: 'মোঃ সাইদুর রহমান', complainantMobile: '০১৭৪৪৫৫৬৬৭৭',
    technician: 'মোঃ সোহেল রানা', repairDate: '2026-09-14', materials: 'এলইডি বাতি ৩০ওয়াট ১টি',
    status: 'মেরামত সম্পন্ন', assignedAt: '2026-09-11T09:40:00', repairedAt: '2026-09-14T16:20:00',
  },
  {
    poleNo: 'FB-027', ward: 19, road: 'ফুলবাড়ি বাইপাস', faultType: 'খুঁটি হেলে গেছে',
    complaintDate: '2026-09-12', complainant: 'মোঃ মোস্তাক আহমেদ', complainantMobile: '০১৯৬৬৭৭৮৮৯৯',
    technician: 'মোঃ নজরুল ইসলাম', status: 'মিস্ত্রি নিযুক্ত', assignedAt: '2026-09-13T10:10:00',
    remarks: 'ভারী যন্ত্রপাতির প্রয়োজন, বিদ্যুৎ বিভাগের সহায়তা চাওয়া হয়েছে।',
  },
  {
    poleNo: 'KG-005', ward: 12, road: 'কামারগাড়ি রেলগেট রোড', faultType: 'তার ছেঁড়া',
    complaintDate: '2026-09-16', complainant: 'মোছাঃ শিরিনা আক্তার', complainantMobile: '০১৭৮৮৯৯০০১১',
    technician: 'মোঃ কামরুল ইসলাম', status: 'মিস্ত্রি নিযুক্ত', assignedAt: '2026-09-17T11:30:00',
  },
  {
    poleNo: 'RN-041', ward: 20, road: 'রহমাননগর স্কুল রোড', faultType: 'বাতি নষ্ট',
    complaintDate: '2026-09-19', complainant: 'মোঃ হাফিজুর রহমান', complainantMobile: '০১৫৫৪৪৩৩২২১',
    technician: 'মোঃ সোহেল রানা', status: 'মিস্ত্রি নিযুক্ত', assignedAt: '2026-09-20T10:05:00',
  },
  {
    poleNo: 'SM-029', ward: 5, road: 'সাতমাথা পোস্ট অফিস রোড', faultType: 'সুইচ নষ্ট',
    complaintDate: '2026-09-21', complainant: 'মোঃ জামাল উদ্দিন', complainantMobile: '০১৬১১২২৩৩৪৪',
    status: 'অভিযোগ গৃহীত',
  },
  {
    poleNo: 'TH-050', ward: 8, road: 'ঠনঠনিয়া পুকুরপাড় রোড', faultType: 'বাতি নষ্ট',
    complaintDate: '2026-09-23', complainant: 'অরুণ কুমার দত্ত', complainantMobile: '০১৭০০১১২২৩৩',
    status: 'অভিযোগ গৃহীত',
  },
  {
    poleNo: 'JL-019', ward: 3, road: 'জলেশ্বরীতলা হাসপাতাল রোড', faultType: 'তার ছেঁড়া',
    complaintDate: '2026-09-24', complainant: 'মোছাঃ নাসরিন সুলতানা', complainantMobile: '০১৮৫৫৬৬৭৭৮৮',
    status: 'অভিযোগ গৃহীত',
    remarks: 'বৃষ্টির কারণে ঝুঁকিপূর্ণ, দ্রুত ব্যবস্থা প্রয়োজন।',
  },
]

/* ---------------- Garbage vehicle trips ---------------- */

interface RawTrip {
  daysBack: number
  vehicleNo: string
  driver: string
  ward: number
  trips: number
  dumpingSite: string
  fuel: number
  supervisor: string
  status: string
}

const DUMPING_SITES = [
  'ফুলবাড়ি ডাম্পিং স্টেশন',
  'নামাজগড় ট্রান্সফার পয়েন্ট',
  'কামারগাড়ি ল্যান্ডফিল',
]

const RAW_TRIPS: RawTrip[] = [
  { daysBack: 4, vehicleNo: 'বগুড়া-ট-১১-০৪৫২', driver: 'মোঃ আলমগীর হোসেন', ward: 5, trips: 4, dumpingSite: DUMPING_SITES[0], fuel: 18, supervisor: 'মোঃ শফিকুল ইসলাম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 4, vehicleNo: 'বগুড়া-ট-১১-০৭৮১', driver: 'মোঃ রফিক মিয়া', ward: 8, trips: 3, dumpingSite: DUMPING_SITES[1], fuel: 15, supervisor: 'মোঃ শফিকুল ইসলাম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 4, vehicleNo: 'বগুড়া-ট-১১-০৩১৯', driver: 'মোঃ সুমন আলী', ward: 14, trips: 5, dumpingSite: DUMPING_SITES[2], fuel: 22, supervisor: 'আব্দুর রহিম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 3, vehicleNo: 'বগুড়া-ট-১১-০৪৫২', driver: 'মোঃ আলমগীর হোসেন', ward: 3, trips: 4, dumpingSite: DUMPING_SITES[0], fuel: 19, supervisor: 'মোঃ শফিকুল ইসলাম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 3, vehicleNo: 'বগুড়া-ট-১১-০৯৬৪', driver: 'মোঃ বাদশা মিয়া', ward: 11, trips: 3, dumpingSite: DUMPING_SITES[1], fuel: 14, supervisor: 'আব্দুর রহিম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 3, vehicleNo: 'বগুড়া-ট-১১-০৭৮১', driver: 'মোঃ রফিক মিয়া', ward: 17, trips: 4, dumpingSite: DUMPING_SITES[2], fuel: 20, supervisor: 'মোঃ শফিকুল ইসলাম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 2, vehicleNo: 'বগুড়া-ট-১১-০৩১৯', driver: 'মোঃ সুমন আলী', ward: 6, trips: 5, dumpingSite: DUMPING_SITES[0], fuel: 23, supervisor: 'আব্দুর রহিম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 2, vehicleNo: 'বগুড়া-ট-১১-০৪৫২', driver: 'মোঃ আলমগীর হোসেন', ward: 9, trips: 3, dumpingSite: DUMPING_SITES[1], fuel: 16, supervisor: 'মোঃ শফিকুল ইসলাম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 2, vehicleNo: 'বগুড়া-ট-১১-০৯৬৪', driver: 'মোঃ বাদশা মিয়া', ward: 19, trips: 4, dumpingSite: DUMPING_SITES[2], fuel: 21, supervisor: 'আব্দুর রহিম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 1, vehicleNo: 'বগুড়া-ট-১১-০৭৮১', driver: 'মোঃ রফিক মিয়া', ward: 2, trips: 4, dumpingSite: DUMPING_SITES[0], fuel: 18, supervisor: 'মোঃ শফিকুল ইসলাম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 1, vehicleNo: 'বগুড়া-ট-১১-০৩১৯', driver: 'মোঃ সুমন আলী', ward: 12, trips: 5, dumpingSite: DUMPING_SITES[1], fuel: 24, supervisor: 'আব্দুর রহিম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 1, vehicleNo: 'বগুড়া-ট-১১-০৪৫২', driver: 'মোঃ আলমগীর হোসেন', ward: 20, trips: 3, dumpingSite: DUMPING_SITES[2], fuel: 15, supervisor: 'মোঃ শফিকুল ইসলাম', status: 'সুপারভাইজার যাচাইকৃত' },
  { daysBack: 0, vehicleNo: 'বগুড়া-ট-১১-০৯৬৪', driver: 'মোঃ বাদশা মিয়া', ward: 5, trips: 4, dumpingSite: DUMPING_SITES[0], fuel: 19, supervisor: 'আব্দুর রহিম', status: 'এন্ট্রি' },
  { daysBack: 0, vehicleNo: 'বগুড়া-ট-১১-০৭৮১', driver: 'মোঃ রফিক মিয়া', ward: 14, trips: 3, dumpingSite: DUMPING_SITES[1], fuel: 17, supervisor: 'মোঃ শফিকুল ইসলাম', status: 'এন্ট্রি' },
  { daysBack: 0, vehicleNo: 'বগুড়া-ট-১১-০৩১৯', driver: 'মোঃ সুমন আলী', ward: 8, trips: 4, dumpingSite: DUMPING_SITES[2], fuel: 20, supervisor: 'আব্দুর রহিম', status: 'এন্ট্রি' },
]

/* ---------------- Builder ---------------- */

export interface SeedData {
  licences: Licence[]
  receipts: Receipt[]
  entries: RegisterEntry[]
  /** `<sequence key>` -> last used number. Serials never skip a number. */
  sequences: Record<string, number>
  audit: AuditEntry[]
}

export const SEQ = {
  app: (fy: string) => `app-${fy}`,
  licence: (fy: string) => `TL-${fy}`,
  receipt: (fy: string) => `receipt-${fy}`,
  register: (prefix: string, fy: string) => `${prefix}-${fy}`,
}

const pad = (n: number, w = 3) => String(n).padStart(w, '0')

/**
 * Builds the whole demo dataset. Serials are allocated in three ordered passes
 * — application numbers by creation date, register serials by approval date,
 * receipt numbers by collection date — so each sequence is gapless and matches
 * the order the paper book would have been written in.
 */
export function buildSeed(): SeedData {
  const licences = new Map<string, Licence>()
  const receipts: Receipt[] = []
  const entries: RegisterEntry[] = []
  const audit: AuditEntry[] = []
  const sequences: Record<string, number> = {}

  let auditCount = 0
  function log(e: Omit<AuditEntry, 'id'>) {
    auditCount += 1
    audit.push({ id: `au${pad(auditCount, 4)}`, ...e })
  }

  function next(key: string): number {
    sequences[key] = (sequences[key] ?? 0) + 1
    return sequences[key]
  }

  const rows = RAW_LICENCES.map((r, i) => ({ raw: r, id: `tl${pad(i + 1)}` }))

  // Pass 1 — application numbers and the base record, in submission order.
  for (const { raw, id } of [...rows].sort((a, b) => a.raw.created.localeCompare(b.raw.created))) {
    const fy = fiscalYearOf(raw.created)
    const feeLines = feeLinesFor(raw.typeKey)
    const licence: Licence = {
      id,
      appNo: appNoFor(fy, next(SEQ.app(fy))),
      status: raw.status,
      fiscalYear: fy,
      business: {
        nameBn: raw.nameBn,
        nameEn: raw.nameEn,
        typeKey: raw.typeKey,
        nature: raw.nature,
        address: `${raw.area}, হোল্ডিং ${raw.holdingNo}, ওয়ার্ড ${raw.ward}, বগুড়া`,
        area: raw.area,
        ward: raw.ward,
        holdingNo: raw.holdingNo,
      },
      owner: {
        name: raw.owner[0],
        fatherName: raw.owner[1],
        motherName: raw.owner[2],
        nid: raw.owner[3],
        mobile: raw.owner[4],
      },
      feeLines,
      feeTotal: feeTotalOf(feeLines),
      createdAt: raw.created,
      createdBy: USERS.operator.name,
    }
    licences.set(id, licence)

    log({
      at: raw.created,
      userName: USERS.operator.name,
      role: 'operator',
      action: 'আবেদন গ্রহণ',
      recordType: 'trade-licence',
      recordKey: 'trade-licence',
      recordId: id,
      recordLabel: `${raw.nameBn} (${licence.appNo})`,
      note: `নতুন ট্রেড লাইসেন্স আবেদন গ্রহণ করা হয়েছে। ব্যবসার ধরন: ${businessTypeOf(raw.typeKey).label}।`,
    })
  }

  // Field verification.
  for (const { raw, id } of [...rows]
    .filter((r) => r.raw.verified)
    .sort((a, b) => a.raw.verified!.localeCompare(b.raw.verified!))) {
    const licence = licences.get(id)!
    licence.verifiedAt = raw.verified
    licence.verifiedBy = USERS.inspector.name
    licence.verificationNote = raw.verifyNote
    log({
      at: raw.verified!,
      userName: USERS.inspector.name,
      role: 'inspector',
      action: 'মাঠ যাচাই সম্পন্ন',
      recordType: 'trade-licence',
      recordKey: 'trade-licence',
      recordId: id,
      recordLabel: `${raw.nameBn} (${licence.appNo})`,
      note: raw.verifyNote,
      changes: [{ field: 'অবস্থা', before: 'আবেদন জমা', after: 'যাচাইকৃত' }],
    })
  }

  // Pass 2 — approval assigns the register serial and the licence number.
  for (const { raw, id } of [...rows]
    .filter((r) => r.raw.approved)
    .sort((a, b) => a.raw.approved!.localeCompare(b.raw.approved!))) {
    const licence = licences.get(id)!
    const serial = next(SEQ.licence(licence.fiscalYear))
    licence.serial = serial
    licence.licenceNo = licenceNoFor(licence.fiscalYear, serial)
    licence.approvedAt = raw.approved
    licence.approvedBy = USERS.officer.name
    log({
      at: raw.approved!,
      userName: USERS.officer.name,
      role: 'officer',
      action: 'অনুমোদন',
      recordType: 'trade-licence',
      recordKey: 'trade-licence',
      recordId: id,
      recordLabel: `${raw.nameBn} (${licence.licenceNo})`,
      note: `রেজিস্টারে ক্রমিক নং ${serial} লিপিবদ্ধ হয়েছে।`,
      changes: [
        { field: 'অবস্থা', before: 'যাচাইকৃত', after: 'অনুমোদিত' },
        { field: 'ক্রমিক নং', before: '—', after: String(serial) },
        { field: 'লাইসেন্স নং', before: '—', after: licence.licenceNo },
      ],
    })
  }

  // Pass 3 — fee collection issues the money receipt.
  for (const { raw, id } of [...rows]
    .filter((r) => r.raw.issued)
    .sort((a, b) => a.raw.issued!.localeCompare(b.raw.issued!))) {
    const licence = licences.get(id)!
    const fy = fiscalYearOf(raw.issued!)
    const no = next(SEQ.receipt(fy))
    const { bookNo, pageNo } = receiptBookRef(no)
    const receipt: Receipt = {
      id: `rc${pad(no)}-${fy}`,
      no,
      receiptNo: `MR/${fy}/${pad(no, 4)}`,
      bookNo,
      pageNo,
      fiscalYear: fy,
      licenceId: id,
      payerName: licence.owner.name,
      purpose: `ট্রেড লাইসেন্স ফি — ${licence.business.nameBn}`,
      feeLines: licence.feeLines,
      total: licence.feeTotal,
      mode: raw.mode ?? 'নগদ',
      txnRef: raw.txnRef,
      collectedBy: USERS.accounts.name,
      collectedAt: raw.issued!,
    }
    receipts.push(receipt)
    licence.issuedAt = raw.issued
    licence.receiptId = receipt.id
    log({
      at: raw.issued!,
      userName: USERS.accounts.name,
      role: 'accounts',
      action: 'ফি আদায় ও ইস্যু',
      recordType: 'trade-licence',
      recordKey: 'trade-licence',
      recordId: id,
      recordLabel: `${licence.business.nameBn} (${licence.licenceNo})`,
      note: `${receipt.mode} মাধ্যমে ফি আদায়; রসিদ নং ${receipt.receiptNo}, বই নং ${bookNo}, পাতা ${pageNo}।`,
      changes: [
        { field: 'অবস্থা', before: 'অনুমোদিত', after: 'ইস্যুকৃত' },
        { field: 'রসিদ নং', before: '—', after: receipt.receiptNo },
      ],
    })
  }

  // Cancellations — the record stays, only a reason is added.
  for (const { raw, id } of rows.filter((r) => r.raw.cancelled)) {
    const licence = licences.get(id)!
    licence.cancelledAt = raw.cancelled
    licence.cancelledBy = USERS.officer.name
    licence.cancelReason = raw.cancelReason
    log({
      at: raw.cancelled!,
      userName: USERS.officer.name,
      role: 'officer',
      action: 'বাতিল',
      recordType: 'trade-licence',
      recordKey: 'trade-licence',
      recordId: id,
      recordLabel: `${licence.business.nameBn} (${licence.appNo})`,
      note: raw.cancelReason,
      changes: [{ field: 'অবস্থা', before: 'যাচাইকৃত', after: 'বাতিল' }],
    })
  }

  // ---- Street light repairs ----
  RAW_STREETLIGHTS.forEach((raw, i) => {
    const fy = fiscalYearOf(raw.complaintDate)
    const serial = next(SEQ.register('SL', fy))
    const createdAt = `${raw.complaintDate}T09:00:00`
    const entry: RegisterEntry = {
      id: `sl${pad(i + 1)}`,
      registerKey: 'streetlight-repair',
      serial,
      serialNo: registerSerialNo('SL', fy, serial),
      fiscalYear: fy,
      status: raw.status,
      createdAt,
      createdBy: USERS.operator.name,
      data: {
        poleNo: raw.poleNo,
        ward: raw.ward,
        road: raw.road,
        faultType: raw.faultType,
        complaintDate: raw.complaintDate,
        complainant: raw.complainant,
        complainantMobile: raw.complainantMobile,
        technician: raw.technician ?? '',
        repairDate: raw.repairDate ?? '',
        materials: raw.materials ?? '',
        remarks: raw.remarks ?? '',
      },
    }
    entries.push(entry)

    const label = `${raw.poleNo} — ${raw.road} (${entry.serialNo})`
    log({
      at: createdAt,
      userName: USERS.operator.name,
      role: 'operator',
      action: 'নতুন এন্ট্রি',
      recordType: 'register-entry',
      recordKey: 'streetlight-repair',
      recordId: entry.id,
      recordLabel: label,
      note: `${raw.faultType} — অভিযোগকারী ${raw.complainant}। ক্রমিক নং ${serial}।`,
    })
    if (raw.assignedAt) {
      log({
        at: raw.assignedAt,
        userName: USERS.electrician.name,
        role: 'electrician',
        action: 'অবস্থা পরিবর্তন',
        recordType: 'register-entry',
        recordKey: 'streetlight-repair',
        recordId: entry.id,
        recordLabel: label,
        note: `মিস্ত্রি নিযুক্ত: ${raw.technician}`,
        changes: [{ field: 'অবস্থা', before: 'অভিযোগ গৃহীত', after: 'মিস্ত্রি নিযুক্ত' }],
      })
    }
    if (raw.repairedAt) {
      log({
        at: raw.repairedAt,
        userName: USERS.electrician.name,
        role: 'electrician',
        action: 'অবস্থা পরিবর্তন',
        recordType: 'register-entry',
        recordKey: 'streetlight-repair',
        recordId: entry.id,
        recordLabel: label,
        note: `ব্যবহৃত মালামাল: ${raw.materials}`,
        changes: [
          { field: 'অবস্থা', before: 'মিস্ত্রি নিযুক্ত', after: 'মেরামত সম্পন্ন' },
          { field: 'মেরামতের তারিখ', before: '—', after: raw.repairDate ?? '' },
        ],
      })
    }
  })

  // ---- Garbage vehicle trips ----
  RAW_TRIPS.forEach((raw, i) => {
    const date = dateAgo(raw.daysBack)
    const fy = fiscalYearOf(date)
    const serial = next(SEQ.register('GT', fy))
    const createdAt = daysAgo(raw.daysBack, '17:30:00')
    const creator = i % 3 === 0 ? USERS.conservancy : USERS.operator
    const entry: RegisterEntry = {
      id: `gt${pad(i + 1)}`,
      registerKey: 'garbage-trips',
      serial,
      serialNo: registerSerialNo('GT', fy, serial),
      fiscalYear: fy,
      status: raw.status,
      createdAt,
      createdBy: creator.name,
      data: {
        date,
        vehicleNo: raw.vehicleNo,
        driver: raw.driver,
        ward: raw.ward,
        trips: raw.trips,
        dumpingSite: raw.dumpingSite,
        fuel: raw.fuel,
        supervisor: raw.supervisor,
      },
    }
    entries.push(entry)

    const label = `${raw.vehicleNo} — ওয়ার্ড ${raw.ward} (${entry.serialNo})`
    log({
      at: createdAt,
      userName: creator.name,
      role: creator.role,
      action: 'নতুন এন্ট্রি',
      recordType: 'register-entry',
      recordKey: 'garbage-trips',
      recordId: entry.id,
      recordLabel: label,
      note: `${raw.trips} ট্রিপ, ${raw.dumpingSite}। ক্রমিক নং ${serial}।`,
    })
    if (raw.status === 'সুপারভাইজার যাচাইকৃত') {
      log({
        at: daysAgo(raw.daysBack, '19:15:00'),
        userName: USERS.conservancy.name,
        role: 'conservancy',
        action: 'অবস্থা পরিবর্তন',
        recordType: 'register-entry',
        recordKey: 'garbage-trips',
        recordId: entry.id,
        recordLabel: label,
        note: `সুপারভাইজার ${raw.supervisor}-এর প্রতিবেদনের সাথে মিলিয়ে যাচাই করা হয়েছে।`,
        changes: [{ field: 'অবস্থা', before: 'এন্ট্রি', after: 'সুপারভাইজার যাচাইকৃত' }],
      })
    }
  })

  audit.sort((a, b) => a.at.localeCompare(b.at))

  return {
    licences: [...licences.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    receipts: receipts.sort((a, b) => b.collectedAt.localeCompare(a.collectedAt)),
    entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    sequences,
    audit,
  }
}
