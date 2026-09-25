/** Sidebar navigation, grouped by office section. */

export interface NavItem {
  label: string
  to: string
  /** Marks a second-phase placeholder. */
  phase2?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'সাধারণ',
    items: [
      { label: 'ড্যাশবোর্ড', to: '/' },
      { label: 'অনুসন্ধান', to: '/search' },
      { label: 'কার্যক্রম লগ', to: '/audit-log' },
    ],
  },
  {
    label: 'রাজস্ব শাখা',
    items: [
      { label: 'ট্রেড লাইসেন্স', to: '/trade-licence' },
      { label: 'ট্রেড লাইসেন্স রেজিস্টার', to: '/register' },
      { label: 'রসিদ', to: '/receipts' },
      { label: 'হোল্ডিং কর', to: '/phase-2/holding-tax', phase2: true },
      { label: 'মার্কেট দোকান ভাড়া', to: '/phase-2/market-rent', phase2: true },
    ],
  },
  {
    label: 'বিদ্যুৎ শাখা',
    items: [{ label: 'সড়কবাতি মেরামত রেজিস্টার', to: '/registers/streetlight-repair' }],
  },
  {
    label: 'পরিচ্ছন্নতা শাখা',
    items: [{ label: 'বর্জ্য পরিবহন ট্রিপ রেজিস্টার', to: '/registers/garbage-trips' }],
  },
  {
    label: 'অন্যান্য (দ্বিতীয় ধাপ)',
    items: [
      { label: 'জন্ম-মৃত্যু', to: '/phase-2/birth-death', phase2: true },
      { label: 'সনদপত্র', to: '/phase-2/certificates', phase2: true },
      { label: 'রিকশা/ভ্যান লাইসেন্স', to: '/phase-2/rickshaw-licence', phase2: true },
      { label: 'ইমারত নকশা', to: '/phase-2/building-plan', phase2: true },
    ],
  },
]
