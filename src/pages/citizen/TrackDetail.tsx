import { Ban, CreditCard, Info, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/PageHeader'
import { SlaBadge } from '@/components/SlaBadge'
import { StarRating, type Rating } from '@/components/StarRating'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { Textarea } from '@/components/ui/Textarea'
import { citizenLabel, serviceOf } from '@/data/services'
import { roleTitle } from '@/data/users'
import { bnToEnDigits, formatDateBn, formatDateTimeBn, toBnDigits } from '@/lib/bn'
import { publicNotes, receiptFor, stepFor } from '@/lib/records'
import { LICENCE_STATUS_ORDER } from '@/lib/status'
import { getRegister, nextStep } from '@/registers'
import { useStore } from '@/store/useStore'
import type { BaseRecord, Licence, RegisterEntry, Role } from '@/types'

/** Complaint photos come in pairs, and the pair is the point: the work is visible. */
const PHOTO_KIND = { before: 'সমস্যার ছবি', after: 'কাজ শেষের ছবি' } as const

/** One step of the journey as the citizen reads it. */
interface CitizenStep {
  key: string
  label: string
  /** The desk responsible, when one is named. */
  desk?: string
  at?: string
  note?: string
}

export function CitizenTrackDetail() {
  const { trackingNo } = useParams()
  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)
  const citizen = useStore((s) => s.citizen)

  const record = useMemo(
    () =>
      [...licences, ...entries].find(
        (r) => r.trackingNo.toUpperCase() === (trackingNo ?? '').toUpperCase(),
      ),
    [licences, entries, trackingNo],
  )

  if (!record) {
    return (
      <>
        <PageHeader title="আবেদন" />
        <EmptyState
          title="এই ট্র্যাকিং নম্বরের কোনো আবেদন নেই"
          hint="নম্বরটি মিলিয়ে দেখুন। অনুলিপি করার সময় কোনো অক্ষর বাদ পড়তে পারে।"
          action={<LinkButton to="/nagorik/track">আবার খুঁজুন</LinkButton>}
        />
      </>
    )
  }

  // A tracking number is guessable, so reading an application still needs the
  // mobile it was filed with.
  if (citizen?.mobile !== record.applicantMobile) {
    return <ConfirmMobile record={record} />
  }

  return <RecordView record={record} />
}

/* ---------- the gate ---------- */

function ConfirmMobile({ record }: { record: BaseRecord }) {
  const citizenLogin = useStore((s) => s.citizenLogin)
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const mob = bnToEnDigits(mobile.trim())
    if (mob.length !== 11) return setError('১১ সংখ্যার মোবাইল নম্বর দিন')
    if (mob !== record.applicantMobile) return setError('এই আবেদনের সঙ্গে নম্বরটি মেলেনি')
    citizenLogin(mob)
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title="নিজের পরিচয় নিশ্চিত করুন"
        subtitle="আবেদনটি যে মোবাইল নম্বর দিয়ে জমা হয়েছিল, সেটি দিন। অন্যের আবেদন দেখা যাবে না।"
      />
      <Card>
        <div className="flex flex-col gap-3.5">
          <Field label="মোবাইল নম্বর" htmlFor="confirm-mobile" required error={error}>
            <Input
              id="confirm-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
            />
          </Field>
          <Button type="submit" variant="primary" className="self-start">
            দেখুন
          </Button>
        </div>
      </Card>
    </form>
  )
}

/* ---------- the page ---------- */

function RecordView({ record }: { record: BaseRecord }) {
  const navigate = useNavigate()
  const receipts = useStore((s) => s.receipts)
  const payForLicence = useStore((s) => s.payForLicence)
  const payForEntry = useStore((s) => s.payForEntry)
  const rateRecord = useStore((s) => s.rateRecord)

  const service = serviceOf(record.serviceKey)
  const isLicence = 'business' in record
  const config = isLicence ? undefined : getRegister((record as RegisterEntry).registerKey)

  const steps = useMemo(() => citizenSteps(record, isLicence), [record, isLicence])
  const notes = publicNotes(record)
  const photos = record.photos ?? []
  const receipt = receiptFor(receipts, record as Licence | RegisterEntry)
  const cancelled = record.cancelled

  // What the citizen can still do: pay a due fee, or print something that is ready.
  const paymentDue = !cancelled && (isLicence
    ? record.status === 'approved'
    : !!nextStep(config!, record.status)?.payment)
  const certificateReady =
    !cancelled && !!config?.printable && record.status === config.steps.at(-1)?.key
  const licenceReady = !cancelled && isLicence && record.status === 'issued'

  function onPay() {
    const payment = isLicence ? payForLicence(record.id, 'online') : payForEntry(record.id, 'online')
    if (payment) navigate(`/pay/${payment.id}`)
    else toast.error('এখন পরিশোধ করা যাচ্ছে না')
  }

  return (
    <>
      <PageHeader
        title={service?.name ?? record.serviceKey}
        subtitle={
          <>
            ট্র্যাকিং নং {record.trackingNo} · আবেদনের তারিখ{' '}
            {formatDateBn(record.createdAt)}
            {record.channel === 'online' && <> · অনলাইন আবেদন</>}
          </>
        }
        badge={
          cancelled ? (
            <StatusBadge label="বাতিল" tone="danger" />
          ) : (
            <StatusBadge label={citizenLabel(record.serviceKey, record.status)} tone="info" />
          )
        }
      />

      <div className="flex flex-col gap-4">
        {cancelled ? (
          <div className="flex gap-2.5 rounded-md border border-stamp/30 bg-stamp/5 px-4 py-3">
            <Ban size={17} className="mt-0.5 shrink-0 text-stamp" />
            <div>
              <p className="text-[13.5px] font-medium">আবেদনটি বাতিল হয়েছে</p>
              <p className="mt-0.5 text-[13px] leading-relaxed">{cancelled.reason}</p>
              <p className="mt-0.5 text-[12px] text-muted">{formatDateTimeBn(cancelled.at)}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-rule/70 bg-white px-4 py-3">
            <span className="text-[13px] text-muted">সম্ভাব্য সমাপ্তি</span>
            <span className="text-[13.5px] font-medium">{formatDateBn(record.dueAt)}</span>
            <SlaBadge record={record} />
          </div>
        )}

        <Card title="আবেদনের অবস্থা">
          <ol className="flex flex-col">
            {steps.map((step, i) => {
              const done = !!step.at
              const current = !done && steps.slice(0, i).every((s) => s.at)
              return (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className={
                        done
                          ? 'size-2.5 shrink-0 rounded-full bg-forest-700'
                          : current
                            ? 'size-2.5 shrink-0 rounded-full border-2 border-forest-700 bg-white'
                            : 'size-2.5 shrink-0 rounded-full bg-rule'
                      }
                    />
                    {i < steps.length - 1 && <span className="w-px flex-1 bg-rule" />}
                  </div>
                  <div className={i < steps.length - 1 ? 'min-w-0 pb-4' : 'min-w-0'}>
                    <p
                      className={
                        done || current
                          ? 'text-[13.5px] font-medium leading-snug'
                          : 'text-[13.5px] leading-snug text-muted'
                      }
                    >
                      {step.label}
                    </p>
                    {step.desk && <p className="text-[12px] text-muted">{step.desk}</p>}
                    {step.at && (
                      <p className="mt-0.5 text-[12px] text-muted">{formatDateTimeBn(step.at)}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </Card>

        {notes.length > 0 && (
          <Card title="অফিসের বার্তা">
            <ul className="flex flex-col gap-2.5">
              {notes.map((note, i) => (
                <li key={`${note.status}-${i}`} className="flex gap-2.5">
                  <Info size={15} className="mt-0.5 shrink-0 text-sky" />
                  <div>
                    <p className="text-[13px] leading-relaxed">{note.note}</p>
                    <p className="mt-0.5 text-[12px] text-muted">{formatDateTimeBn(note.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {photos.length > 0 && (
          <Card title="ছবি">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, i) => (
                <li key={`${photo.kind}-${i}`}>
                  <img
                    src={photo.dataUrl}
                    alt={photo.caption ?? PHOTO_KIND[photo.kind]}
                    className="aspect-square w-full rounded-sm border border-rule/70 object-cover"
                  />
                  <p className="mt-1 text-[12px] text-muted">
                    {photo.caption ?? PHOTO_KIND[photo.kind]}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {(paymentDue || licenceReady || certificateReady || receipt) && (
          <Card title="পরবর্তী পদক্ষেপ">
            <div className="flex flex-wrap gap-2">
              {paymentDue && (
                <Button onClick={onPay} variant="primary">
                  <CreditCard size={15} />
                  ফি পরিশোধ করুন
                </Button>
              )}
              {licenceReady && (
                <LinkButton to={`/print/licence/${record.id}`} target="_blank">
                  <Printer size={15} />
                  লাইসেন্স ডাউনলোড
                </LinkButton>
              )}
              {certificateReady && (
                <LinkButton to={`/print/certificate/${record.id}`} target="_blank">
                  <Printer size={15} />
                  সনদ ডাউনলোড
                </LinkButton>
              )}
              {receipt && (
                <LinkButton to={`/print/receipt/${receipt.id}`} target="_blank">
                  <Printer size={15} />
                  রসিদ (নং {toBnDigits(receipt.receiptNo)})
                </LinkButton>
              )}
            </div>
          </Card>
        )}

        {record.closedAt && !cancelled && (
          <FeedbackCard
            record={record}
            onRate={(rating, comment) => {
              rateRecord(record.id, rating, comment)
              toast.success('মতামতের জন্য ধন্যবাদ')
            }}
          />
        )}
      </div>
    </>
  )
}

/* ---------- feedback ---------- */

function FeedbackCard({
  record,
  onRate,
}: {
  record: BaseRecord
  onRate: (rating: Rating, comment?: string) => void
}) {
  const [rating, setRating] = useState<Rating | undefined>()
  const [comment, setComment] = useState('')

  if (record.feedback) {
    return (
      <Card title="আপনার মতামত">
        <StarRating value={record.feedback.rating} />
        {record.feedback.comment && (
          <p className="mt-2 text-[13px] leading-relaxed">{record.feedback.comment}</p>
        )}
      </Card>
    )
  }

  return (
    <Card title="সেবাটি কেমন লাগল?" subtitle="আপনার মতামত সেবার মান বাড়াতে কাজে লাগে।">
      <StarRating value={rating} onChange={setRating} />
      <div className="mt-3 flex flex-col gap-2.5">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="কিছু বলতে চাইলে লিখুন (ঐচ্ছিক)"
        />
        <Button
          variant="primary"
          disabled={!rating}
          className="self-start"
          onClick={() => rating && onRate(rating, comment.trim() || undefined)}
        >
          মতামত পাঠান
        </Button>
      </div>
    </Card>
  )
}

/* ---------- steps ---------- */

/**
 * The journey as the citizen reads it: catalogue labels for the wording, the
 * register config for the responsible desk, and `history` for the timestamps.
 */
function citizenSteps(record: BaseRecord, isLicence: boolean): CitizenStep[] {
  if (isLicence) {
    const desks: Partial<Record<string, Role>> = {
      verified: 'inspector',
      approved: 'licenceOfficer',
      issued: 'accounts',
    }
    return LICENCE_STATUS_ORDER.filter((s) => s !== 'cancelled').map((status) => {
      const step = stepFor(record, status)
      const desk = desks[status]
      return {
        key: status,
        label: citizenLabel(record.serviceKey, status),
        desk: desk ? roleTitle(desk) : undefined,
        at: step?.at,
      }
    })
  }

  const config = getRegister((record as RegisterEntry).registerKey)
  if (!config) return []
  return config.steps.map((step) => {
    const done = stepFor(record, step.key)
    return {
      key: step.key,
      label: step.citizenLabel,
      desk: step.actors[0] ? roleTitle(step.actors[0]) : undefined,
      at: done?.at,
    }
  })
}
