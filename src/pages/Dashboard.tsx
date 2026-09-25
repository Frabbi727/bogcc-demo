import { AlertTriangle, BadgeCheck, Clock, Coins, Lightbulb, Truck, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Timeline } from '@/components/Timeline'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { USERS } from '@/data/seed'
import { formatNumberBn, formatTaka, toBnDigits } from '@/lib/bn'
import { currentFiscalYear } from '@/lib/fiscal'
import { LICENCE_STATUS_LABEL, LICENCE_STATUS_TONE, nextActionFor } from '@/lib/status'
import { REGISTERS, getRegister } from '@/registers'
import { entryLabel, useStore } from '@/store/useStore'
import { issuedAt } from '@/lib/records'
import { isOverdue, slaStatus } from '@/lib/sla'
import { isOpen } from '@/lib/records'
import type { Role } from '@/types'

const FY_MONTHS = [
  { m: 6, label: 'জুলাই' },
  { m: 7, label: 'আগস্ট' },
  { m: 8, label: 'সেপ্টে.' },
  { m: 9, label: 'অক্টো.' },
  { m: 10, label: 'নভে.' },
  { m: 11, label: 'ডিসে.' },
  { m: 0, label: 'জানু.' },
  { m: 1, label: 'ফেব্রু.' },
  { m: 2, label: 'মার্চ' },
  { m: 3, label: 'এপ্রিল' },
  { m: 4, label: 'মে' },
  { m: 5, label: 'জুন' },
]

function todayKey(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-md border border-rule/70 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] leading-snug text-muted">{label}</p>
        <span className="shrink-0 text-forest-700/70">{icon}</span>
      </div>
      <p className="mt-1 font-display text-[24px] leading-tight">{value}</p>
      {hint && <p className="text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

export function Dashboard() {
  const licences = useStore((s) => s.licences)
  const receipts = useStore((s) => s.receipts)
  const entries = useStore((s) => s.entries)
  const audit = useStore((s) => s.audit)
  const role = useStore((s) => s.session?.role)

  const fy = currentFiscalYear()
  const today = todayKey()
  const streetlight = getRegister('streetlight')

  const stats = useMemo(() => {
    const issuedThisFy = licences.filter((l) => l.status === 'issued' && l.fiscalYear === fy)
    const fyCollection = receipts.filter((r) => r.fiscalYear === fy).reduce((s, r) => s + r.total, 0)
    const pending = licences.filter((l) =>
      ['submitted', 'verified', 'approved'].includes(l.status),
    )
    const todayCollection = receipts
      .filter((r) => r.collectedAt.slice(0, 10) === today)
      .reduce((s, r) => s + r.total, 0)

    const finalStreetlight = streetlight?.steps.at(-1)?.key
    const openFaults = entries.filter(
      (e) => e.registerKey === 'streetlight' && !e.cancelled && e.status !== finalStreetlight,
    )
    const todayTrips = entries
      .filter(
        (e) => e.registerKey === 'garbage-trips' && !e.cancelled && e.data.tripDate === today,
      )
      .reduce((s, e) => s + Number(e.data.trips ?? 0), 0)
    // Work still waiting on somebody past its charter deadline. Records that were
    // finished late are a reporting question, not something a desk can act on.
    const overdue = [...licences, ...entries].filter((r) => isOpen(r) && isOverdue(r)).length

    return { issuedThisFy, fyCollection, pending, todayCollection, openFaults, todayTrips, overdue }
  }, [licences, receipts, entries, fy, today, streetlight])

  /** Everything waiting for the current role, across all modules. */
  const myWork = useMemo(() => {
    if (!role) return []
    /** Lower rank = closer to breaching the charter, so it sorts to the top. */
    const URGENCY = { overdue: 0, 'due-soon': 1, 'on-time': 2 } as const
    const items: {
      id: string
      to: string
      title: string
      hint: string
      badge?: ReactNode
      rank: number
    }[] = []

    for (const l of licences) {
      const next = nextActionFor(l.status)
      if (next && next.role === role) {
        items.push({
          rank: URGENCY[slaStatus(l)],
          id: l.id,
          to: `/office/trade-licence/${l.id}`,
          title: l.business.nameBn,
          hint: `ট্রেড লাইসেন্স · ${next.action} · ${toBnDigits(l.registerNo ?? l.appNo)}`,
          badge: (
            <StatusBadge label={LICENCE_STATUS_LABEL[l.status]} tone={LICENCE_STATUS_TONE[l.status]} />
          ),
        })
      }
    }

    for (const config of REGISTERS) {
      for (const e of entries) {
        if (e.registerKey !== config.key || e.cancelled) continue
        const i = config.steps.findIndex((st) => st.key === e.status)
        if (i < 0 || i >= config.steps.length - 1) continue
        const next = config.steps[i + 1]
        // Only the desk that acts next sees the line in its own inbox.
        if (!next.actors.includes(role as Role)) continue
        items.push({
          rank: URGENCY[slaStatus(e)],
          id: e.id,
          to: `/office/registers/${config.key}/${e.id}`,
          title: entryLabel(e),
          hint: `${config.title} · পরবর্তী: ${next.label} · ${toBnDigits(e.serialNo)}`,
          badge: <StatusBadge label={next.label} tone="pending" />,
        })
      }
    }

    // Whatever is closest to breaching the charter deserves attention first.
    items.sort((a, b) => a.rank - b.rank)
    return items.slice(0, 12)
  }, [role, licences, entries])

  const issuedByMonth = useMemo(() => {
    const startYear = Number(fy.slice(0, 4))
    return FY_MONTHS.map(({ m, label }) => {
      const year = m >= 6 ? startYear : startYear + 1
      const count = licences.filter((l) => {
        const on = issuedAt(l)
        if (l.status !== 'issued' || !on) return false
        const d = new Date(on)
        return d.getMonth() === m && d.getFullYear() === year
      }).length
      return { label, count }
    })
  }, [licences, fy])

  const faultsByWard = useMemo(() => {
    const map = new Map<number, number>()
    for (const e of stats.openFaults) {
      const ward = e.ward
      map.set(ward, (map.get(ward) ?? 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ward, count]) => ({ label: `ওয়ার্ড ${toBnDigits(ward)}`, count }))
  }, [stats.openFaults])

  const repairDays = useMemo(() => {
    const done = entries.filter(
      (e) =>
        e.registerKey === 'streetlight' &&
        !e.cancelled &&
        e.status === streetlight?.steps.at(-1)?.key &&
        e.data.repairDate,
    )
    const buckets = new Map<string, number[]>()
    for (const e of done) {
      // The complaint date is the record's own createdAt now, not a data column.
      const start = new Date(e.createdAt)
      const end = new Date(String(e.data.repairDate))
      const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
      const label = FY_MONTHS.find((x) => x.m === start.getMonth())?.label ?? ''
      const list = buckets.get(label) ?? []
      list.push(days)
      buckets.set(label, list)
    }
    return FY_MONTHS.filter((m) => buckets.has(m.label)).map((m) => {
      const list = buckets.get(m.label)!
      return {
        label: m.label,
        days: Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10,
      }
    })
  }, [entries, streetlight])

  const avgRepairDays = repairDays.length
    ? Math.round((repairDays.reduce((s, r) => s + r.days, 0) / repairDays.length) * 10) / 10
    : 0

  const recent = audit.slice(-8).reverse()
  const user = role ? USERS[role] : null

  return (
    <>
      <PageHeader
        title="ড্যাশবোর্ড"
        subtitle={
          user
            ? `${user.title} হিসেবে দেখছেন · অর্থবছর ${toBnDigits(fy)}`
            : `অর্থবছর ${toBnDigits(fy)}`
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="ইস্যুকৃত লাইসেন্স (এ অর্থবছর)"
          value={toBnDigits(stats.issuedThisFy.length)}
          icon={<BadgeCheck size={17} />}
        />
        <StatCard
          label="মোট আদায় (এ অর্থবছর)"
          value={formatTaka(stats.fyCollection)}
          icon={<Coins size={17} />}
        />
        <StatCard
          label="অপেক্ষমাণ আবেদন"
          value={toBnDigits(stats.pending.length)}
          hint="যাচাই, অনুমোদন ও ফি আদায় মিলিয়ে"
          icon={<Clock size={17} />}
        />
        <StatCard
          label="আজকের আদায়"
          value={formatTaka(stats.todayCollection)}
          icon={<Wallet size={17} />}
        />
        <StatCard
          label="চালু নষ্ট বাতি"
          value={toBnDigits(stats.openFaults.length)}
          hint="মেরামত সম্পন্ন হয়নি"
          icon={<Lightbulb size={17} />}
        />
        <StatCard
          label="মেয়াদোত্তীর্ণ কাজ"
          value={toBnDigits(stats.overdue)}
          hint="সিটিজেন চার্টারের সময় পার হয়েছে"
          icon={<AlertTriangle size={17} />}
        />
        <StatCard
          label="আজকের বর্জ্য ট্রিপ"
          value={toBnDigits(stats.todayTrips)}
          hint="পরিচ্ছন্নতা শাখা"
          icon={<Truck size={17} />}
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card
          title="আপনার অপেক্ষমাণ কাজ"
          subtitle={user ? user.title : undefined}
          bodyClassName="p-0"
        >
          {myWork.length === 0 ? (
            <EmptyState
              title="এই ভূমিকায় এখন কোনো কাজ বাকি নেই"
              hint="উপরের তালিকা থেকে অন্য ভূমিকায় গিয়ে দেখুন কার কী কাজ অপেক্ষা করছে।"
            />
          ) : (
            <ul className="divide-y divide-rule/50">
              {myWork.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-forest-50/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium">{item.title}</span>
                      <span className="block text-[12.5px] text-muted">{item.hint}</span>
                    </span>
                    {item.badge}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="সাম্প্রতিক কার্যক্রম" subtitle="সর্বশেষ ৮টি এন্ট্রি">
          <Timeline entries={recent} />
          <p className="mt-3 border-t border-rule/60 pt-2 text-[12.5px]">
            <Link to="/office/audit-log" className="text-forest-700 hover:underline">
              সম্পূর্ণ কার্যক্রম লগ দেখুন
            </Link>
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="মাসভিত্তিক ইস্যুকৃত লাইসেন্স" subtitle={`অর্থবছর ${toBnDigits(fy)}`}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuedByMonth} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid stroke="#CFDBEA" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#5E6E69' }}
                  interval={0}
                  angle={-38}
                  textAnchor="end"
                  height={44}
                  stroke="#CFDBEA"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#5E6E69' }}
                  tickFormatter={(v) => toBnDigits(v as number)}
                  allowDecimals={false}
                  stroke="#CFDBEA"
                />
                <Tooltip
                  formatter={(v) => [toBnDigits(v as number), 'লাইসেন্স']}
                  contentStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
                />
                <Bar dataKey="count" fill="#0E5A43" radius={[2, 2, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="ওয়ার্ডভিত্তিক চালু নষ্ট বাতি" subtitle="মেরামত অপেক্ষমাণ">
          {faultsByWard.length === 0 ? (
            <EmptyState title="কোনো নষ্ট বাতির অভিযোগ বাকি নেই" />
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={faultsByWard} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <CartesianGrid stroke="#CFDBEA" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#5E6E69' }}
                    interval={0}
                    angle={-38}
                    textAnchor="end"
                    height={54}
                    stroke="#CFDBEA"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#5E6E69' }}
                    tickFormatter={(v) => toBnDigits(v as number)}
                    allowDecimals={false}
                    stroke="#CFDBEA"
                  />
                  <Tooltip
                    formatter={(v) => [toBnDigits(v as number), 'অভিযোগ']}
                    contentStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
                  />
                  <Bar dataKey="count" fill="#C27C0E" radius={[2, 2, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card
          title="গড় মেরামত সময়"
          subtitle={`সামগ্রিক গড় ${formatNumberBn(avgRepairDays)} দিন`}
        >
          {repairDays.length === 0 ? (
            <EmptyState title="এখনো কোনো মেরামত সম্পন্ন হয়নি" />
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repairDays} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <CartesianGrid stroke="#CFDBEA" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#5E6E69' }}
                    interval={0}
                    stroke="#CFDBEA"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#5E6E69' }}
                    tickFormatter={(v) => toBnDigits(v as number)}
                    stroke="#CFDBEA"
                  />
                  <Tooltip
                    formatter={(v) => [`${toBnDigits(v as number)} দিন`, 'গড় সময়']}
                    contentStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
                  />
                  <Bar dataKey="days" fill="#0A4232" radius={[2, 2, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
