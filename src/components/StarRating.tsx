import { Star } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/cn'
import { toBnDigits } from '@/lib/bn'

export type Rating = 1 | 2 | 3 | 4 | 5

const RATINGS: Rating[] = [1, 2, 3, 4, 5]

interface Props {
  value?: Rating
  /** Omit to render a read-only rating. */
  onChange?: (value: Rating) => void
  className?: string
}

/**
 * One to five stars. Read-only once a citizen has rated: a delivered service is a
 * matter of record, so the score is not something the demo lets anyone rewrite.
 */
export function StarRating({ value, onChange, className }: Props) {
  const [hover, setHover] = useState<Rating | undefined>()
  const shown = hover ?? value ?? 0

  if (!onChange) {
    return (
      <span className={cn('inline-flex items-center gap-1', className)}>
        {RATINGS.map((r) => (
          <Star
            key={r}
            size={16}
            className={r <= shown ? 'fill-amber text-amber' : 'text-rule'}
          />
        ))}
        <span className="ml-1 text-[12.5px] text-muted">{toBnDigits(shown)} / ৫</span>
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} onMouseLeave={() => setHover(undefined)}>
      {RATINGS.map((r) => (
        <button
          key={r}
          type="button"
          aria-label={`${toBnDigits(r)} তারা`}
          onMouseEnter={() => setHover(r)}
          onFocus={() => setHover(r)}
          onClick={() => onChange(r)}
          className="rounded-sm p-1 transition-transform hover:scale-110"
        >
          <Star size={22} className={r <= shown ? 'fill-amber text-amber' : 'text-rule'} />
        </button>
      ))}
    </span>
  )
}
