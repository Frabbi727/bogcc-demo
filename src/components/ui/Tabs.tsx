import { toBnDigits } from '@/lib/bn'
import { cn } from '@/lib/cn'

export interface TabItem {
  key: string
  label: string
  count?: number
}

interface Props {
  items: TabItem[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export function Tabs({ items, active, onChange, className }: Props) {
  return (
    <div role="tablist" className={cn('flex flex-wrap gap-1 border-b border-rule/70', className)}>
      {items.map((item) => {
        const selected = item.key === active
        return (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(item.key)}
            className={cn(
              '-mb-px border-b-2 px-3 py-1.5 text-sm transition-colors',
              selected
                ? 'border-forest-700 font-medium text-forest-700'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[11.5px]',
                  selected ? 'bg-forest-50 text-forest-700' : 'bg-paper text-muted',
                )}
              >
                {toBnDigits(item.count)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
