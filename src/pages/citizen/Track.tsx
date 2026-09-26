import { ChevronRight, Search, Smartphone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/PageHeader'
import { SlaBadge } from '@/components/SlaBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { citizenLabel, serviceOf } from '@/data/services'
import { bnToEnDigits, formatDateBn, toBnDigits } from '@/lib/bn'
import { useStore } from '@/store/useStore'
import type { BaseRecord } from '@/types'

/**
 * Two ways in, both of which need the citizen's own mobile number.
 *
 * A tracking number alone is guessable, and someone else's application is not a
 * citizen's to read — so even the single-record lookup asks for the mobile it was
 * filed with. `/verify` stays public, because a printed QR must open for anyone.
 */
export function CitizenTrack() {
  const citizen = useStore((s) => s.citizen)
  const [tab, setTab] = useState<'one' | 'all'>(citizen ? 'all' : 'one')

  return (
    <>
      <PageHeader
        title="আবেদন ট্র্যাক করুন"
        subtitle="ট্র্যাকিং নম্বর দিয়ে একটি আবেদন দেখুন, অথবা মোবাইল নম্বর দিয়ে আপনার সব আবেদন দেখুন।"
      />

      <Tabs
        items={[
          { key: 'one', label: 'ট্র্যাকিং নম্বর দিয়ে' },
          { key: 'all', label: 'আমার সব আবেদন' },
        ]}
        active={tab}
        onChange={(key) => setTab(key as 'one' | 'all')}
      />

      <div className="mt-4">{tab === 'one' ? <SingleLookup /> : <MyRequests />}</div>
    </>
  )
}

/* ---------- one record, by tracking number + mobile ---------- */

function SingleLookup() {
  const navigate = useNavigate()
  const records = useAllRecords()
  const citizenLogin = useStore((s) => s.citizenLogin)
  const [trackingNo, setTrackingNo] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const no = bnToEnDigits(trackingNo.trim()).toUpperCase()
    const mob = bnToEnDigits(mobile.trim())

    if (!no) return setError('ট্র্যাকিং নম্বর দিন')
    if (mob.length !== 11) return setError('১১ সংখ্যার মোবাইল নম্বর দিন')

    const found = records.find(
      (r) => r.trackingNo.toUpperCase() === no && r.applicantMobile === mob,
    )
    if (!found) {
      setError('এই ট্র্যাকিং নম্বর ও মোবাইলের কোনো আবেদন পাওয়া যায়নি')
      return
    }
    setError('')
    // The mobile has just been checked against the record, which is the same
    // proof the detail page asks for — so don't ask twice.
    citizenLogin(mob)
    navigate(`/nagorik/track/${found.trackingNo}`)
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <div className="flex flex-col gap-3.5">
          <Field
            label="ট্র্যাকিং নম্বর"
            htmlFor="tracking-no"
            required
            hint="আবেদন জমা দেওয়ার সময় পাওয়া নম্বর, যেমন BOGCC-2026-000123"
          >
            <Input
              id="tracking-no"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="BOGCC-2026-000123"
            />
          </Field>

          <Field label="মোবাইল নম্বর" htmlFor="tracking-mobile" required error={error}>
            <Input
              id="tracking-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
            />
          </Field>

          <Button type="submit" variant="primary" className="self-start">
            <Search size={15} />
            দেখুন
          </Button>
        </div>
      </Card>
    </form>
  )
}

/* ---------- every record for one mobile, behind a simulated OTP ---------- */

function MyRequests() {
  const citizen = useStore((s) => s.citizen)
  const citizenLogin = useStore((s) => s.citizenLogin)
  const records = useAllRecords()

  const [mobile, setMobile] = useState('')
  const [sent, setSent] = useState<{ mobile: string; code: string } | undefined>()
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')

  const mine = useMemo(
    () =>
      citizen
        ? records
            .filter((r) => r.applicantMobile === citizen.mobile)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [citizen, records],
  )

  if (citizen) {
    return mine.length === 0 ? (
      <EmptyState
        title="এই নম্বরে কোনো আবেদন নেই"
        hint="নাগরিক সনদ থেকে একটি সেবার আবেদন করে দেখুন।"
      />
    ) : (
      <ul className="flex flex-col gap-2.5">
        {mine.map((record) => (
          <li key={record.id}>
            <RecordRow record={record} />
          </li>
        ))}
      </ul>
    )
  }

  function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    const mob = bnToEnDigits(mobile.trim())
    if (mob.length !== 11) return setError('১১ সংখ্যার মোবাইল নম্বর দিন')
    setError('')
    // Demo only: the code is shown on screen instead of being texted.
    const code = String(Math.floor(1000 + Math.random() * 9000))
    setSent({ mobile: mob, code })
    setTyped('')
  }

  function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!sent) return
    if (bnToEnDigits(typed.trim()) !== sent.code) return setError('কোডটি মেলেনি')
    setError('')
    citizenLogin(sent.mobile)
    toast.success('প্রবেশ সম্পন্ন')
  }

  if (!sent) {
    return (
      <form onSubmit={sendOtp}>
        <Card>
          <div className="flex flex-col gap-3.5">
            <Field label="মোবাইল নম্বর" htmlFor="otp-mobile" required error={error}>
              <Input
                id="otp-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="numeric"
                placeholder="01XXXXXXXXX"
              />
            </Field>
            <Button type="submit" variant="primary" className="self-start">
              <Smartphone size={15} />
              কোড পাঠান
            </Button>
          </div>
        </Card>
      </form>
    )
  }

  return (
    <form onSubmit={verifyOtp}>
      <Card title="কোড যাচাই">
        <div className="flex flex-col gap-3.5">
          <p className="rounded-sm border border-amber/30 bg-amber/8 px-3 py-2 text-[13px] leading-relaxed">
            ডেমো: কোনো এসএমএস পাঠানো হয়নি। {toBnDigits(sent.mobile)} নম্বরের কোড{' '}
            <span className="font-display text-[16px]">{toBnDigits(sent.code)}</span>
          </p>

          <Field label="৪ সংখ্যার কোড" htmlFor="otp-code" required error={error}>
            <Input
              id="otp-code"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              inputMode="numeric"
              placeholder="০০০০"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary">
              প্রবেশ করুন
            </Button>
            <Button onClick={() => setSent(undefined)}>নম্বর বদলান</Button>
          </div>
        </div>
      </Card>
    </form>
  )
}

/* ---------- shared ---------- */

function RecordRow({ record }: { record: BaseRecord }) {
  const service = serviceOf(record.serviceKey)

  return (
    <Link
      to={`/nagorik/track/${record.trackingNo}`}
      className="block rounded-md border border-rule/70 bg-white px-4 py-3 transition-colors hover:border-forest-700/40 hover:bg-forest-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14.5px] font-medium leading-snug">{service?.name ?? record.serviceKey}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {record.trackingNo} · {formatDateBn(record.createdAt)}
          </p>
        </div>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-sm bg-forest-700/10 px-2 py-0.5 text-[12px] text-forest-800">
          {record.cancelled
            ? 'বাতিল'
            : citizenLabel(record.serviceKey, record.status)}
        </span>
        {!record.closedAt && !record.cancelled && <SlaBadge record={record} />}
      </div>
    </Link>
  )
}

/** Licences and register entries share `BaseRecord`, so tracking treats them alike. */
function useAllRecords(): BaseRecord[] {
  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)
  return useMemo(() => [...licences, ...entries], [licences, entries])
}
