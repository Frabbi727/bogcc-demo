import { Link, Outlet } from 'react-router-dom'

import { BottomNav } from '@/components/BottomNav'
import { DemoBanner } from '@/components/DemoBanner'
import { useStore } from '@/store/useStore'
import { toBnDigits } from '@/lib/bn'

/**
 * Citizen Corner shell. Mobile-first with large touch targets: most citizens open
 * this on a phone, so the tabs sit at the bottom within thumb reach.
 */
export function CitizenLayout() {
  const citizen = useStore((s) => s.citizen)
  const citizenLogout = useStore((s) => s.citizenLogout)

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <DemoBanner />

      <header className="no-print sticky top-0 z-20 border-b border-rule/70 bg-forest-700 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/nagorik" className="min-w-0">
            <p className="truncate font-display text-[16px] leading-tight">নাগরিক কর্নার</p>
            <p className="truncate text-[11.5px] text-white/70">বগুড়া সিটি কর্পোরেশন</p>
          </Link>
          {citizen ? (
            <button
              type="button"
              onClick={citizenLogout}
              className="shrink-0 rounded-sm border border-white/25 px-2 py-1 text-[12px] text-white/90 hover:bg-white/10"
            >
              {toBnDigits(citizen.mobile)} · প্রস্থান
            </button>
          ) : (
            <Link
              to="/office/login"
              className="shrink-0 rounded-sm border border-white/25 px-2 py-1 text-[12px] text-white/90 hover:bg-white/10"
            >
              অফিস লগইন
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
