import { FileText, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { LinkButton } from '@/components/ui/LinkButton'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { businessTypeOf } from '@/data/seed'
import { formatDateBn, formatTaka, toBnDigits } from '@/lib/bn'
import { LICENCE_STATUS_LABEL, LICENCE_STATUS_ORDER, LICENCE_STATUS_TONE } from '@/lib/status'
import { useStore } from '@/store/useStore'
import type { LicenceStatus } from '@/types'

export function LicenceList() {
  const licences = useStore((s) => s.licences)
  const role = useStore((s) => s.session?.role)
  const [tab, setTab] = useState<string>('all')
  const [query, setQuery] = useState('')

  const tabs: TabItem[] = useMemo(
    () => [
      { key: 'all', label: 'সব', count: licences.length },
      ...LICENCE_STATUS_ORDER.map((status) => ({
        key: status,
        label: LICENCE_STATUS_LABEL[status],
        count: licences.filter((l) => l.status === status).length,
      })),
    ],
    [licences],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return licences
      .filter((l) => tab === 'all' || l.status === tab)
      .filter((l) => {
        if (!q) return true
        return [
          l.business.nameBn,
          l.business.nameEn,
          l.owner.name,
          l.owner.nid,
          l.owner.mobile,
          l.appNo,
          l.licenceNo ?? '',
          l.business.holdingNo,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [licences, tab, query])

  return (
    <>
      <PageHeader
        title="ট্রেড লাইসেন্স"
        subtitle="আবেদন জমা থেকে ফি আদায় ও ইস্যু পর্যন্ত প্রতিটি ধাপ এখানে দেখা যায়।"
        actions={
          role === 'operator' && (
            <LinkButton to="/trade-licence/new" variant="primary">
              <Plus size={14} />
              নতুন আবেদন
            </LinkButton>
          )
        }
      />

      <Card
        bodyClassName="p-0"
        actions={
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="প্রতিষ্ঠান, মালিক, এনআইডি, লাইসেন্স নং…"
            className="w-64"
            aria-label="তালিকায় অনুসন্ধান"
          />
        }
        title="আবেদন ও লাইসেন্সের তালিকা"
      >
        <Tabs items={tabs} active={tab} onChange={setTab} className="px-3" />

        {rows.length === 0 ? (
          <EmptyState
            title="কোনো রেকর্ড পাওয়া যায়নি"
            hint="অন্য অবস্থা বেছে নিন বা অনুসন্ধানের শব্দ পরিবর্তন করুন।"
            icon={<FileText size={26} strokeWidth={1.5} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] text-[13.5px]">
              <thead className="border-b border-rule/70 text-left text-[12.5px] text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">আবেদন / লাইসেন্স নং</th>
                  <th scope="col" className="px-3 py-2 font-medium">প্রতিষ্ঠান</th>
                  <th scope="col" className="px-3 py-2 font-medium">মালিক</th>
                  <th scope="col" className="px-3 py-2 font-medium">ব্যবসার ধরন</th>
                  <th scope="col" className="px-3 py-2 font-medium">ওয়ার্ড</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">ফি</th>
                  <th scope="col" className="px-3 py-2 font-medium">তারিখ</th>
                  <th scope="col" className="px-3 py-2 font-medium">অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="border-b border-rule/50 last:border-0 hover:bg-forest-50/40">
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <Link to={`/trade-licence/${l.id}`} className="font-medium text-forest-700 hover:underline">
                        {toBnDigits(l.licenceNo ?? l.appNo)}
                      </Link>
                      {l.licenceNo && (
                        <span className="block text-[12px] text-muted">{toBnDigits(l.appNo)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className={l.status === 'cancelled' ? 'line-through' : undefined}>
                        {l.business.nameBn}
                      </span>
                      <span className="block text-[12px] text-muted">{l.business.area}</span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {l.owner.name}
                      <span className="block text-[12px] text-muted">{toBnDigits(l.owner.mobile)}</span>
                    </td>
                    <td className="px-3 py-2 align-top">{businessTypeOf(l.business.typeKey).label}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">{toBnDigits(l.business.ward)}</td>
                    <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                      {formatTaka(l.feeTotal)}
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">{formatDateBn(l.createdAt)}</td>
                    <td className="px-3 py-2 align-top">
                      <StatusBadge
                        label={LICENCE_STATUS_LABEL[l.status as LicenceStatus]}
                        tone={LICENCE_STATUS_TONE[l.status as LicenceStatus]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
