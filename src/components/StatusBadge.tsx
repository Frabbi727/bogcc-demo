import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/status'

const TONES: Record<Tone, string> = {
  neutral: 'bg-paper text-muted border-rule',
  info: 'bg-forest-50 text-forest-700 border-forest-700/25',
  pending: 'bg-amber/10 text-amber border-amber/30',
  success: 'bg-forest-700/10 text-forest-800 border-forest-700/30',
  danger: 'bg-stamp/8 text-stamp border-stamp/30',
}

interface Props {
  label: string
  tone?: Tone
  className?: string
}

export function StatusBadge({ label, tone = 'neutral', className }: Props) {
  return (
    <span
      className={cn(
        'inline-block rounded-sm border px-1.5 py-0.5 text-[12px] leading-tight whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}
