import { ArrowLeft, ArrowRight, Clock, Copy, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DocumentChips } from '@/components/DocumentChips'
import { PageHeader } from '@/components/PageHeader'
import { WorkflowSteps } from '@/components/WorkflowSteps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { LinkButton } from '@/components/ui/LinkButton'
import { roleTitle } from '@/data/users'
import { serviceOf } from '@/data/services'
import { bnToEnDigits } from '@/lib/bn'
import { displayField } from '@/lib/registerFields'
import { applicantFrom, citizenFields, nextStep, registerForService } from '@/registers'
import { FieldControl } from '@/pages/registers/fields'
import { fieldValueFrom, validateFormField } from '@/pages/registers/values'
import { useStore } from '@/store/useStore'
import type { RegisterField } from '@/registers/types'
import type { FieldValue, RegisterEntry } from '@/types'

import { charterLabel } from './charter'

/**
 * The citizen's online application, as a four-step wizard: তথ্য → কাগজপত্র ও ছবি
 * → যাচাই → জমা (spec §13.3).
 *
 * The fields come from the register config (`citizenInput`), so a new register
 * gets an application form with no work here. Validation runs per step, which is
 * the point of the split — an error appears next to the field the citizen is
 * looking at rather than at the bottom of one long page.
 */

const STEP_LABELS = ['তথ্য', 'কাগজপত্র ও ছবি', 'যাচাই', 'জমা']

export function CitizenApply() {
  const { serviceKey } = useParams()
  const navigate = useNavigate()
  const service = serviceOf(serviceKey)
  const config = registerForService(serviceKey)

  const citizen = useStore((s) => s.citizen)
  const createEntry = useStore((s) => s.createEntry)
  const citizenLogin = useStore((s) => s.citizenLogin)

  const fields = useMemo(() => (config ? citizenFields(config) : []), [config])
  // Photos belong with the documents, everything else is the info step.
  const infoFields = useMemo(() => fields.filter((f) => f.type !== 'photo'), [fields])
  const photoFields = useMemo(() => fields.filter((f) => f.type === 'photo'), [fields])

  // The applicant's own number is already known when they are signed in, so they
  // do not retype it.
  const [values, setValues] = useState<Record<string, string>>(() =>
    config?.applicantFields && citizen ? { [config.applicantFields.mobile]: citizen.mobile } : {},
  )
  const [attached, setAttached] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState<RegisterEntry | undefined>()

  if (!service || !config) {
    return (
      <>
        <PageHeader title="আবেদন" />
        <EmptyState
          title="এই সেবার অনলাইন আবেদন এখন সম্ভব নয়"
          hint="নাগরিক সনদ থেকে সেবাটি দেখে নিন — কিছু আবেদন সরাসরি অফিসে জমা দিতে হয়।"
          action={<LinkButton to="/nagorik/services">নাগরিক সনদ দেখুন</LinkButton>}
        />
      </>
    )
  }

  /** Validates the fields on one step and shows their errors. Returns true if clean. */
  function checkStep(which: number): boolean {
    const toCheck = which === 0 ? infoFields : which === 1 ? photoFields : []
    const found: Record<string, string> = {}
    for (const field of toCheck) {
      const message = validateFormField(field, values[field.key] ?? '')
      if (message) found[field.key] = message
    }
    setErrors((e) => ({ ...e, ...found, ...clearedFor(toCheck, found) }))
    if (Object.keys(found).length > 0) {
      toast.error('কিছু তথ্য বাকি আছে — লাল লেখাগুলো দেখুন')
      return false
    }
    return true
  }

  function next() {
    if (!checkStep(step)) return
    setStep((s) => Math.min(s + 1, 2))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!config || !service) return
    // Only the review step may submit. React reuses the same DOM button between
    // steps, so advancing turns "পরবর্তী" into the submit button before the
    // browser runs that click's default action — which would submit at once.
    if (step !== 2) return
    // Re-check everything: a citizen can step back and empty a field.
    if (!checkStep(0)) {
      setStep(0)
      return
    }
    if (!checkStep(1)) {
      setStep(1)
      return
    }

    // Staff fields and office-only fields stay empty: they belong to a later step,
    // exactly as those columns stay blank in the paper book until then.
    const citizenKeys = new Set(fields.map((f) => f.key))
    const data: Record<string, FieldValue> = {}
    for (const field of config.fields) {
      data[field.key] = citizenKeys.has(field.key)
        ? fieldValueFrom(field, values[field.key] ?? '')
        : ''
    }

    const applicant = applicantFrom(config, data)
    const mobile = applicant?.mobile ?? citizen?.mobile ?? ''
    const wardValue = Number(bnToEnDigits(String(data.ward ?? '')))
    const entry = createEntry(config.key, data, {
      name: applicant?.name ?? '',
      mobile,
      ward: Number.isFinite(wardValue) ? wardValue : 0,
      channel: 'online',
    })
    if (!entry) {
      toast.error('আবেদন জমা হয়নি, আবার চেষ্টা করুন')
      return
    }
    // They just proved the number is theirs by filing with it, so the tracking
    // page opens straight away rather than challenging them for it again.
    if (mobile) citizenLogin(mobile)
    setSubmitted(entry)
  }

  const nextActorStep = submitted ? nextStep(config, submitted.status) : undefined
  const hasDocStep = photoFields.length > 0 || service.requiredDocs.length > 0

  return (
    <form onSubmit={onSubmit}>
      <PageHeader title={service.name} subtitle={`${config.title} · ${service.section}`} />

      <div className="mb-4 flex gap-2.5 rounded-md bg-forest-50 px-4 py-3">
        <Clock size={17} className="mt-0.5 shrink-0 text-forest-700" />
        <p className="text-[13px] leading-relaxed text-forest-800">
          {service.charterDays === 0
            ? `এই সেবা একই দিনে সম্পন্ন হয়। ফি: ${service.fee.label}`
            : `নির্ধারিত সময় ${charterLabel(service)}। ফি: ${service.fee.label}`}
        </p>
      </div>

      <div className="mb-4 rounded-md border border-rule/70 bg-white px-4 py-3.5">
        <WorkflowSteps steps={STEP_LABELS.map((label) => ({ label }))} done={step} />
      </div>

      {step === 0 && (
        <Card title="আবেদনের তথ্য">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {infoFields.map((field) => (
              <FieldBlock
                key={field.key}
                field={field}
                value={values[field.key] ?? ''}
                error={errors[field.key]}
                onChange={(value) => {
                  setValues((v) => ({ ...v, [field.key]: value }))
                  if (errors[field.key]) {
                    setErrors((e) => ({
                      ...e,
                      [field.key]: validateFormField(field, value) ?? '',
                    }))
                  }
                }}
              />
            ))}
          </div>
        </Card>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          {photoFields.length > 0 && (
            <Card title="ছবি">
              <div className="flex flex-col gap-3.5">
                {photoFields.map((field) => (
                  <FieldBlock
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? ''}
                    error={errors[field.key]}
                    onChange={(value) => {
                      setValues((v) => ({ ...v, [field.key]: value }))
                      if (errors[field.key]) {
                        setErrors((e) => ({
                          ...e,
                          [field.key]: validateFormField(field, value) ?? '',
                        }))
                      }
                    }}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card
            title="প্রয়োজনীয় কাগজপত্র"
            subtitle="ডেমোতে শুধু ফাইলের নাম রাখা হয়, কোনো ফাইল সংরক্ষণ করা হয় না।"
          >
            {service.requiredDocs.length > 0 ? (
              <DocumentChips
                docs={service.requiredDocs}
                attached={attached}
                onChange={setAttached}
              />
            ) : (
              <p className="text-[13px] text-muted">এই সেবার জন্য আলাদা কাগজপত্র লাগে না।</p>
            )}
          </Card>

          {!hasDocStep && (
            <Card>
              <p className="text-[13px] text-muted">এই ধাপে কিছু দেওয়ার প্রয়োজন নেই।</p>
            </Card>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Card title="আপনার দেওয়া তথ্য" subtitle="জমা দেওয়ার আগে একবার দেখে নিন।">
            <dl className="divide-y divide-rule/60">
              {fields.map((field) => (
                <div key={field.key} className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[12.5px] text-muted">{field.label}</dt>
                  <dd className="max-w-[60%] text-right text-[13px] break-words">
                    {displayField(field, fieldValueFrom(field, values[field.key] ?? ''))}
                  </dd>
                </div>
              ))}
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
                কাগজপত্র না দিলেও ডেমোতে আবেদন জমা হবে, তবে অফিস যাচাইয়ের সময় মূল কাগজ দেখতে চাইবে।
              </p>
            </Card>
          )}
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
          entry={submitted}
          nextActor={nextActorStep?.actors[0] ? roleTitle(nextActorStep.actors[0]) : undefined}
          onClose={() => navigate(`/nagorik/track/${submitted.trackingNo}`)}
        />
      )}
    </form>
  )
}

/** One labelled control, wide when the input needs the room. */
function FieldBlock({
  field,
  value,
  error,
  onChange,
}: {
  field: RegisterField
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <Field
      label={field.label}
      htmlFor={`f-${field.key}`}
      required={field.required}
      error={error}
      hint={field.hint}
      className={
        field.type === 'textarea' || field.type === 'photo' || field.type === 'heirs'
          ? 'sm:col-span-full'
          : undefined
      }
    >
      <FieldControl field={field} value={value} invalid={!!error} onChange={onChange} />
    </Field>
  )
}

/** Blanks the stale errors of fields that now validate, so they stop showing. */
function clearedFor(
  fields: RegisterField[],
  found: Record<string, string>,
): Record<string, string> {
  const cleared: Record<string, string> = {}
  for (const field of fields) {
    if (!found[field.key]) cleared[field.key] = ''
  }
  return cleared
}

/** Confirms the application and, crucially, hands over the tracking number. */
function SubmittedDialog({
  entry,
  nextActor,
  onClose,
}: {
  entry: RegisterEntry
  nextActor?: string
  onClose: () => void
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(entry.trackingNo)
      toast.success('ট্র্যাকিং নম্বর কপি হয়েছে')
    } catch {
      toast.error('কপি করা যায়নি, নম্বরটি লিখে রাখুন')
    }
  }

  return (
    <Dialog open title="আবেদন জমা হয়েছে" onClose={onClose}>
      <div className="text-center">
        <p className="text-[12.5px] text-muted">আপনার ট্র্যাকিং নম্বর</p>
        <p className="mt-1 font-display text-[22px] leading-tight">{entry.trackingNo}</p>
        <Button onClick={copy} size="sm" className="mt-2">
          <Copy size={13} />
          কপি করুন
        </Button>

        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          {nextActor
            ? `পরবর্তী ধাপ: ${nextActor} দেখবেন। অগ্রগতি ট্র্যাক পাতায় ও বার্তায় জানানো হবে।`
            : 'অগ্রগতি ট্র্যাক পাতায় দেখা যাবে।'}
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
