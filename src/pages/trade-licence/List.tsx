import { Download, FileText, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { LinkButton } from '@/components/ui/LinkButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { businessTypeOf } from '@/data/seed'
import { formatDateBn, formatTaka, toBnDigits } from '@/lib/bn'
import { downloadCsv } from '@/lib/csv'
import {
  expiryOf,
  matchesLicence,
  normalizeTerm,
  RENEWAL_LABEL,
  RENEWAL_TONE,
  renewalFor,
  renewalState,
  type RenewalState,
} from '@/lib/licence'
import { LICENCE_STATUS_LABEL, LICENCE_STATUS_ORDER, LICENCE_STATUS_TONE } from '@/lib/status'
import { useStore } from '@/store/useStore'
import type { Licence, LicenceStatus } from '@/types'

/** The validity filter, which cuts across the workflow status tabs. */
const VALIDITY_OPTIONS: { key: string; label: string; states?: RenewalState[] }[] = [
  { key: 'all', label: 'সব মেয়াদ' },
  { key: 'active', label: 'মেয়াদ চলমান', states: ['active'] },
  { key: 'due', label: 'নবায়নের সময় হয়েছে', states: ['due-soon'] },
  { key: 'expired', label: 'মেয়াদোত্তীর্ণ', states: ['expired'] },
  { key: 'renewable', label: 'নবায়নযোগ্য', states: ['due-soon', 'expired'] },
  { key: 'renewed', label: 'নবায়িত', states: ['renewed'] },
]

export function LicenceList() {
  const licences = useStore((s) => s.licences)
  const role = useStore((s) => s.session?.role)
  const [tab, setTab] = useState<string>('all')
  const [validity, setValidity] = useState('all')
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
    const q = normalizeTerm(query)
    const wanted = VALIDITY_OPTIONS.find((o) => o.key === validity)?.states
    return licences
      .filter((l) => tab === 'all' || l.status === tab)
      .filter((l) => !wanted || wanted.includes(renewalState(licences, l)))
      .filter((l) => matchesLicence(l, q))
  }, [licences, tab, validity, query])

  /** Officers open this in Excel, so the CSV carries plain values, not Bangla digits. */
  function exportCsv() {
    downloadCsv('trade-licence', rows, [
      { header: 'আবেদন নং', value: (l: Licence) => l.appNo },
      { header: 'লাইসেন্স নং', value: (l: Licence) => l.registerNo ?? '' },
      { header: 'ক্রমিক নং', value: (l: Licence) => l.serial ?? '' },
      { header: 'ধরন', value: (l: Licence) => (l.kind === 'renewal' ? 'নবায়ন' : 'নতুন') },
      { header: 'প্রতিষ্ঠান (বাংলা)', value: (l: Licence) => l.business.nameBn },
      { header: 'প্রতিষ্ঠান (ইংরেজি)', value: (l: Licence) => l.business.nameEn },
      { header: 'ব্যবসার ধরন', value: (l: Licence) => businessTypeOf(l.business.typeKey).label },
      { header: 'ঠিকানা', value: (l: Licence) => l.business.address },
      { header: 'ওয়ার্ড', value: (l: Licence) => l.business.ward },
      { header: 'মালিক', value: (l: Licence) => l.owner.name },
      { header: 'পিতার নাম', value: (l: Licence) => l.owner.fatherName },
      { header: 'এনআইডি', value: (l: Licence) => l.owner.nid },
      { header: 'মোবাইল', value: (l: Licence) => l.owner.mobile },
      { header: 'মোট ফি', value: (l: Licence) => l.feeTotal },
      { header: 'অবস্থা', value: (l: Licence) => LICENCE_STATUS_LABEL[l.status] },
      { header: 'মেয়াদ', value: (l: Licence) => RENEWAL_LABEL[renewalState(licences, l)] },
      { header: 'মেয়াদ শেষ', value: (l: Licence) => expiryOf(l).slice(0, 10) },
      { header: 'অর্থবছর', value: (l: Licence) => l.fiscalYear },
      { header: 'আবেদনের তারিখ', value: (l: Licence) => l.createdAt.slice(0, 10) },
      { header: 'মাধ্যম', value: (l: Licence) => (l.channel === 'online' ? 'অনলাইন' : 'কাউন্টার') },
      { header: 'ট্র্যাকিং নং', value: (l: Licence) => l.trackingNo },
      { header: 'বাতিলের কারণ', value: (l: Licence) => l.cancelled?.reason ?? '' },
    ])
  }

  return (
    <>
      <PageHeader
        title="ট্রেড লাইসেন্স"
        subtitle="আবেদন জমা থেকে ফি আদায় ও ইস্যু পর্যন্ত প্রতিটি ধাপ এখানে দেখা যায়।"
        actions={
          role === 'operator' && (
            <>
              <LinkButton to="/office/trade-licence/renew">
                <RefreshCw size={14} />
                নবায়ন
              </LinkButton>
              <LinkButton to="/office/trade-licence/new" variant="primary">
                <Plus size={14} />
                নতুন আবেদন
              </LinkButton>
            </>
          )
        }
      />

      <Card
        bodyClassName="p-0"
        actions={
          <>
            <label className="sr-only" htmlFor="validity">
              মেয়াদ
            </label>
            <Select
              id="validity"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              className="w-44"
            >
              {VALIDITY_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="প্রতিষ্ঠান, মালিক, এনআইডি, লাইসেন্স নং…"
              className="w-64"
              aria-label="তালিকায় অনুসন্ধান"
            />
            <Button onClick={exportCsv} disabled={rows.length === 0}>
              <Download size={14} />
              CSV
            </Button>
          </>
        }
        title="আবেদন ও লাইসেন্সের তালিকা"
      >
        <Tabs items={tabs} active={tab} onChange={setTab} className="px-3" />

        {rows.length === 0 ? (
          <EmptyState
            title="কোনো রেকর্ড পাওয়া যায়নি"
            hint="অন্য অবস্থা বা মেয়াদ বেছে নিন, অথবা অনুসন্ধানের শব্দ পরিবর্তন করুন।"
            icon={<FileText size={26} strokeWidth={1.5} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] text-[13.5px]">
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
                  <th scope="col" className="px-3 py-2 font-medium">মেয়াদ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const state = renewalState(licences, l)
                  const renewal = renewalFor(licences, l)
                  return (
                    <tr key={l.id} className="border-b border-rule/50 last:border-0 hover:bg-forest-50/40">
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <Link to={`/office/trade-licence/${l.id}`} className="font-medium text-forest-700 hover:underline">
                          {toBnDigits(l.registerNo ?? l.appNo)}
                        </Link>
                        {l.registerNo && (
                          <span className="block text-[12px] text-muted">{toBnDigits(l.appNo)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className={l.status === 'cancelled' ? 'line-through' : undefined}>
                          {l.business.nameBn}
                        </span>
                        <span className="block text-[12px] text-muted">
                          {l.business.area}
                          {l.kind === 'renewal' && ' · নবায়ন'}
                        </span>
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
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <StatusBadge label={RENEWAL_LABEL[state]} tone={RENEWAL_TONE[state]} />
                        {l.status === 'issued' && (
                          <span className="mt-0.5 block text-[12px] text-muted">
                            {renewal ? (
                              <Link
                                to={`/office/trade-licence/${renewal.id}`}
                                className="text-forest-700 hover:underline"
                              >
                                নবায়ন {toBnDigits(renewal.registerNo ?? renewal.appNo)}
                              </Link>
                            ) : (
                              formatDateBn(expiryOf(l))
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
