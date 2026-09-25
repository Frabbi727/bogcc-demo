import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface Props {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children?: ReactNode
}

export function Card({ title, subtitle, actions, className, bodyClassName, children }: Props) {
  return (
    <section className={cn('rounded-md border border-rule/70 bg-white', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-rule/70 px-4 py-2.5">
          <div>
            {title && <h2 className="text-[17px] leading-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('px-4 py-3.5', bodyClassName)}>{children}</div>
    </section>
  )
}
