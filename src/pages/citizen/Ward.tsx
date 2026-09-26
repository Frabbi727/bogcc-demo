import { CalendarClock, MapPin, Phone, TriangleAlert, UserRound } from 'lucide-react'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LinkButton } from '@/components/ui/LinkButton'
import { WARDS, wardInfo } from '@/data/wards'
import { toBnDigits } from '@/lib/bn'
import { getRegister } from '@/registers'
import { useStore } from '@/store/useStore'

/**
 * "আমার ওয়ার্ড" — who represents this ward, when their office is open, and how
 * much is still open there. Spec §13.9.
 */
export function CitizenWard() {
  const { n } = useParams()
  const entries = useStore((s) => s.entries)

  const ward = Number(n)
  const info = Number.isInteger(ward) ? wardInfo(ward) : undefined

  // Open = not yet at the register's final step and not cancelled. Reading the
  // last step out of the config keeps this honest when a register gains a step.
  const openComplaints = useMemo(() => {
    if (!info) return 0
    return entries.filter((entry) => {
      if (entry.ward !== ward || entry.cancelled) return false
      const config = getRegister(entry.registerKey)
      if (!config) return false
      return entry.status !== config.steps.at(-1)?.key
    }).length
  }, [entries, info, ward])

  if (!info) {
    return (
      <Card>
        <EmptyState
          icon={<MapPin size={26} strokeWidth={1.5} />}
          title="এই ওয়ার্ডটি পাওয়া যায়নি।"
          hint={`বগুড়া সিটি কর্পোরেশনে ওয়ার্ড ১ থেকে ${toBnDigits(WARDS.length)} পর্যন্ত রয়েছে।`}
          action={<LinkButton to="/nagorik">হোমে ফিরুন</LinkButton>}
        />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-[20px] leading-tight">
          ওয়ার্ড {toBnDigits(info.ward)}
        </h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink/85">
          আপনার ওয়ার্ডের কাউন্সিলর ও কার্যালয়ের তথ্য।
        </p>
      </div>

      <Card title="ওয়ার্ড কাউন্সিলর">
        <dl className="flex flex-col gap-3">
          <InfoRow icon={UserRound} label="নাম" value={info.councillor} />
          <InfoRow icon={CalendarClock} label="কার্যালয়ের সময়" value={info.officeHours} />
          <InfoRow icon={Phone} label="মোবাইল" value={toBnDigits(info.mobile)} />
        </dl>
        <p className="mt-3 rounded-sm bg-amber/10 px-3 py-2 text-[12.5px] leading-relaxed text-ink/85">
          ডেমো সংস্করণ: কাউন্সিলরের নাম ও নম্বর কাল্পনিক।
        </p>
      </Card>

      <Card title="এই ওয়ার্ডে চলমান">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-forest-700/10 text-forest-700">
            <TriangleAlert size={19} />
          </span>
          <div>
            <p className="font-display text-[22px] leading-none">{toBnDigits(openComplaints)}</p>
            <p className="mt-1 text-[12.5px] text-muted">নিষ্পন্ন হয়নি এমন আবেদন ও অভিযোগ</p>
          </div>
        </div>
      </Card>

      <Card title="অন্য ওয়ার্ড" bodyClassName="flex flex-wrap gap-1.5">
        {WARDS.map((w) => (
          <LinkButton
            key={w}
            to={`/nagorik/ward/${w}`}
            size="sm"
            variant={w === info.ward ? 'primary' : 'secondary'}
          >
            {toBnDigits(w)}
          </LinkButton>
        ))}
      </Card>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted" />
      <dt className="w-32 shrink-0 text-[12.5px] text-muted">{label}</dt>
      <dd className="text-[13px] leading-snug">{value}</dd>
    </div>
  )
}
