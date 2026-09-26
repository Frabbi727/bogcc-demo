import { NavLink } from 'react-router-dom'

import { CITIZEN_TABS, useUnreadMessages } from '@/components/citizenNav'
import { toBnDigits } from '@/lib/bn'
import { cn } from '@/lib/cn'

/**
 * Persistent bottom tabs for the Citizen Corner, the way a phone app works.
 * Hidden from `lg:` up, where `CitizenSideNav` takes over.
 */
export function BottomNav() {
  const unread = useUnreadMessages()

  return (
    <nav
      aria-label="নাগরিক কর্নার মেনু"
      className="no-print sticky bottom-0 z-20 border-t border-rule bg-white lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {CITIZEN_TABS.map((tab) => (
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
                    {tab.label === 'বার্তা' && unread > 0 && (
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
