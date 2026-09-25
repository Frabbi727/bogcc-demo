import { Link, type LinkProps } from 'react-router-dom'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

interface Props extends LinkProps {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-forest-700 text-white hover:bg-forest-800 border-forest-700 hover:border-forest-800',
  secondary: 'bg-white text-ink border-rule hover:bg-forest-50 hover:border-forest-700/40',
  ghost: 'bg-transparent text-forest-700 border-transparent hover:bg-forest-50',
}

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-[13px]',
  md: 'px-3.5 py-1.5 text-sm',
}

/** A `Link` that looks like a `Button`, for navigation actions. */
export function LinkButton({ variant = 'secondary', size = 'md', className, ...rest }: Props) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-sm border font-medium transition-colors',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  )
}
