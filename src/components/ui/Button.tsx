import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-forest-700 text-white hover:bg-forest-800 border-forest-700 hover:border-forest-800',
  secondary: 'bg-white text-ink border-rule hover:bg-forest-50 hover:border-forest-700/40',
  ghost: 'bg-transparent text-forest-700 border-transparent hover:bg-forest-50',
  danger: 'bg-white text-stamp border-stamp/40 hover:bg-stamp/5 hover:border-stamp',
}

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-[13px]',
  md: 'px-3.5 py-1.5 text-sm',
}

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: Props) {
  return (
    <button
      type={rest.type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-sm border font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  )
}
