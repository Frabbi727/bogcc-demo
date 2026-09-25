import { Menu, RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ROLE_ORDER, USERS } from '@/data/seed'
import { useStore } from '@/store/useStore'
import type { Role } from '@/types'

interface Props {
  onOpenMenu: () => void
}

export function TopBar({ onOpenMenu }: Props) {
  const navigate = useNavigate()
  const session = useStore((s) => s.session)
  const switchRole = useStore((s) => s.switchRole)
  const resetDemo = useStore((s) => s.resetDemo)
  const [query, setQuery] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const user = session ? USERS[session.role] : null

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  function onSwitchRole(role: Role) {
    switchRole(role)
    toast.success(`${USERS[role].title} হিসেবে দেখা হচ্ছে`)
  }

  return (
    <header className="no-print flex items-center gap-3 border-b border-rule/70 bg-white px-3 py-2 lg:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="মেনু খুলুন"
        className="rounded-sm p-1.5 text-muted hover:bg-paper hover:text-ink lg:hidden"
      >
        <Menu size={18} />
      </button>

      <form onSubmit={onSearch} className="relative min-w-0 flex-1 max-w-md">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="নাম, এনআইডি, লাইসেন্স নং, গাড়ি নং…"
          aria-label="সর্বত্র অনুসন্ধান"
          className="w-full rounded-sm border border-rule bg-white py-1.5 pr-2.5 pl-8 text-[13.5px] focus:border-forest-700 focus:outline-none"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {user && (
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-[13.5px] font-medium">{user.name}</p>
            <p className="text-[12px] text-muted">{user.title}</p>
          </div>
        )}

        <label className="sr-only" htmlFor="role-switcher">
          ভূমিকা পরিবর্তন
        </label>
        <select
          id="role-switcher"
          value={session?.role ?? ''}
          onChange={(e) => onSwitchRole(e.target.value as Role)}
          className="max-w-[11.5rem] rounded-sm border border-rule bg-white px-2 py-1.5 text-[13px] focus:border-forest-700 focus:outline-none"
          title="ভূমিকা পরিবর্তন করুন"
        >
          {ROLE_ORDER.map((role) => (
            <option key={role} value={role}>
              {USERS[role].title}
            </option>
          ))}
        </select>

        <Button size="sm" onClick={() => setConfirmReset(true)} title="ডেমো তথ্য পুনঃস্থাপন">
          <RotateCcw size={13} />
          <span className="hidden sm:inline">ডেমো রিসেট</span>
        </Button>
      </div>

      <Dialog
        open={confirmReset}
        title="ডেমো রিসেট করবেন?"
        description="আপনার তৈরি করা সকল এন্ট্রি মুছে গিয়ে প্রাথমিক কাল্পনিক তথ্য ফিরে আসবে।"
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>থাক</Button>
            <Button
              variant="primary"
              onClick={() => {
                resetDemo()
                setConfirmReset(false)
                toast.success('ডেমো তথ্য পুনঃস্থাপন করা হয়েছে')
                navigate('/')
              }}
            >
              ডেমো রিসেট
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-muted">
          এটি কেবল এই ব্রাউজারে সংরক্ষিত ডেমো তথ্যে প্রভাব ফেলবে।
        </p>
      </Dialog>
    </header>
  )
}
