import { ArrowLeft, Phone } from 'lucide-react'
import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { KpiCard } from '@/components/KpiCard'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Timeline } from '@/components/Timeline'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { WARD_COUNT, wardInfo } from '@/data/wards'
import { formatDecimalBn, formatTaka, timeAgoBn, toBnDigits } from '@/lib/bn'
import { currentFiscalYear } from '@/lib/fiscal'
import { isOpen } from '@/lib/records'
import {
  citizenVoice,
  overdueItems,
  recordPath,
  recordTitle,
  serviceNameOf,
  wardStats,
  type Kpi,
  type ServiceRecord,
} from '@/lib/mayor'
import { slaStatus } from '@/lib/sla'
import { useStore } from '@/store/useStore'

/** Drill-down for one ward, reached by clicking a tile on the ward map. */
export function WardDrill() {
  const { n } = useParams()
  const ward = Number(n)

  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)
  const receipts = useStore((s) => s.receipts)
  const holdings = useStore((s) => s.holdings)
  const audit = useStore((s) => s.audit)

  const fy = currentFiscalYear()
  const valid = Number.isInteger(ward) && ward >= 1 && ward <= WARD_COUNT

  const records = useMemo<ServiceRecord[]>(
    () => (valid ? [...licences, ...entries].filter((r) => r.ward === ward) : []),
    [licences, entries, ward, valid],
  )

  const stat = useMemo(() => {
    if (!valid) return undefined
    return wardStats([...licences, ...entries], receipts, holdings, fy).find(
      (s) => s.ward === ward,
    )
  }, [licences, entries, receipts, holdings, fy, ward, valid])

  const open = useMemo(
    () =>
      records
        .filter(isOpen)
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [records],
  )
  const overdue = useMemo(() => overdueItems(records), [records])
  const voice = useMemo(() => citizenVoice(records, 4), [records])

  /** The ward's own slice of the activity log. */
  const activity = useMemo(() => {
    const ids = new Set(records.map((r) => r.id))
    return audit
      .filter((e) => ids.has(e.recordId))
      .slice(-8)
      .reverse()
  }, [audit, records])

  if (!valid || !stat) return <Navigate to="/office/mayor" replace />

  const info = wardInfo(ward)
  const kpis: Kpi[] = [
    { key: 'received', label: 'মোট আবেদন ও অভিযোগ', value: toBnDigits(stat.received) },
    { key: 'open', label: 'চলমান কাজ', value: toBnDigits(open.length), goodWhenDown: true },
    {
      key: 'overdue',
      label: 'মেয়াদোত্তীর্ণ',
      value: toBnDigits(overdue.length),
      hint: 'চার্টারের সময় পেরিয়েছে',
      goodWhenDown: true,
    },
    { key: 'ontime', label: 'সময়মতো সেবা', value: `${toBnDigits(stat.onTime)}%` },
    {
      key: 'days',
      label: 'গড় নিষ্পত্তির সময়',
      value: stat.days ? `${formatDecimalBn(stat.days)} দিন` : '—',
      goodWhenDown: true,
    },
    {
      key: 'revenue',
      label: 'আদায় (অর্থবছর)',
      value: formatTaka(stat.revenue),
      hint: toBnDigits(fy),
    },
  ]

  return (
    <>
      <PageHeader
        title={`ওয়ার্ড ${toBnDigits(ward)}`}
        subtitle={
          info ? (
            <>
              কাউন্সিলর {info.councillor} · {info.officeHours} ·{' '}
              <span className="inline-flex items-center gap-1">
                <Phone size={13} aria-hidden />
                {toBnDigits(info.mobile)}
              </span>
            </>
          ) : undefined
        }
        actions={
          <Link
            to="/office/mayor"
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 text-sm hover:bg-forest-50"
          >
            <ArrowLeft size={15} aria-hidden />
            মেয়র ড্যাশবোর্ড
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="চলমান কাজ"
          subtitle="এই ওয়ার্ডে যা এখনো নিষ্পন্ন হয়নি"
          bodyClassName="p-0"
        >
          {open.length === 0 ? (
            <EmptyState title="এই ওয়ার্ডে কোনো কাজ বাকি নেই" />
          ) : (
            <ul className="max-h-[26rem] divide-y divide-rule/50 overflow-y-auto">
              {open.map((record) => {
                const sla = slaStatus(record)
                return (
                  <li key={record.id}>
                    <Link
                      to={recordPath(record)}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-forest-50/50"
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium">
                          {recordTitle(record)}
                        </span>
                        <span className="block text-[12.5px] text-muted">
                          {serviceNameOf(record)} · {toBnDigits(record.trackingNo)}
                        </span>
                      </span>
                      <StatusBadge
                        label={
                          sla === 'overdue'
                            ? 'মেয়াদোত্তীর্ণ'
                            : sla === 'due-soon'
                              ? 'সময় ফুরোচ্ছে'
                              : 'সময়মতো'
                        }
                        tone={sla === 'overdue' ? 'danger' : sla === 'due-soon' ? 'pending' : 'info'}
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="নাগরিকের মতামত" subtitle="এই ওয়ার্ডের সর্বশেষ রেটিং" bodyClassName="p-0">
            {voice.length === 0 ? (
              <EmptyState title="এই ওয়ার্ড থেকে এখনো কোনো রেটিং আসেনি" />
            ) : (
              <ul className="divide-y divide-rule/50">
                {voice.map((item) => (
                  <li key={item.id} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={item.to} className="min-w-0 hover:underline">
                        <span className="block text-[14px] font-medium">{item.title}</span>
                        <span className="block text-[12.5px] text-muted">
                          {item.serviceName} · {timeAgoBn(item.at)}
                        </span>
                      </Link>
                      <span
                        className="shrink-0 text-[13px] text-amber"
                        aria-label={`${toBnDigits(item.rating)} তারকা`}
                      >
                        {'★'.repeat(item.rating)}
                        <span className="text-rule">{'★'.repeat(5 - item.rating)}</span>
                      </span>
                    </div>
                    {item.comment && (
                      <p className="mt-1 text-[13px] leading-relaxed text-ink/85">
                        “{item.comment}”
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="সাম্প্রতিক কার্যক্রম" subtitle="এই ওয়ার্ডের রেকর্ডে">
            <Timeline entries={activity} />
          </Card>
        </div>
      </div>
    </>
  )
}
