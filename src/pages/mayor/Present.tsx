import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { KpiCard } from '@/components/KpiCard'
import { WardMap } from '@/components/WardMap'
import { formatDateBn, formatTaka, toBnDigits } from '@/lib/bn'
import { currentFiscalYear } from '@/lib/fiscal'
import {
  REVENUE_HEADS,
  REVENUE_HEAD_LABEL,
  WARD_METRIC_LABEL,
  citizenVoice,
  lastMonths,
  mayorKpis,
  revenueByMonth,
  wardStats,
  type ServiceRecord,
} from '@/lib/mayor'
import { useStore } from '@/store/useStore'

/** How long each slide stays up before the deck moves on. */
const SLIDE_SECONDS = 10

const HEAD_COLOR: Record<string, string> = {
  'trade-licence': '#0E5A43',
  'holding-tax': '#1D6FA3',
  certificate: '#C27C0E',
  other: '#5E6E69',
}

const SLIDES = [
  { key: 'kpis', title: 'এক নজরে সেবা ও রাজস্ব' },
  { key: 'wards', title: 'ওয়ার্ডভিত্তিক চিত্র' },
  { key: 'revenue', title: 'মাসভিত্তিক রাজস্ব' },
  { key: 'voice', title: 'নাগরিকের মতামত' },
]

/**
 * Presentation mode: the dashboard on a projector.
 *
 * Big type, no chrome, and it cycles by itself so the mayor can talk instead of
 * clicking. It reads the same live store as everything else, so an action taken
 * in another window lands on the screen mid-presentation.
 */
export function Present() {
  const session = useStore((s) => s.session)
  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)
  const receipts = useStore((s) => s.receipts)
  const holdings = useStore((s) => s.holdings)

  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const fy = currentFiscalYear()

  const go = (step: number) => setIndex((i) => (i + step + SLIDES.length) % SLIDES.length)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_SECONDS * 1000)
    return () => clearInterval(timer)
  }, [paused])

  /** Arrow keys to steer, space to hold a slide, Escape to come back. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      } else if (e.key === 'Escape') navigate('/office/mayor')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const records = useMemo<ServiceRecord[]>(() => [...licences, ...entries], [licences, entries])
  const months = useMemo(() => lastMonths(12), [])
  const kpis = useMemo(() => mayorKpis(records, receipts, fy), [records, receipts, fy])
  const wards = useMemo(
    () => wardStats(records, receipts, holdings, fy),
    [records, receipts, holdings, fy],
  )
  const revenue = useMemo(() => revenueByMonth(receipts, months), [receipts, months])
  const voice = useMemo(() => citizenVoice(records, 4), [records])

  if (!session) return <Navigate to="/office/login" replace />

  const slide = SLIDES[index]

  return (
    <div className="flex min-h-screen flex-col bg-paper px-6 py-5 lg:px-10 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[15px] text-muted">
            বগুড়া সিটি কর্পোরেশন · ডিজিটাল সেবা ও রেজিস্টার ব্যবস্থা (ডেমো)
          </p>
          <h1 className="font-display text-[34px] leading-tight lg:text-[42px]">{slide.title}</h1>
        </div>
        <p className="text-[15px] text-muted">
          অর্থবছর {toBnDigits(fy)} · {formatDateBn(new Date().toISOString())}
        </p>
      </header>

      <main className="flex flex-1 flex-col justify-center">
        {slide.key === 'kpis' && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.key} kpi={kpi} large />
            ))}
          </div>
        )}

        {slide.key === 'wards' && (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <WardMap stats={wards} metric="complaints" large />
            <div className="rounded-md border border-rule/70 bg-white px-6 py-5">
              <h2 className="text-[22px]">সবচেয়ে বেশি {WARD_METRIC_LABEL.complaints}</h2>
              <ol className="mt-3 flex flex-col gap-2">
                {[...wards]
                  .sort((a, b) => b.complaints - a.complaints)
                  .slice(0, 6)
                  .map((w) => (
                    <li key={w.ward} className="flex items-baseline justify-between gap-3">
                      <span className="text-[19px]">ওয়ার্ড {toBnDigits(w.ward)}</span>
                      <span className="font-display text-[24px]">
                        {toBnDigits(w.complaints)}
                      </span>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        )}

        {slide.key === 'revenue' && (
          <div className="h-[58vh] rounded-md border border-rule/70 bg-white px-4 py-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="#CFDBEA" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 15, fill: '#5E6E69' }}
                  interval={0}
                  stroke="#CFDBEA"
                />
                <YAxis
                  tick={{ fontSize: 15, fill: '#5E6E69' }}
                  tickFormatter={(v) => toBnDigits(Math.round((v as number) / 1000))}
                  stroke="#CFDBEA"
                  label={{
                    value: 'হাজার টাকা',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 14, fill: '#5E6E69' },
                  }}
                />
                <Tooltip
                  formatter={(v, name) => [formatTaka(v as number), String(name)]}
                  contentStyle={{ fontSize: 15, fontFamily: 'var(--font-sans)' }}
                />
                <Legend wrapperStyle={{ fontSize: 15, fontFamily: 'var(--font-sans)' }} />
                {REVENUE_HEADS.map((head) => (
                  <Bar
                    key={head}
                    dataKey={head}
                    name={REVENUE_HEAD_LABEL[head]}
                    stackId="revenue"
                    fill={HEAD_COLOR[head]}
                    maxBarSize={44}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {slide.key === 'voice' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {voice.length === 0 ? (
              <p className="text-[20px] text-muted">এখনো কোনো নাগরিক রেটিং দেননি।</p>
            ) : (
              voice.map((item) => (
                <blockquote
                  key={item.id}
                  className="rounded-md border border-rule/70 bg-white px-6 py-5"
                >
                  <p className="text-[22px] text-amber" aria-label={`${toBnDigits(item.rating)} তারকা`}>
                    {'★'.repeat(item.rating)}
                    <span className="text-rule">{'★'.repeat(5 - item.rating)}</span>
                  </p>
                  {item.comment && (
                    <p className="mt-2 text-[21px] leading-relaxed">“{item.comment}”</p>
                  )}
                  <footer className="mt-3 text-[15px] text-muted">
                    {item.serviceName} · ওয়ার্ড {toBnDigits(item.ward)}
                  </footer>
                </blockquote>
              ))
            )}
          </div>
        )}
      </main>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="group" aria-label="উপস্থাপনা নিয়ন্ত্রণ">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="আগের স্লাইড"
            className="rounded-sm border border-rule bg-white p-2 hover:bg-forest-50"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule bg-white px-3 py-2 text-[15px] hover:bg-forest-50"
          >
            {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
            {paused ? 'চালু করুন' : 'থামান'}
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="পরের স্লাইড"
            className="rounded-sm border border-rule bg-white p-2 hover:bg-forest-50"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
          <span className="ml-1 flex items-center gap-1.5" aria-hidden>
            {SLIDES.map((s, i) => (
              <span
                key={s.key}
                className={`size-2.5 rounded-full ${i === index ? 'bg-forest-700' : 'bg-rule'}`}
              />
            ))}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/office/mayor')}
          className="inline-flex items-center gap-1.5 rounded-sm border border-rule bg-white px-3 py-2 text-[15px] hover:bg-forest-50"
        >
          <X size={18} aria-hidden />
          উপস্থাপনা শেষ করুন
        </button>
      </footer>
    </div>
  )
}
