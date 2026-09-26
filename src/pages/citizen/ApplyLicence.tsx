import { ArrowLeft, ArrowRight, Clock, Copy, Search, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { DocumentChips } from '@/components/DocumentChips'
import { PageHeader } from '@/components/PageHeader'
import { WorkflowSteps } from '@/components/WorkflowSteps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { serviceOf } from '@/data/services'
import { businessTypeOf } from '@/data/businessTypes'
import { feeLinesFor } from '@/data/seed'
import { formatDateBn, toBnDigits } from '@/lib/bn'
import { expiryOf, matchesLicence, normalizeTerm, renewableLicences } from '@/lib/licence'
import { useStore } from '@/store/useStore'
import type { Licence } from '@/types'
import {
  EMPTY_FORM,
  type Errors,
  type FormState,
  formFromLicence,
  licenceInputFrom,
  validateForm,
} from '@/pages/trade-licence/form'
import { BusinessFields, FeeCard, OwnerFields } from '@/pages/trade-licence/LicenceForm'

import { charterLabel } from './charter'

/**
 * Online trade licence application, new and renewal.
 *
 * Trade licence is the one citizen-facing service that is not driven by the
 * register engine, so `CitizenApply` cannot generate its form. It reuses the
 * office form's shape, checks and clean-up (`pages/trade-licence/form.ts`) and the
 * same `createLicence` call, only with `channel: 'online'` — so an online
 * application and a counter application become the same record and travel the
 * same workflow.
 */

const STEP_LABELS = ['তথ্য', 'কাগজপত্র', 'যাচাই', 'জমা']

export function CitizenApplyLicence({ serviceKey }: { serviceKey: 'tl-new' | 'tl-renew' }) {
  const isRenewal = serviceKey === 'tl-renew'
  const service = serviceOf(serviceKey)

  const licences = useStore((s) => s.licences)
  // A renewal needs last year's line before there is a form to fill in.
  const [source, setSource] = useState<Licence | undefined>()

  if (!service) {
    return (
      <>
        <PageHeader title="আবেদন" />
        <EmptyState
          title="এই সেবার অনলাইন আবেদন এখন সম্ভব নয়"
          hint="নাগরিক সনদ থেকে সেবাটি দেখে নিন।"
          action={<LinkButton to="/nagorik/services">নাগরিক সনদ দেখুন</LinkButton>}
        />
      </>
    )
  }

  if (isRenewal && !source) {
    return (
      <PickLicence
        licences={licences}
        onPick={setSource}
        subtitle={`নির্ধারিত সময় ${charterLabel(service)}`}
      />
    )
  }

  return (
    <LicenceWizard
      key={source?.id ?? 'new'}
      service={service}
      source={source}
      onBack={isRenewal ? () => setSource(undefined) : undefined}
    />
  )
}

/** Renewal step zero: find the licence being renewed, by number, name or mobile. */
function PickLicence({
  licences,
  onPick,
  subtitle,
}: {
  licences: Licence[]
  onPick: (licence: Licence) => void
  subtitle: string
}) {
  const [query, setQuery] = useState('')

  const renewable = useMemo(() => renewableLicences(licences), [licences])
  const results = useMemo(() => {
    const term = normalizeTerm(query.trim())
    if (!term) return []
    return renewable.filter((l) => matchesLicence(l, term)).slice(0, 8)
  }, [renewable, query])

  return (
    <>
      <PageHeader title="ট্রেড লাইসেন্স নবায়ন" subtitle={subtitle} />
      <Card
        title="আপনার লাইসেন্স খুঁজুন"
        subtitle="লাইসেন্স নম্বর, প্রতিষ্ঠানের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন।"
      >
        <Field label="খুঁজুন" htmlFor="licence-q">
          <Input
            id="licence-q"
            value={query}
            placeholder="লাইসেন্স নং বা প্রতিষ্ঠানের নাম"
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>

        {query.trim() && results.length === 0 && (
          <EmptyState
            icon={<Search size={26} strokeWidth={1.5} />}
            title="কোনো নবায়নযোগ্য লাইসেন্স পাওয়া যায়নি।"
            hint="নম্বরটি মিলিয়ে দেখুন। যে লাইসেন্স এখনো ইস্যু হয়নি বা আগেই নবায়ন হয়েছে, সেটি এখানে আসবে না।"
          />
        )}

        {results.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {results.map((licence) => (
              <li key={licence.id}>
                <button
                  type="button"
                  onClick={() => onPick(licence)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-sm border border-rule/70 px-3 py-2.5 text-left transition-colors hover:border-forest-700/40 hover:bg-forest-50"
                >
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium">
                      {licence.business.nameBn}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {toBnDigits(licence.registerNo ?? licence.appNo)} · মেয়াদ শেষ{' '}
                      {formatDateBn(expiryOf(licence))}
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-forest-700" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

function LicenceWizard({
  service,
  source,
  onBack,
}: {
  service: NonNullable<ReturnType<typeof serviceOf>>
  source?: Licence
  onBack?: () => void
}) {
  const navigate = useNavigate()
  const createLicence = useStore((s) => s.createLicence)
  const citizen = useStore((s) => s.citizen)
  const citizenLogin = useStore((s) => s.citizenLogin)

  const [form, setForm] = useState<FormState>(() =>
    source
      ? formFromLicence(source)
      : { ...EMPTY_FORM, mobile: citizen?.mobile ?? EMPTY_FORM.mobile },
  )
  const [attached, setAttached] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState<Licence | undefined>()

  const feeLines = useMemo(() => feeLinesFor(form.typeKey), [form.typeKey])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    const next = { ...form, [key]: value }
    setForm(next)
    // Only correct errors already on screen; do not start scolding mid-typing.
    if (Object.keys(errors).length > 0) setErrors(validateForm(next))
  }

  function checkInfo(): boolean {
    const found = validateForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error('কিছু তথ্য সংশোধন করতে হবে')
      return false
    }
    return true
  }

  function next() {
    if (step === 0 && !checkInfo()) return
    setStep((s) => Math.min(s + 1, 2))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Only the review step may submit. React reuses the same DOM button between
    // steps, so advancing turns "পরবর্তী" into the submit button before the
    // browser runs that click's default action — which would submit at once.
    if (step !== 2) return
    if (!checkInfo()) {
      setStep(0)
      return
    }

    const licence = createLicence({
      channel: 'online',
      ...(source ? { kind: 'renewal' as const, renewalOf: source.id } : {}),
      ...licenceInputFrom(form),
    })
    // Filing with this number proves it is theirs, so tracking opens straight away.
    const mobile = licenceInputFrom(form).owner.mobile
    if (mobile) citizenLogin(mobile)
    setSubmitted(licence)
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={service.name}
        subtitle={
          source
            ? `লাইসেন্স নং ${toBnDigits(source.registerNo ?? source.appNo)} · ${service.section}`
            : `${service.section} · ${businessTypeOf(form.typeKey).label}`
        }
        actions={
          onBack && (
            <Button onClick={onBack}>
              <ArrowLeft size={14} />
              অন্য লাইসেন্স
            </Button>
          )
        }
      />

      <div className="mb-4 flex gap-2.5 rounded-md bg-forest-50 px-4 py-3">
        <Clock size={17} className="mt-0.5 shrink-0 text-forest-700" />
        <p className="text-[13px] leading-relaxed text-forest-800">
          নির্ধারিত সময় {charterLabel(service)}। ফি: {service.fee.label}। অনুমোদনের পর অনলাইনে ফি
          পরিশোধ করে লাইসেন্স ডাউনলোড করতে পারবেন।
        </p>
      </div>

      <div className="mb-4 rounded-md border border-rule/70 bg-white px-4 py-3.5">
        <WorkflowSteps steps={STEP_LABELS.map((label) => ({ label }))} done={step} />
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <BusinessFields
            form={form}
            errors={errors}
            set={set}
            lockedTypeNote={source ? 'গত বছরের তথ্য বসানো আছে; পরিবর্তন থাকলে ঠিক করুন।' : undefined}
          />
          <OwnerFields form={form} errors={errors} set={set} />
          <FeeCard lines={feeLines} note="অনুমোদনের পর এই ফি পরিশোধ করতে হবে।" />
        </div>
      )}

      {step === 1 && (
        <Card
          title="প্রয়োজনীয় কাগজপত্র"
          subtitle="ডেমোতে শুধু ফাইলের নাম রাখা হয়, কোনো ফাইল সংরক্ষণ করা হয় না।"
        >
          <DocumentChips docs={service.requiredDocs} attached={attached} onChange={setAttached} />
        </Card>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Card title="প্রতিষ্ঠান ও মালিক" subtitle="জমা দেওয়ার আগে একবার দেখে নিন।">
            <dl className="divide-y divide-rule/60">
              <Row label="প্রতিষ্ঠানের নাম" value={form.nameBn} />
              <Row label="ইংরেজি নাম" value={form.nameEn} />
              <Row label="ব্যবসার ধরন" value={businessTypeOf(form.typeKey).label} />
              <Row label="প্রতিষ্ঠানের প্রকৃতি" value={form.nature} />
              <Row label="ঠিকানা" value={`${form.street}, ${form.area}`} />
              <Row label="ওয়ার্ড" value={toBnDigits(form.ward)} />
              <Row label="হোল্ডিং নম্বর" value={form.holdingNo} />
              <Row label="মালিকের নাম" value={form.ownerName} />
              <Row label="পিতার নাম" value={form.fatherName} />
              <Row label="মাতার নাম" value={form.motherName} />
              <Row label="এনআইডি" value={toBnDigits(form.nid)} />
              <Row label="মোবাইল" value={toBnDigits(form.mobile)} />
            </dl>
          </Card>

          {service.requiredDocs.length > 0 && (
            <Card title="সংযুক্ত কাগজপত্র">
              <ul className="flex flex-col gap-1.5">
                {service.requiredDocs.map((doc) => (
                  <li key={doc} className="flex items-start justify-between gap-3 text-[13px]">
                    <span className="text-muted">{doc}</span>
                    <span className={attached[doc] ? 'text-right' : 'text-right text-muted'}>
                      {attached[doc] ?? 'দেওয়া হয়নি'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                কাগজপত্র না দিলেও ডেমোতে আবেদন জমা হবে, তবে পরিদর্শনের সময় মূল কাগজ দেখতে চাওয়া হবে।
              </p>
            </Card>
          )}

          <FeeCard lines={feeLines} note="অনুমোদনের পর এই ফি পরিশোধ করতে হবে।" />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {step > 0 && (
          <Button onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft size={15} />
            পেছনে
          </Button>
        )}

        {step < 2 ? (
          <Button key="next" variant="primary" onClick={next}>
            পরবর্তী
            <ArrowRight size={15} />
          </Button>
        ) : (
          <Button key="submit" type="submit" variant="primary">
            <Send size={15} />
            আবেদন জমা দিন
          </Button>
        )}

        <Button onClick={() => navigate(`/nagorik/services/${service.key}`)}>বাতিল</Button>
      </div>

      {submitted && (
        <SubmittedDialog
          licence={submitted}
          onClose={() => navigate(`/nagorik/track/${submitted.trackingNo}`)}
        />
      )}
    </form>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="max-w-[60%] text-right text-[13px] break-words">{value || '—'}</dd>
    </div>
  )
}

/** Confirms the application and, crucially, hands over the tracking number. */
function SubmittedDialog({ licence, onClose }: { licence: Licence; onClose: () => void }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(licence.trackingNo)
      toast.success('ট্র্যাকিং নম্বর কপি হয়েছে')
    } catch {
      toast.error('কপি করা যায়নি, নম্বরটি লিখে রাখুন')
    }
  }

  return (
    <Dialog open title="আবেদন জমা হয়েছে" onClose={onClose}>
      <div className="text-center">
        <p className="text-[12.5px] text-muted">আপনার ট্র্যাকিং নম্বর</p>
        <p className="mt-1 font-display text-[22px] leading-tight">{licence.trackingNo}</p>
        <Button onClick={copy} size="sm" className="mt-2">
          <Copy size={13} />
          কপি করুন
        </Button>

        <p className="mt-3 text-[12.5px] text-muted">
          আবেদন নং {toBnDigits(licence.appNo)}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          পরবর্তী ধাপ: লাইসেন্স পরিদর্শক সরেজমিনে প্রতিষ্ঠান যাচাই করবেন। অগ্রগতি ট্র্যাক পাতায় ও
          বার্তায় জানানো হবে।
        </p>
        <p className="mt-1 text-[12.5px] text-muted">এসএমএস পাঠানো হয়েছে (ডেমো)</p>
      </div>

      <div className="mt-4 flex justify-center">
        <Button onClick={onClose} variant="primary">
          অগ্রগতি দেখুন
        </Button>
      </div>
    </Dialog>
  )
}
