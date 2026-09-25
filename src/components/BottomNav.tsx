import { Bell, FileText, Home, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/cn'
import { useStore } from '@/store/useStore'
import { toBnDigits } from '@/lib/bn'

const TABS = [
  { to: '/nagorik', label: 'হোম', icon: Home, end: true },
  { to: '/nagorik/services', label: 'সেবা', icon: FileText, end: false },
  { to: '/nagorik/track', label: 'ট্র্যাক', icon: Search, end: false },
  { to: '/nagorik/messages', label: 'বার্তা', icon: Bell, end: false },
]

/** Persistent bottom tabs for the Citizen Corner, the way a phone app works. */
export function BottomNav() {
  const mobile = useStore((s) => s.citizen?.mobile)
  const unread = useStore((s) =>
    mobile ? s.notifications.filter((n) => n.mobile === mobile && !n.read).length : 0,
  )

  return (
    <nav
      aria-label="নাগরিক কর্নার মেনু"
      className="no-print sticky bottom-0 z-20 border-t border-rule bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11.5px]',
                  isActive ? 'text-forest-700' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <tab.icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                    {tab.to === '/nagorik/messages' && unread > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-stamp px-1 text-[10px] leading-4 text-white">
                        {toBnDigits(unread)}
                      </span>
                    )}
                  </span>
                  {tab.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
