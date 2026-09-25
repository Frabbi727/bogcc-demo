import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { toBnDigits } from '@/lib/bn'
import { cn } from '@/lib/cn'
import type { Kpi } from '@/lib/mayor'

/**
 * One figure on the Mayor dashboard, with its change against last month.
 *
 * The arrow shows the direction the number moved; the colour says whether that
 * is good news, which is not the same thing — fewer unresolved complaints is an
 * improvement even though the number fell.
 */
export function KpiCard({ kpi, large = false }: { kpi: Kpi; large?: boolean }) {
  const { delta, goodWhenDown } = kpi
  const change = delta ?? 0
  const flat = change === 0
  const improving = goodWhenDown ? change < 0 : change > 0
  const Arrow = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight

  return (
    <div
      className={cn(
        'rounded-md border border-rule/70 bg-white',
        large ? 'px-6 py-5' : 'px-4 py-3',
      )}
    >
      <p className={cn('leading-snug text-muted', large ? 'text-[17px]' : 'text-[12.5px]')}>
        {kpi.label}
      </p>
      <p
        className={cn(
          'mt-1 font-display leading-tight',
          large ? 'text-[46px]' : 'text-[25px]',
        )}
      >
        {kpi.value}
      </p>
      <div
        className={cn(
          'mt-0.5 flex flex-wrap items-center gap-x-2',
          large ? 'text-[15px]' : 'text-[12px]',
        )}
      >
        {delta !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5',
              flat ? 'text-muted' : improving ? 'text-forest-700' : 'text-stamp',
            )}
          >
            <Arrow size={large ? 18 : 14} strokeWidth={2} aria-hidden />
            {toBnDigits(Math.abs(change))}%
          </span>
        )}
        {kpi.hint && <span className="text-muted">{kpi.hint}</span>}
      </div>
    </div>
  )
}
