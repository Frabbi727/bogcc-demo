import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { USERS } from '@/data/seed'
import { useStore } from '@/store/useStore'
import type { Role } from '@/types'

interface Props {
  /** The role that has to act next. */
  role: Role
  /** What that role will do, e.g. `মাঠ যাচাই`. */
  action: string
}

/**
 * Shown when the current role cannot act. One click switches to the role that
 * can, which is how the whole workflow is demonstrated without logging out.
 */
export function RoleHandoff({ role, action }: Props) {
  const switchRole = useStore((s) => s.switchRole)
  const user = USERS[role]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-amber/35 bg-amber/8 px-3 py-2.5">
      <p className="text-[13.5px] text-ink">
        পরবর্তী ধাপ <span className="font-medium">{action}</span> — দায়িত্বপ্রাপ্ত{' '}
        <span className="font-medium">{user.title}</span> ({user.name})
      </p>
      <Button
        onClick={() => {
          switchRole(role)
          toast.success(`${user.title} হিসেবে দেখা হচ্ছে`)
        }}
      >
        {user.title} হিসেবে দেখুন
        <ArrowRight size={14} />
      </Button>
    </div>
  )
}
