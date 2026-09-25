import type { SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'
import { inputClass } from './Input'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export function Select({ invalid, className, ...rest }: Props) {
  return (
    <select
      className={cn(inputClass, 'appearance-none pr-7', invalid ? 'border-stamp' : 'border-rule', className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}
