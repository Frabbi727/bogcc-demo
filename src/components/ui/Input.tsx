import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const inputClass =
  'w-full rounded-sm border bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-muted/70 ' +
  'focus:border-forest-700 focus:outline-none disabled:bg-paper disabled:text-muted'

export function Input({ invalid, className, ...rest }: Props) {
  return (
    <input
      className={cn(inputClass, invalid ? 'border-stamp' : 'border-rule', className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}
