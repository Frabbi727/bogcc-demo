import { FileStack, Presentation } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { KpiCard } from '@/components/KpiCard'
import { PageHeader } from '@/components/PageHeader'
import { Timeline } from '@/components/Timeline'
import { WardMap } from '@/components/WardMap'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { USERS } from '@/data/users'
import { formatDecimalBn, formatTaka, timeAgoBn, toBnDigits } from '@/lib/bn'
import { currentFiscalYear } from '@/lib/fiscal'
import {
  REVENUE_HEADS,
  REVENUE_HEAD_LABEL,
  WARD_METRIC_LABEL,
  channelByMonth,
  citizenVoice,
  complaintFlow,
  lastMonths,
  mayorKpis,
  overdueItems,
  paperSaved,
  processingVsCharter,
  revenueByMonth,
  sectionPerformance,
  wardStats,
  type ServiceRecord,
  type WardMetric,
} from '@/lib/mayor'
import { useStore } from '@/store/useStore'

const AXIS = { fontSize: 11, fill: '#5E6E69' }
const TOOLTIP = { fontSize: 12, fontFamily: 'var(--font-sans)' }
const HEAD_COLOR: Record<string, string> = {
  'trade-licence': '#0E5A43',
  'holding-tax': '#1D6FA3',
  certificate: '#C27C0E',
  other: '#5E6E69',
}

/** Compact taka for chart axes, where full grouping would not fit: ৯০হা, ১.৮ল. */
function takaAxis(v: number): string {
  if (v >= 100000) return `${formatDecimalBn(v / 100000)}ল`
  if (v >= 1000) return `${toBnDigits(Math.round(v / 1000))}হা`
  return toBnDigits(v)
}

export function Mayor() {
  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)
  const receipts = useStore((s) => s.receipts)
  const holdings = useStore((s) => s.holdings)
  const audit = useStore((s) => s.audit)
  const role = useStore((s) => s.session?.role)

  const navigate = useNavigate()
  const [metric, setMetric] = useState<WardMetric>('complaints')
  const fy = currentFiscalYear()

  const records = useMemo<ServiceRecord[]>(() => [...licences, ...entries], [licences, entries])
  const months = useMemo(() => lastMonths(12), [])

  const kpis = useMemo(() => mayorKpis(records, receipts, fy), [records, receipts, fy])
  const wards = useMemo(
    () => wardStats(records, receipts, holdings, fy),
    [records, receipts, holdings, fy],
  )
  const revenue = useMemo(() => revenueByMonth(receipts, months), [receipts, months])
  const channels = useMemo(() => channelByMonth(records, months), [records, months])
  const complaints = useMemo(() => complaintFlow(records, months), [records, months])
  const processing = useMemo(() => processingVsCharter(records), [records])
  const overdue = useMemo(() => overdueItems(records), [records])
  const sections = useMemo(() => sectionPerformance(records), [records])
  const voice = useMemo(() => citizenVoice(records), [records])
  const paper = useMemo(() => paperSaved(records, receipts), [records, receipts])

  const feed = audit.slice(-10).reverse()

  return (
    <>
      <PageHeader
        title="মেয়র ড্যাশবোর্ড"
        subtitle={`পুরো সিটি কর্পোরেশনের চলমান চিত্র · অর্থবছর ${toBnDigits(fy)}`}
        actions={
          <Link
            to="/office/mayor/present"
            className="inline-flex items-center gap-1.5 rounded-sm border border-forest-700 bg-forest-700 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-forest-800"
          >
            <Presentation size={16} aria-hidden />
            উপস্থাপনা মোড
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card
          title="ওয়ার্ড মানচিত্র"
          subtitle="টাইলে ক্লিক করলে সেই ওয়ার্ডের বিস্তারিত"
          actions={
            <Tabs
              items={(['complaints', 'revenue', 'days'] as WardMetric[]).map((key) => ({
                key,
                label: WARD_METRIC_LABEL[key],
              }))}
              active={metric}
              onChange={(key) => setMetric(key as WardMetric)}
              className="border-b-0"
            />
          }
        >
          <WardMap
            stats={wards}
            metric={metric}
            onSelect={(ward) => navigate(`/office/mayor/ward/${ward}`)}
          />
        </Card>

        <Card
          title="মেয়াদোত্তীর্ণ কাজ"
          subtitle={`চার্টারের সময় পেরিয়েছে এমন ${toBnDigits(overdue.length)}টি ফাইল`}
          bodyClassName="p-0"
        >
          {overdue.length === 0 ? (
            <EmptyState
              title="চার্টারের সময় পেরিয়েছে এমন কোনো কাজ নেই"
              hint="সব শাখা এখন প্রতিশ্রুত সময়ের মধ্যে আছে।"
            />
          ) : (
            <ul className="max-h-[22rem] divide-y divide-rule/50 overflow-y-auto">
              {overdue.slice(0, 12).map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-forest-50/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium">{item.title}</span>
                      <span className="block text-[12.5px] text-muted">
                        {item.serviceName} · {item.section} · ওয়ার্ড {toBnDigits(item.ward)} ·{' '}
                        {item.deskRole ? USERS[item.deskRole].title : 'অপেক্ষমাণ'}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-sm border border-stamp/30 bg-stamp/8 px-1.5 py-0.5 text-[12px] whitespace-nowrap text-stamp">
                      {toBnDigits(item.days)} দিন দেরি
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <Card title="মাসভিত্তিক রাজস্ব" subtitle="খাত অনুযায়ী, গত ১২ মাস">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <CartesianGrid stroke="#CFDBEA" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} interval={0} stroke="#CFDBEA" />
                <YAxis tick={AXIS} tickFormatter={(v) => takaAxis(v as number)} stroke="#CFDBEA" />
                <Tooltip
                  formatter={(v, name) => [formatTaka(v as number), String(name)]}
                  contentStyle={TOOLTIP}
                />
                <Legend wrapperStyle={TOOLTIP} />
                {REVENUE_HEADS.map((head) => (
                  <Bar
                    key={head}
                    dataKey={head}
                    name={REVENUE_HEAD_LABEL[head]}
                    stackId="revenue"
                    fill={HEAD_COLOR[head]}
                    maxBarSize={26}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="আবেদন কোথা থেকে এলো" subtitle="অফিস কাউন্টার বনাম অনলাইন">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channels} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid stroke="#CFDBEA" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} interval={0} stroke="#CFDBEA" />
                <YAxis
                  tick={AXIS}
                  tickFormatter={(v) => toBnDigits(v as number)}
                  allowDecimals={false}
                  stroke="#CFDBEA"
                />
                <Tooltip
                  formatter={(v, name) => [toBnDigits(v as number), String(name)]}
                  contentStyle={TOOLTIP}
                />
                <Legend wrapperStyle={TOOLTIP} />
                <Bar dataKey="office" name="অফিস" stackId="ch" fill="#0E5A43" maxBarSize={26} />
                <Bar dataKey="online" name="অনলাইন" stackId="ch" fill="#1D6FA3" maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="অভিযোগ: প্রাপ্তি বনাম নিষ্পত্তি" subtitle="গত ১২ মাস">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complaints} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid stroke="#CFDBEA" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} interval={0} stroke="#CFDBEA" />
                <YAxis
                  tick={AXIS}
                  tickFormatter={(v) => toBnDigits(v as number)}
                  allowDecimals={false}
                  stroke="#CFDBEA"
                />
                <Tooltip
                  formatter={(v, name) => [toBnDigits(v as number), String(name)]}
                  contentStyle={TOOLTIP}
                />
                <Legend wrapperStyle={TOOLTIP} />
                <Line
                  type="monotone"
                  dataKey="received"
                  name="প্রাপ্ত"
                  stroke="#C27C0E"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="নিষ্পন্ন"
                  stroke="#0E5A43"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="গড় নিষ্পত্তির সময় বনাম চার্টার" subtitle="কর্মদিবসে, সেবা অনুযায়ী">
          {processing.length === 0 ? (
            <EmptyState title="এখনো কোনো সেবা নিষ্পন্ন হয়নি" />
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processing}
                  layout="vertical"
                  margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
                >
                  <CartesianGrid stroke="#CFDBEA" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={AXIS}
                    tickFormatter={(v) => toBnDigits(v as number)}
                    allowDecimals={false}
                    stroke="#CFDBEA"
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={AXIS}
                    width={128}
                    stroke="#CFDBEA"
                  />
                  <Tooltip
                    formatter={(v, name) => [`${formatDecimalBn(v as number)} দিন`, String(name)]}
                    contentStyle={TOOLTIP}
                  />
                  <Legend wrapperStyle={TOOLTIP} />
                  <Bar dataKey="actual" name="প্রকৃত" fill="#0E5A43" maxBarSize={12} />
                  <Bar dataKey="charter" name="চার্টার" fill="#CFDBEA" maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card title="শাখাভিত্তিক কর্মদক্ষতা" subtitle="সব সময়ের হিসাব" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-[13.5px]">
              <thead>
                <tr className="border-b border-rule/70 text-left text-[12.5px] text-muted">
                  <th className="px-4 py-2 font-medium">শাখা</th>
                  <th className="px-3 py-2 text-right font-medium">প্রাপ্ত</th>
                  <th className="px-3 py-2 text-right font-medium">নিষ্পন্ন</th>
                  <th className="px-3 py-2 text-right font-medium">সময়মতো</th>
                  <th className="px-3 py-2 text-right font-medium">গড় দিন</th>
                  <th className="px-4 py-2 text-right font-medium">রেটিং</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((row) => (
                  <tr key={row.section} className="border-b border-rule/40 last:border-0">
                    <td className="px-4 py-2">{row.section}</td>
                    <td className="px-3 py-2 text-right">{toBnDigits(row.received)}</td>
                    <td className="px-3 py-2 text-right">{toBnDigits(row.completed)}</td>
                    <td className="px-3 py-2 text-right">{toBnDigits(row.onTime)}%</td>
                    <td className="px-3 py-2 text-right">{formatDecimalBn(row.days)}</td>
                    <td className="px-4 py-2 text-right">
                      {row.rating ? `★ ${formatDecimalBn(row.rating)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="নাগরিকের মতামত" subtitle="সর্বশেষ রেটিং ও মন্তব্য" bodyClassName="p-0">
          {voice.length === 0 ? (
            <EmptyState title="এখনো কোনো নাগরিক রেটিং দেননি" />
          ) : (
            <ul className="divide-y divide-rule/50">
              {voice.map((item) => (
                <li key={item.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={item.to} className="min-w-0 hover:underline">
                      <span className="block text-[14px] font-medium">{item.title}</span>
                      <span className="block text-[12.5px] text-muted">
                        {item.serviceName} · ওয়ার্ড {toBnDigits(item.ward)} · {timeAgoBn(item.at)}
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
                    <p className="mt-1 text-[13px] leading-relaxed text-ink/85">“{item.comment}”</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card title="কাগজ সাশ্রয়" subtitle="হাতে লেখা বাদ পড়েছে (আনুমানিক)">
          <div className="flex items-start gap-4">
            <span className="text-forest-700/70">
              <FileStack size={34} strokeWidth={1.4} aria-hidden />
            </span>
            <div>
              <p className="font-display text-[30px] leading-tight">
                {toBnDigits(paper.sheets)} পাতা
              </p>
              <p className="text-[13px] text-muted">
                {toBnDigits(paper.lines)}টি রেজিস্টার লাইন ও রসিদ ডিজিটালে লেখা হয়েছে।
              </p>
              <p className="mt-2 text-[12px] text-muted">
                এটি একটি আনুমানিক হিসাব — প্রতি এন্ট্রির সঙ্গে ফরম, নোটিশ ও রসিদের কপি মিলিয়ে
                গড়ে ৩ পাতা ধরা হয়েছে।
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="সরাসরি কার্যক্রম"
          subtitle="অন্য জানালায় কাজ হলেও এখানে সঙ্গে সঙ্গে যোগ হয়"
          actions={
            <Link to="/office/audit-log" className="text-[12.5px] text-forest-700 hover:underline">
              সম্পূর্ণ লগ
            </Link>
          }
        >
          <Timeline entries={feed} />
        </Card>
      </div>

      {role && (
        <p className="mt-4 text-[12px] text-muted">
          {USERS[role].title} হিসেবে দেখছেন। সব তথ্য কাল্পনিক ডেমো ডেটা।
        </p>
      )}
    </>
  )
}
