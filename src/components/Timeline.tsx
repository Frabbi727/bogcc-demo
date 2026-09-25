import { formatDateTimeBn } from '@/lib/bn'
import { cn } from '@/lib/cn'
import type { AuditEntry } from '@/types'

interface Props {
  entries: AuditEntry[]
  className?: string
}

/** History of a record, read straight from the append-only audit log. */
export function Timeline({ entries, className }: Props) {
  if (entries.length === 0) {
    return <p className={cn('text-[13px] text-muted', className)}>এখনো কোনো কার্যক্রম নেই।</p>
  }

  return (
    <ol className={cn('flex flex-col', className)}>
      {entries.map((e, i) => (
        <li key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center pt-1.5">
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                e.action === 'বাতিল' ? 'bg-stamp' : 'bg-forest-700',
              )}
            />
            {i < entries.length - 1 && <span className="w-px flex-1 bg-rule" />}
          </div>
          <div className={cn('min-w-0', i < entries.length - 1 && 'pb-3.5')}>
            <p className="text-[13.5px] leading-snug">
              <span className={cn('font-medium', e.action === 'বাতিল' && 'text-stamp')}>
                {e.action}
              </span>
              <span className="text-muted"> — {e.userName}</span>
            </p>
            <p className="text-[12px] text-muted">{formatDateTimeBn(e.at)}</p>
            {e.note && <p className="mt-1 text-[13px] leading-relaxed text-ink/85">{e.note}</p>}
            {e.changes && e.changes.length > 0 && (
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {e.changes.map((c) => (
                  <li key={c.field} className="text-[12px] text-muted">
                    {c.field}: <span className="line-through">{c.before}</span> → {' '}
                    <span className="text-ink">{c.after}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
