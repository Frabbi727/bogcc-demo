/**
 * Wards and place names.
 *
 * Bogura City Corporation has 21 wards. The area names are real; every
 * councillor name here is invented.
 */

export const WARD_COUNT = 21

export const WARDS: number[] = Array.from({ length: WARD_COUNT }, (_, i) => i + 1)

/** Real Bogura neighbourhood names, used in addresses. */
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

export interface WardInfo {
  ward: number
  councillor: string
  /** Fictional office hours, shown on the citizen "my ward" page. */
  officeHours: string
  mobile: string
}

/** Fictional councillors, one per ward. Ward 5 is the demo councillor login. */
const COUNCILLOR_NAMES = [
  'মোঃ সাইফুল ইসলাম',
  'রেহানা আক্তার',
  'মোঃ কামরুল হাসান',
  'শামসুন নাহার',
  'মোঃ দেলোয়ার হোসেন',
  'আফরোজা খাতুন',
  'মোঃ নুরুল আমিন',
  'তাসলিমা বেগম',
  'মোঃ হাবিবুর রহমান',
  'নাসরিন সুলতানা',
  'মোঃ আব্দুল মালেক',
  'রোকেয়া পারভীন',
  'মোঃ শহিদুল ইসলাম',
  'ফরিদা ইয়াসমিন',
  'মোঃ মিজানুর রহমান',
  'সেলিনা আক্তার',
  'মোঃ আলমগীর কবির',
  'মাহমুদা খানম',
  'মোঃ রেজাউল করিম',
  'শিরিন আক্তার',
  'মোঃ জাকির হোসেন',
]

export const WARD_INFO: WardInfo[] = WARDS.map((ward) => ({
  ward,
  councillor: COUNCILLOR_NAMES[ward - 1],
  officeHours: 'রবি–বৃহস্পতি, সকাল ১০টা – বিকাল ৫টা',
  mobile: `017${String(10000000 + ward * 11111).slice(0, 8)}`,
}))

export function wardInfo(ward: number): WardInfo | undefined {
  return WARD_INFO.find((w) => w.ward === ward)
}

/** The ward the demo councillor login is responsible for. */
export const COUNCILLOR_WARD = 5
