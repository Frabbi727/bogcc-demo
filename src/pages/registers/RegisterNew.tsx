import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { toBnDigits } from '@/lib/bn'
import { applicantFrom, getRegister } from '@/registers'
import { useStore } from '@/store/useStore'
import { bnToEnDigits } from '@/lib/bn'
import type { FieldValue } from '@/types'
import { fieldValueFrom, validateFormField } from '@/pages/registers/values'
import { FieldControl } from './fields'

export function RegisterNew() {
  const { key } = useParams()
  const navigate = useNavigate()
  const config = getRegister(key)
  const role = useStore((s) => s.session?.role)
  const createEntry = useStore((s) => s.createEntry)
  const staffName = useStore((s) => s.session?.name ?? '')

  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!config) return <Navigate to="/" replace />

  const allowed = role ? config.createRoles.includes(role) : false

  /** Staff fields belong to a later step, so the intake form does not ask for them. */
  const laterFields = new Set(config.fields.filter((f) => f.staffOnly).map((f) => f.key))
  const formFields = config.fields.filter((f) => !f.staffOnly)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found: Record<string, string> = {}
    for (const field of formFields) {
      const message = validateFormField(field, values[field.key] ?? '')
      if (message) found[field.key] = message
    }
    setErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error('কিছু তথ্য সংশোধন করতে হবে')
      return
    }

    const data: Record<string, FieldValue> = {}
    for (const field of config!.fields) {
      data[field.key] = field.staffOnly ? '' : fieldValueFrom(field, values[field.key] ?? '')
    }

    // The record needs an applicant even when the register does not collect one:
    // a trip log is "filed" by the member of staff writing the line.
    const applicant = applicantFrom(config!, data)
    const wardValue = Number(bnToEnDigits(String(data.ward ?? '')))
    const entry = createEntry(config!.key, data, {
      name: applicant?.name || staffName,
      mobile: applicant?.mobile || '',
      ward: Number.isFinite(wardValue) ? wardValue : 0,
      channel: 'office',
    })
    if (!entry) return
    toast.success(`এন্ট্রি হয়েছে, ক্রমিক নং ${toBnDigits(entry.serial ?? 0)}`)
    navigate(`/office/registers/${config!.key}/${entry.id}`)
  }

  if (!allowed) {
    return (
      <>
        <PageHeader title={`নতুন এন্ট্রি — ${config.title}`} />
        <Card>
          <p className="text-[13.5px] text-muted">
            এই রেজিস্টারে এন্ট্রি করার অনুমতি নেই। ভূমিকা পরিবর্তন করে চেষ্টা করুন।
          </p>
        </Card>
      </>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={`নতুন এন্ট্রি — ${config.title}`}
        subtitle={`${config.section} · এন্ট্রি করলেই ক্রমিক নং বসে যাবে, ঠিক যেভাবে খাতায় নতুন লাইন লেখা হয়।`}
      />

      <Card title="এন্ট্রির তথ্য" className="max-w-3xl">
        <div className="grid gap-3.5 sm:grid-cols-2">
          {formFields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              htmlFor={`f-${field.key}`}
              required={field.required}
              error={errors[field.key]}
              className={field.type === 'textarea' ? 'sm:col-span-full' : undefined}
            >
              <FieldControl
                field={field}
                value={values[field.key] ?? ''}
                invalid={!!errors[field.key]}
                onChange={(value) => {
                  setValues((v) => ({ ...v, [field.key]: value }))
                  if (errors[field.key]) {
                    setErrors((e) => ({ ...e, [field.key]: validateFormField(field, value) ?? '' }))
                  }
                }}
              />
            </Field>
          ))}
        </div>

        {laterFields.size > 0 && (
          <p className="mt-3.5 rounded-sm border border-rule/70 bg-paper px-3 py-2 text-[12.5px] leading-relaxed text-muted">
            পরবর্তী ধাপে যাওয়ার সময় যে ঘরগুলো পূরণ করতে হবে, সেগুলো এখন চাওয়া হচ্ছে না —
            কাগজের খাতাতেও ওই কলামগুলো পরে লেখা হয়।
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            এন্ট্রি সংরক্ষণ করুন
          </Button>
          <Button onClick={() => navigate(`/office/registers/${config!.key}`)}>বাতিল</Button>
        </div>
      </Card>
    </form>
  )
}
