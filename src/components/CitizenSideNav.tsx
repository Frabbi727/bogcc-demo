import { NavLink } from 'react-router-dom'

import { CITIZEN_NAV, useUnreadMessages } from '@/components/citizenNav'
import { toBnDigits } from '@/lib/bn'
import { cn } from '@/lib/cn'

/**
 * Desktop rail for the Citizen Corner. On a wide screen the phone's bottom tabs
 * read as a stretched app, so from `lg:` up navigation moves to the side and the
 * bottom bar hides.
 */
export function CitizenSideNav() {
  const unread = useUnreadMessages()

  return (
    <nav
      aria-label="নাগরিক কর্নার মেনু"
      className="no-print hidden lg:block lg:shrink-0 lg:basis-56"
    >
      <ul className="sticky top-20 flex flex-col gap-0.5">
        {CITIZEN_NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] transition-colors',
                  isActive
                    ? 'bg-forest-50 font-medium text-forest-800'
                    : 'text-ink/80 hover:bg-forest-50/70 hover:text-forest-800',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={17}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="shrink-0 text-forest-700"
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.label === 'বার্তা' && unread > 0 && (
                    <span className="shrink-0 rounded-full bg-stamp px-1.5 text-[10.5px] leading-4 text-white">
                      {toBnDigits(unread)}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
