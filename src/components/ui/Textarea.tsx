import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'
import { inputClass } from './Input'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function Textarea({ invalid, className, ...rest }: Props) {
  return (
    <textarea
      rows={rest.rows ?? 3}
      className={cn(inputClass, 'resize-y leading-relaxed', invalid ? 'border-stamp' : 'border-rule', className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}
