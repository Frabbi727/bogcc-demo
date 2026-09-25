import type { Role } from '@/types'

/** Sidebar navigation, grouped by office section (Spec v2 §14). */

export interface NavItem {
  label: string
  to: string
  /** Marks a second-phase placeholder. */
  phase2?: boolean
  /** Restricts the link to these roles; omitted means everyone sees it. */
  roles?: Role[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'সাধারণ',
    items: [
      { label: 'ড্যাশবোর্ড', to: '/office' },
      { label: 'মেয়র ড্যাশবোর্ড', to: '/office/mayor', roles: ['mayor', 'ceo'] },
      { label: 'অনুসন্ধান', to: '/office/search' },
      { label: 'কার্যক্রম লগ', to: '/office/audit-log' },
    ],
  },
  {
    label: 'রাজস্ব শাখা',
    items: [
      { label: 'ট্রেড লাইসেন্স', to: '/office/trade-licence' },
      { label: 'ট্রেড লাইসেন্স রেজিস্টার', to: '/office/register/trade-licence' },
      { label: 'মার্কেট দোকান ভাড়া', to: '/office/registers/market-rent' },
      { label: 'রসিদ ও দৈনিক আদায়', to: '/office/receipts' },
    ],
  },
  {
    label: 'বিদ্যুৎ শাখা',
    items: [{ label: 'সড়কবাতি রেজিস্টার', to: '/office/registers/streetlight' }],
  },
  {
    label: 'পরিচ্ছন্নতা শাখা',
    items: [
      { label: 'অভিযোগ রেজিস্টার', to: '/office/registers/garbage' },
      { label: 'গাড়ির ট্রিপ রেজিস্টার', to: '/office/registers/garbage-trips' },
    ],
  },
  {
    label: 'সনদপত্র',
    items: [
      { label: 'নাগরিকত্ব সনদ', to: '/office/registers/cert-citizen' },
      { label: 'ওয়ারিশ সনদ', to: '/office/registers/cert-warish' },
    ],
  },
  {
    label: 'লাইসেন্স শাখা',
    items: [{ label: 'রিকশা/ভ্যান লাইসেন্স', to: '/office/registers/rickshaw-licence' }],
  },
  {
    label: 'ইঞ্জিনিয়ারিং শাখা',
    items: [{ label: 'ইমারত নকশা রেজিস্টার', to: '/office/registers/building-plan' }],
  },
  {
    label: 'জন্ম ও মৃত্যু নিবন্ধন শাখা',
    items: [{ label: 'জন্ম-মৃত্যু রেফারেন্স', to: '/office/registers/birth-death' }],
  },
]

/** The groups a given role should see, with role-restricted links removed. */
export function navFor(role: Role | undefined): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((group) => group.items.length > 0)
}
