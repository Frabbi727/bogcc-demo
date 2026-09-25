/**
 * Modules planned for the second phase (Spec v2 §14).
 *
 * These are deliberately *not* built. Each page explains what the module will do
 * and lists the register columns it will carry, so officers can see their own
 * book is understood even though it is not digital yet.
 */

export interface Phase2Module {
  key: string
  title: string
  section: string
  purpose: string
  columns: string[]
  /** Set when the work really belongs to another system, not to a future phase. */
  external?: { label: string; url: string }
}

export const PHASE2_MODULES: Phase2Module[] = [
  {
    key: 'birth-death',
    title: 'জন্ম-মৃত্যু রেফারেন্স রেজিস্টার',
    section: 'জন্ম ও মৃত্যু নিবন্ধন শাখা',
    purpose:
      'জন্ম ও মৃত্যু নিবন্ধন হয় সরকারের জাতীয় BDRIS সিস্টেমে — সিটি কর্পোরেশনের আলাদা খাতায় নয়। প্রকৃত ব্যবস্থায় কর্পোরেশন ১৭ ডিজিটের নিবন্ধন নম্বর ধরে একটি রেফারেন্স রেজিস্টার রাখবে, যাতে ট্রেড লাইসেন্স বা সনদের আবেদনের সময় নিবন্ধন যাচাই করা যায়।',
    columns: [
      'ক্রমিক নং',
      'নিবন্ধন নং (১৭ ডিজিট)',
      'ধরন (জন্ম/মৃত্যু)',
      'নাম',
      'পিতার নাম',
      'মাতার নাম',
      'জন্ম/মৃত্যুর তারিখ',
      'ওয়ার্ড',
      'যাচাইয়ের তারিখ',
      'যে কাজে ব্যবহৃত',
    ],
    external: { label: 'জাতীয় BDRIS পোর্টাল', url: 'https://bdris.gov.bd' },
  },
  {
    key: 'market-rent',
    title: 'মার্কেট দোকান ভাড়া',
    section: 'রাজস্ব শাখা',
    purpose:
      'কর্পোরেশনের মার্কেটের দোকান বরাদ্দ, মাসিক ভাড়া আদায় ও বকেয়ার হিসাব রাখা হবে। বকেয়া দোকানের তালিকা এক ক্লিকে পাওয়া যাবে। হোল্ডিং করের মতো এখানেও প্রতি দোকানের বিপরীতে বারবার আদায় হয়, তাই আলাদা দাবি-আদায় মডিউল লাগবে।',
    columns: [
      'ক্রমিক নং',
      'মার্কেটের নাম',
      'দোকান নং',
      'বরাদ্দগ্রহীতার নাম',
      'ব্যবসার ধরন',
      'মাসিক ভাড়া',
      'মাস',
      'আদায়কৃত',
      'বকেয়া',
      'রসিদ নং',
    ],
  },
  {
    key: 'rickshaw-licence',
    title: 'রিকশা / ভ্যান লাইসেন্স',
    section: 'লাইসেন্স শাখা',
    purpose:
      'রিকশা, ভ্যান ও ইজিবাইকের লাইসেন্স, নম্বর প্লেট বরাদ্দ এবং বার্ষিক নবায়নের হিসাব রাখা হবে। ট্রেড লাইসেন্সের মতোই ধাপ, তবে প্রতি বছর নবায়ন ও প্লেট ব্যবস্থাপনা যোগ হবে।',
    columns: [
      'ক্রমিক নং',
      'লাইসেন্স নং',
      'যানবাহনের ধরন',
      'প্লেট নং',
      'মালিকের নাম',
      'চালকের নাম',
      'ঠিকানা',
      'ওয়ার্ড',
      'ইস্যুর তারিখ',
      'নবায়নের তারিখ',
      'ফি',
    ],
  },
  {
    key: 'building-plan',
    title: 'ইমারত নকশা অনুমোদন',
    section: 'ইঞ্জিনিয়ারিং শাখা',
    purpose:
      'ইমারত নির্মাণের নকশা অনুমোদনের আবেদন, পরিদর্শন প্রতিবেদন ও অনুমোদনের ধাপগুলো ধারাবাহিকভাবে লিপিবদ্ধ হবে। নকশার ফাইল সংরক্ষণ ও ইঞ্জিনিয়ারের পরিদর্শন প্রতিবেদন যোগ করতে হবে।',
    columns: [
      'ক্রমিক নং',
      'আবেদন নং',
      'আবেদনের তারিখ',
      'আবেদনকারীর নাম',
      'হোল্ডিং নং',
      'ওয়ার্ড',
      'জমির পরিমাণ',
      'তলা সংখ্যা',
      'নকশাকারের নাম',
      'পরিদর্শনের তারিখ',
      'অনুমোদনের তারিখ',
      'ফি',
    ],
  },
]

export function getPhase2Module(key: string | undefined): Phase2Module | undefined {
  return PHASE2_MODULES.find((m) => m.key === key)
}
