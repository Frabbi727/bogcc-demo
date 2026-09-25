import { cn } from '@/lib/cn'

interface Props {
  /** Stamp wording, e.g. অনুমোদিত or বাতিল. */
  label: string
  /** Small line under the label, e.g. the date or the officer's name. */
  sub?: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Rubber stamp, tilted like a hand-pressed one on a register page.
 */
export function Stamp({ label, sub, size = 'md', className }: Props) {
  return (
    <span
      aria-label={label}
      className={cn(
        'inline-flex -rotate-6 flex-col items-center justify-center border-2 border-stamp',
        'font-display text-stamp opacity-85 select-none',
        size === 'sm' ? 'px-2 py-0.5' : 'px-3.5 py-1.5',
        className,
      )}
      style={{ boxShadow: '0 0 0 2px #fffffc, 0 0 0 3.5px currentColor' }}
    >
      <span className={size === 'sm' ? 'text-[12px] leading-tight' : 'text-[17px] leading-tight'}>
        {label}
      </span>
      {sub && <span className="text-[9.5px] leading-tight opacity-80">{sub}</span>}
    </span>
  )
}
