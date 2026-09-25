import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface Props {
  label: string
  htmlFor?: string
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, required, className, children }: Props) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-stamp">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[12.5px] text-stamp">{error}</p>
      ) : (
        hint && <p className="text-[12.5px] text-muted">{hint}</p>
      )}
    </div>
  )
}
