import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface DataItem {
  label: string
  value: ReactNode
  /** Spans the full width of the grid. */
  wide?: boolean
}

interface Props {
  items: DataItem[]
  className?: string
  columns?: 1 | 2 | 3
}

/** Label/value pairs, the way a register page lists a record's particulars. */
export function DataList({ items, className, columns = 2 }: Props) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-2.5',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn(item.wide && 'sm:col-span-full')}>
          <dt className="text-[12.5px] text-muted">{item.label}</dt>
          <dd className="text-[14px] leading-snug">{item.value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
