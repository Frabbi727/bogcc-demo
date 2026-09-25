import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
}

export function PageHeader({ title, subtitle, actions, badge }: Props) {
  return (
    <div className="no-print mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[23px] leading-tight">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1 max-w-2xl text-[13.5px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
