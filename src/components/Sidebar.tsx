import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { navFor } from '@/data/nav'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/cn'

interface Props {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: Props) {
  const role = useStore((s) => s.session?.role)
  const groups = navFor(role)

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="মেনু বন্ধ করুন"
          onClick={onClose}
          className="no-print fixed inset-0 z-30 cursor-default bg-ink/35 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'no-print fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-forest-700 text-white',
          'transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-start justify-between gap-2 border-b border-white/12 px-4 py-3">
          <div>
            <p className="font-display text-[17px] leading-snug">বগুড়া সিটি কর্পোরেশন</p>
            <p className="mt-0.5 text-[12.5px] text-white/70">ডিজিটাল রেজিস্টার ব্যবস্থা</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="মেনু বন্ধ করুন"
            className="rounded-sm p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-2 pb-1 text-[11.5px] font-medium tracking-wide text-white/55">
                {group.label}
              </p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/office'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-[13.5px]',
                          'transition-colors',
                          isActive
                            ? 'bg-forest-800 font-medium text-white'
                            : 'text-white/85 hover:bg-white/10 hover:text-white',
                        )
                      }
                    >
                      <span>{item.label}</span>
                      {item.phase2 && (
                        <span className="shrink-0 rounded-sm bg-white/15 px-1.5 py-px text-[10.5px] text-white/80">
                          ২য় ধাপ
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <p className="border-t border-white/12 px-4 py-2.5 text-[11.5px] leading-relaxed text-white/55">
          কাগজের রেজিস্টার খাতার বিকল্প হিসেবে তৈরি ডেমো। কোনো তথ্য সার্ভারে সংরক্ষিত হয় না।
        </p>
      </aside>
    </>
  )
}
