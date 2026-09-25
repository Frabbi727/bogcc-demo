/**
 * Citizen charter — the service catalogue.
 *
 * Defined once and read by both the office side and the Citizen Corner, so the
 * promised time, the fee and the step labels a citizen sees can never drift from
 * what the office actually does. All fees and times are DEMO values (ডেমো হার).
 */

export type FeeKind = 'free' | 'fixed' | 'by-business-type' | 'as-billed'

export interface ServiceFee {
  kind: FeeKind
  /** Set when `kind` is 'fixed'. */
  amount?: number
  /** Bangla description shown on the charter. */
  label: string
}

export interface ServiceDef {
  key: string
  name: string
  description: string
  /** Charter time in working days. 0 means over the counter, same day. */
  charterDays: number
  fee: ServiceFee
  /** Documents the citizen must bring or attach. */
  requiredDocs: string[]
  section: string
  /** Internal status keys, in order. The first is set on creation. */
  statuses: string[]
  /** Internal status key -> the label a citizen reads. */
  citizenLabels: Record<string, string>
  /** Can a citizen apply for this online? */
  citizenFacing: boolean
  /** Registers handled by the config-driven engine link to their config here. */
  registerKey?: string
  /**
   * Some services are not ours to deliver. The charter still lists them, but the
   * page only explains where the citizen should go instead.
   */
  infoOnly?: boolean
  externalUrl?: string
}

export const SERVICES: ServiceDef[] = [
  {
    key: 'tl-new',
    name: 'নতুন ট্রেড লাইসেন্স',
    description:
      'শহরে নতুন ব্যবসা শুরু করতে ট্রেড লাইসেন্স নিতে হয়। আবেদনের পর পরিদর্শক সরেজমিনে প্রতিষ্ঠান যাচাই করেন, এরপর অনুমোদন ও ফি পরিশোধের মাধ্যমে লাইসেন্স ইস্যু হয়।',
    charterDays: 7,
    fee: { kind: 'by-business-type', label: 'ব্যবসার ধরন অনুযায়ী (ডেমো হার)' },
    requiredDocs: [
      'জাতীয় পরিচয়পত্রের কপি',
      'দোকান/প্রতিষ্ঠানের ভাড়ার চুক্তিপত্র বা মালিকানার দলিল',
      'হোল্ডিং কর পরিশোধের সর্বশেষ রসিদ',
      'পাসপোর্ট সাইজের ছবি',
    ],
    section: 'রাজস্ব শাখা',
    statuses: ['submitted', 'verified', 'approved', 'issued'],
    citizenLabels: {
      submitted: 'আবেদন গৃহীত',
      verified: 'মাঠ পর্যায়ে যাচাই সম্পন্ন',
      approved: 'অনুমোদিত, ফি পরিশোধ করুন',
      issued: 'লাইসেন্স প্রস্তুত',
      cancelled: 'বাতিল (কারণসহ)',
    },
    citizenFacing: true,
  },
  {
    key: 'tl-renew',
    name: 'ট্রেড লাইসেন্স নবায়ন',
    description:
      'প্রতি অর্থবছরে ৩০ জুনের মধ্যে লাইসেন্স নবায়ন করতে হয়। পুরোনো লাইসেন্স নম্বর দিলে তথ্য আপনাআপনি চলে আসে; নতুন করে মাঠ যাচাইয়ের প্রয়োজন হয় না।',
    charterDays: 3,
    fee: { kind: 'by-business-type', label: 'ব্যবসার ধরন অনুযায়ী; ৩০ সেপ্টেম্বরের পর ১০% বিলম্ব ফি (ডেমো)' },
    requiredDocs: ['পুরোনো ট্রেড লাইসেন্সের কপি', 'হোল্ডিং কর পরিশোধের সর্বশেষ রসিদ'],
    section: 'রাজস্ব শাখা',
    statuses: ['submitted', 'verified', 'approved', 'issued'],
    citizenLabels: {
      submitted: 'নবায়ন আবেদন গৃহীত',
      verified: 'কাগজপত্র যাচাই সম্পন্ন',
      approved: 'অনুমোদিত, ফি পরিশোধ করুন',
      issued: 'নবায়নকৃত লাইসেন্স প্রস্তুত',
      cancelled: 'বাতিল (কারণসহ)',
    },
    citizenFacing: true,
  },
  {
    key: 'holding-pay',
    name: 'হোল্ডিং কর পরিশোধ',
    description:
      'হোল্ডিং নম্বর দিয়ে আপনার বার্ষিক ধার্যকৃত কর, পরিশোধিত অংশ ও বকেয়া দেখতে পারবেন এবং কিস্তি বা পূর্ণ অর্থ অনলাইনে পরিশোধ করতে পারবেন।',
    charterDays: 0,
    fee: { kind: 'as-billed', label: 'ধার্যকৃত দাবি অনুযায়ী' },
    requiredDocs: ['হোল্ডিং নম্বর'],
    section: 'রাজস্ব শাখা',
    statuses: ['submitted', 'paid'],
    citizenLabels: {
      submitted: 'পরিশোধ শুরু হয়েছে',
      paid: 'পরিশোধ সম্পন্ন, রসিদ প্রস্তুত',
    },
    citizenFacing: true,
  },
  {
    key: 'streetlight',
    name: 'সড়কবাতি অভিযোগ',
    description:
      'রাস্তার বাতি নষ্ট, তার ছেঁড়া বা খুঁটি হেলে গেলে ছবি দিয়ে অভিযোগ করুন। বিদ্যুৎ শাখা মিস্ত্রি পাঠিয়ে মেরামত করবে।',
    charterDays: 3,
    fee: { kind: 'free', label: 'বিনামূল্যে' },
    requiredDocs: ['সমস্যার ছবি (থাকলে)', 'খুঁটি নম্বর বা রাস্তার নাম'],
    section: 'বিদ্যুৎ শাখা',
    statuses: ['received', 'assigned', 'repaired'],
    citizenLabels: {
      received: 'অভিযোগ গৃহীত',
      assigned: 'মিস্ত্রি পাঠানো হয়েছে',
      repaired: 'সমস্যার সমাধান হয়েছে',
      cancelled: 'বাতিল (কারণসহ)',
    },
    citizenFacing: true,
    registerKey: 'streetlight',
  },
  {
    key: 'garbage',
    name: 'বর্জ্য / পরিচ্ছন্নতা অভিযোগ',
    description:
      'ময়লা জমে থাকা, ডাস্টবিন উপচে পড়া বা ড্রেন বন্ধ থাকলে অভিযোগ করুন। পরিচ্ছন্নতা শাখা দল পাঠিয়ে পরিষ্কার করবে।',
    charterDays: 2,
    fee: { kind: 'free', label: 'বিনামূল্যে' },
    requiredDocs: ['সমস্যার ছবি (থাকলে)', 'এলাকা বা ল্যান্ডমার্ক'],
    section: 'পরিচ্ছন্নতা শাখা',
    statuses: ['received', 'assigned', 'cleaned'],
    citizenLabels: {
      received: 'অভিযোগ গৃহীত',
      assigned: 'পরিচ্ছন্নতা দল পাঠানো হয়েছে',
      cleaned: 'পরিষ্কার সম্পন্ন',
      cancelled: 'বাতিল (কারণসহ)',
    },
    citizenFacing: true,
    registerKey: 'garbage',
  },
  {
    key: 'cert-citizen',
    name: 'নাগরিকত্ব সনদ',
    description:
      'বগুড়া সিটি কর্পোরেশনের স্থায়ী বাসিন্দা হিসেবে নাগরিকত্ব সনদ। ফি পরিশোধের পর সংশ্লিষ্ট ওয়ার্ড কাউন্সিলর অনুমোদন দিলে সনদ প্রস্তুত হয়।',
    charterDays: 2,
    fee: { kind: 'fixed', amount: 100, label: '৳১০০ (ডেমো হার)' },
    requiredDocs: ['জাতীয় পরিচয়পত্রের কপি', 'হোল্ডিং কর পরিশোধের রসিদ'],
    section: 'সাধারণ শাখা',
    statuses: ['received', 'paid', 'approved', 'issued'],
    citizenLabels: {
      received: 'আবেদন গৃহীত',
      paid: 'ফি পরিশোধিত',
      approved: 'কাউন্সিলর অনুমোদিত',
      issued: 'সনদ প্রস্তুত',
      cancelled: 'বাতিল (কারণসহ)',
    },
    citizenFacing: true,
    registerKey: 'cert-citizen',
  },
  {
    key: 'cert-warish',
    name: 'ওয়ারিশ সনদ',
    description:
      'মৃত ব্যক্তির উত্তরাধিকারীদের তালিকাসহ ওয়ারিশ সনদ। আবেদনের তথ্য যাচাইয়ের পর ওয়ার্ড কাউন্সিলর অনুমোদন দেন।',
    charterDays: 7,
    fee: { kind: 'fixed', amount: 200, label: '৳২০০ (ডেমো হার)' },
    requiredDocs: [
      'মৃত্যু সনদের কপি',
      'আবেদনকারীর জাতীয় পরিচয়পত্র',
      'ওয়ারিশদের নাম, সম্পর্ক ও বয়সের তালিকা',
    ],
    section: 'সাধারণ শাখা',
    statuses: ['received', 'paid', 'verified', 'approved', 'issued'],
    citizenLabels: {
      received: 'আবেদন গৃহীত',
      paid: 'ফি পরিশোধিত',
      verified: 'তথ্য যাচাই সম্পন্ন',
      approved: 'কাউন্সিলর অনুমোদিত',
      issued: 'সনদ প্রস্তুত',
      cancelled: 'বাতিল (কারণসহ)',
    },
    citizenFacing: true,
    registerKey: 'cert-warish',
  },
  {
    key: 'bdris',
    name: 'জন্ম ও মৃত্যু নিবন্ধন',
    description:
      'জন্ম ও মৃত্যু নিবন্ধন হয় সরকারের জাতীয় BDRIS সিস্টেমে, সিটি কর্পোরেশনের আলাদা রেজিস্টারে নয়। প্রকৃত ব্যবস্থায় কর্পোরেশন ১৭ ডিজিটের নিবন্ধন নম্বর ধরে একটি রেফারেন্স রেজিস্টার রাখবে, যাতে ট্রেড লাইসেন্স বা সনদের আবেদনে নিবন্ধন যাচাই করা যায়।',
    charterDays: 0,
    fee: { kind: 'as-billed', label: 'জাতীয় নির্ধারিত হার' },
    requiredDocs: ['জাতীয় BDRIS পোর্টালের নির্দেশনা অনুযায়ী'],
    section: 'জন্ম ও মৃত্যু নিবন্ধন শাখা',
    statuses: [],
    citizenLabels: {},
    citizenFacing: false,
    infoOnly: true,
    externalUrl: 'https://bdris.gov.bd',
  },
]

export function serviceOf(key: string | undefined): ServiceDef | undefined {
  return SERVICES.find((s) => s.key === key)
}

/** Services a citizen can actually apply for online. */
export const CITIZEN_SERVICES = SERVICES.filter((s) => s.citizenFacing)

/** The citizen-facing label for an internal status. Falls back to the raw key. */
export function citizenLabel(serviceKey: string, status: string): string {
  return serviceOf(serviceKey)?.citizenLabels[status] ?? status
}

/** Charter days for a service, used to compute `dueAt`. */
export function charterDaysOf(serviceKey: string): number {
  return serviceOf(serviceKey)?.charterDays ?? 3
}

/** The fixed fee for a service, or 0 when it is free or billed some other way. */
export function fixedFeeOf(serviceKey: string): number {
  const fee = serviceOf(serviceKey)?.fee
  return fee?.kind === 'fixed' ? (fee.amount ?? 0) : 0
}
