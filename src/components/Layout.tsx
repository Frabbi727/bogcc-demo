import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { DemoBanner } from '@/components/DemoBanner'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { useStore } from '@/store/useStore'

/** App shell. Redirects to the role picker when there is no session. */
export function Layout() {
  const session = useStore((s) => s.session)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <DemoBanner />
        <main className="min-w-0 flex-1 px-3 py-4 lg:px-5 lg:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
