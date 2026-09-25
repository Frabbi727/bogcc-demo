import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/cn'

export interface LedgerColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface LedgerRow {
  id: string
  cells: ReactNode[]
  /** Cancelled lines stay in the book, struck through. */
  cancelled?: boolean
  /** Makes the whole row open a detail page. */
  to?: string
}

interface Props {
  title: string
  section: string
  fiscalYear: string
  /** e.g. `সকল ওয়ার্ড` or `ওয়ার্ড ৫`. */
  wardLabel?: string
  description?: string
  columns: LedgerColumn[]
  rows: LedgerRow[]
  /** Footer cells, aligned to the same columns. */
  footer?: ReactNode[]
  emptyLabel?: string
  /** Minimum table width, so wide books scroll instead of squeezing. */
  minWidth?: string
}

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

/**
 * The register book page: a ruled ledger with a red margin line down the left,
 * used by the trade licence register and every config-driven register.
 */
export function LedgerTable({
  title,
  section,
  fiscalYear,
  wardLabel,
  description,
  columns,
  rows,
  footer,
  emptyLabel = 'এই বাছাইয়ে কোনো এন্ট্রি নেই।',
  minWidth = '58rem',
}: Props) {
  return (
    <div className="print-sheet overflow-hidden rounded-sm border border-rule bg-page shadow-sm">
      {/* Book header block, the way the top of a paper register page reads. */}
      <div className="border-b-2 border-double border-ink/25 px-4 py-3 text-center">
        <p className="font-display text-[15px] text-muted">বগুড়া সিটি কর্পোরেশন</p>
        <h2 className="font-display text-[21px] leading-snug">{title}</h2>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-0.5 font-display text-[13.5px] text-muted">
          <span>শাখা: {section}</span>
          <span>অর্থবছর: {fiscalYear}</span>
          {wardLabel && <span>{wardLabel}</span>}
        </div>
        {description && <p className="mt-1 text-[12.5px] text-muted">{description}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-ink/20 bg-forest-50/60 align-bottom">
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'px-2 py-2 font-display font-normal whitespace-nowrap',
                    ALIGN[c.align ?? 'left'],
                    i === 0 && 'border-r-2 border-margin',
                    c.className,
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-rule align-top',
                  row.cancelled ? 'text-stamp/85 line-through' : 'hover:bg-forest-50/40',
                )}
              >
                {row.cells.map((cell, i) => (
                  <td
                    key={columns[i]?.key ?? i}
                    className={cn(
                      'min-h-9 px-2 py-2 leading-snug',
                      ALIGN[columns[i]?.align ?? 'left'],
                      i === 0 && 'border-r-2 border-margin font-medium',
                      columns[i]?.className,
                    )}
                  >
                    {i === 0 && row.to ? (
                      <Link to={row.to} className="text-forest-700 hover:underline">
                        {cell}
                      </Link>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-ink/25 bg-forest-50/60 font-medium">
                {footer.map((cell, i) => (
                  <td
                    key={columns[i]?.key ?? i}
                    className={cn(
                      'px-2 py-2',
                      ALIGN[columns[i]?.align ?? 'left'],
                      i === 0 && 'border-r-2 border-margin',
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
