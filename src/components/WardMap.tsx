import { toBnDigits } from '@/lib/bn'
import { cn } from '@/lib/cn'
import {
  WARD_METRIC_LABEL,
  formatWardMetric,
  wardMetricValue,
  type WardMetric,
  type WardStat,
} from '@/lib/mayor'

/**
 * The 21 wards as a grid of tiles, shaded by whichever metric is chosen.
 *
 * It is deliberately **schematic, not geographic** — the tiles are in ward-number
 * order, not laid out like the city — and the caption under it says so, because a
 * map-shaped thing on a mayor's screen will otherwise be read as the real map.
 */

const COLUMNS = 5
const TILE = 74
const GAP = 8
const ROWS = 5

/** Light end and strong end of each metric's shading. */
const SCALE: Record<WardMetric, { from: [number, number, number]; to: [number, number, number] }> = {
  // Complaints and slow service are problems, so they build towards stamp red.
  complaints: { from: [248, 240, 239], to: [179, 38, 30] },
  days: { from: [250, 243, 231], to: [194, 124, 14] },
  // Money is the one where more is better, so it builds towards the forest green.
  revenue: { from: [238, 246, 242], to: [14, 90, 67] },
}

function shade(metric: WardMetric, intensity: number): string {
  const { from, to } = SCALE[metric]
  const mix = from.map((c, i) => Math.round(c + (to[i] - c) * intensity))
  return `rgb(${mix.join(' ')})`
}

/** White text once a tile is dark enough for dark ink to stop reading. */
function inkFor(intensity: number): string {
  return intensity > 0.55 ? '#FFFFFC' : '#1C2B27'
}

interface Props {
  stats: WardStat[]
  metric: WardMetric
  onSelect?: (ward: number) => void
  /** Ward to outline, e.g. the one being drilled into. */
  selected?: number
  className?: string
  /** Presentation mode drops the per-tile figure and enlarges the ward number. */
  large?: boolean
}

export function WardMap({ stats, metric, onSelect, selected, className, large = false }: Props) {
  const max = Math.max(...stats.map((s) => wardMetricValue(s, metric)), 0)
  const width = COLUMNS * TILE + (COLUMNS - 1) * GAP
  const height = ROWS * TILE + (ROWS - 1) * GAP

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* On a projector the map must fit the slide, so its height is capped and
          the viewBox letterboxes rather than pushing ward 21 off the screen. */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn('w-full', large && 'max-h-[62vh]')}
        role="group"
        aria-label={`ওয়ার্ডভিত্তিক ${WARD_METRIC_LABEL[metric]}`}
      >
        {stats.map((stat, i) => {
          const value = wardMetricValue(stat, metric)
          const intensity = max > 0 ? value / max : 0
          const x = (i % COLUMNS) * (TILE + GAP)
          const y = Math.floor(i / COLUMNS) * (TILE + GAP)
          const isSelected = selected === stat.ward
          const label = `ওয়ার্ড ${toBnDigits(stat.ward)} — ${WARD_METRIC_LABEL[metric]} ${formatWardMetric(value, metric)}`

          return (
            <g
              key={stat.ward}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={label}
              onClick={onSelect ? () => onSelect(stat.ward) : undefined}
              onKeyDown={
                onSelect
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(stat.ward)
                      }
                    }
                  : undefined
              }
              className={cn(onSelect && 'cursor-pointer')}
            >
              <title>{label}</title>
              <rect
                x={x}
                y={y}
                width={TILE}
                height={TILE}
                rx={4}
                fill={shade(metric, intensity)}
                stroke={isSelected ? '#0E5A43' : '#CFDBEA'}
                strokeWidth={isSelected ? 2.5 : 1}
              />
              <text
                x={x + TILE / 2}
                y={y + (large ? TILE / 2 + 8 : TILE / 2 - 4)}
                textAnchor="middle"
                fill={inkFor(intensity)}
                style={{ fontSize: large ? 26 : 16, fontFamily: 'var(--font-display)' }}
              >
                {toBnDigits(stat.ward)}
              </text>
              {!large && (
                <text
                  x={x + TILE / 2}
                  y={y + TILE / 2 + 16}
                  textAnchor="middle"
                  fill={inkFor(intensity)}
                  style={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
                  opacity={0.85}
                >
                  {formatWardMetric(value, metric)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
        <span>ওয়ার্ড ১–২১ · ক্রমিক সাজানো, প্রকৃত মানচিত্র নয় (স্কিমেটিক)</span>
        <span className="flex items-center gap-1.5">
          কম
          <span className="flex">
            {[0, 0.25, 0.5, 0.75, 1].map((step) => (
              <span
                key={step}
                className="size-3.5 border border-rule/70"
                style={{ backgroundColor: shade(metric, step) }}
              />
            ))}
          </span>
          বেশি
        </span>
      </div>
    </div>
  )
}
