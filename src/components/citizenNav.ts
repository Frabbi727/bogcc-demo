import {
  Bell,
  FileText,
  Home,
  MapPin,
  Megaphone,
  Receipt,
  Search,
  ShieldCheck,
} from 'lucide-react'

import { COUNCILLOR_WARD } from '@/data/wards'
import { useStore } from '@/store/useStore'

export interface CitizenNavItem {
  to: string
  label: string
  icon: typeof Home
  /** Match this route exactly, so the home tab does not stay lit everywhere. */
  end: boolean
}

/**
 * The four phone tabs. This list is the Flutter parity surface — the mobile app
 * ships the same bottom bar, so adding a fifth tab here means changing the port.
 */
export const CITIZEN_TABS: CitizenNavItem[] = [
  { to: '/nagorik', label: 'হোম', icon: Home, end: true },
  { to: '/nagorik/services', label: 'সেবা', icon: FileText, end: false },
  { to: '/nagorik/track', label: 'ট্র্যাক', icon: Search, end: false },
  { to: '/nagorik/messages', label: 'বার্তা', icon: Bell, end: false },
]

/**
 * Everything a citizen can reach, for the desktop rail. A wide screen has room
 * for the destinations the phone hides behind home-screen tiles, so the rail
 * lists them rather than making the tiles the only way in.
 */
export const CITIZEN_NAV: CitizenNavItem[] = [
  ...CITIZEN_TABS,
  { to: '/nagorik/holding', label: 'হোল্ডিং কর', icon: Receipt, end: false },
  { to: '/nagorik/notices', label: 'নোটিশ', icon: Megaphone, end: false },
  { to: `/nagorik/ward/${COUNCILLOR_WARD}`, label: 'আমার ওয়ার্ড', icon: MapPin, end: false },
  { to: '/verify', label: 'সনদ যাচাই', icon: ShieldCheck, end: false },
]

/**
 * Unread simulated SMS for the signed-in mobile. Both navs badge বার্তা with
 * this, so the two can never disagree about the count.
 */
export function useUnreadMessages(): number {
  const mobile = useStore((s) => s.citizen?.mobile)
  return useStore((s) =>
    mobile ? s.notifications.filter((n) => n.mobile === mobile && !n.read).length : 0,
  )
}
