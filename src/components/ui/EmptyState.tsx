import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  hint?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, hint, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="text-muted/70">{icon ?? <Inbox size={26} strokeWidth={1.5} />}</span>
      <p className="text-[15px] text-ink">{title}</p>
      {hint && <p className="max-w-sm text-[13px] text-muted">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
