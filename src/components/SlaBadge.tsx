import { StatusBadge } from '@/components/StatusBadge'
import { formatDateBn, toBnDigits } from '@/lib/bn'
import { SLA_LABEL, daysOverdue, slaStatus, type SlaSubject } from '@/lib/sla'
import type { Tone } from '@/lib/status'

const TONE: Record<ReturnType<typeof slaStatus>, Tone> = {
  'on-time': 'success',
  'due-soon': 'pending',
  overdue: 'danger',
}

interface Props {
  record: SlaSubject
  /** Adds the charter deadline after the badge. */
  showDue?: boolean
  className?: string
}

/**
 * Whether a record is still inside its citizen-charter time. A cancelled record
 * shows nothing: nobody is waiting on it.
 */
export function SlaBadge({ record, showDue, className }: Props) {
  if (record.cancelled) return null
  const status = slaStatus(record)
  const late = daysOverdue(record)

  return (
    <span className={className}>
      <StatusBadge
        label={
          status === 'overdue' && late > 0
            ? `${SLA_LABEL.overdue} (${toBnDigits(late)} দিন)`
            : SLA_LABEL[status]
        }
        tone={TONE[status]}
      />
      {showDue && (
        <span className="ml-2 text-[12.5px] text-muted">
          সময়সীমা {formatDateBn(record.dueAt)}
        </span>
      )}
    </span>
  )
}
