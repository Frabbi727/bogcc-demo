import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AREAS, BUSINESS_NATURES, BUSINESS_TYPES, WARDS, feeLinesFor, feeTotalOf } from '@/data/seed'
import { bnToEnDigits, formatTaka, toBnDigits } from '@/lib/bn'
import { useStore } from '@/store/useStore'
import type { BusinessNature } from '@/types'

interface FormState {
  nameBn: string
  nameEn: string
  typeKey: string
  nature: BusinessNature
  street: string
  area: string
  ward: string
  holdingNo: string
  ownerName: string
  fatherName: string
  motherName: string
  nid: string
  mobile: string
}

const EMPTY: FormState = {
  nameBn: '',
  nameEn: '',
  typeKey: BUSINESS_TYPES[0].key,
  nature: 'একক',
  street: '',
  area: AREAS[0],
  ward: '',
  holdingNo: '',
  ownerName: '',
  fatherName: '',
  motherName: '',
  nid: '',
  mobile: '',
}

type Errors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): Errors {
  const e: Errors = {}
  if (!form.nameBn.trim()) e.nameBn = 'প্রতিষ্ঠানের বাংলা নাম লিখুন।'
  if (!form.nameEn.trim()) e.nameEn = 'প্রতিষ্ঠানের ইংরেজি নাম লিখুন।'
  else if (!/^[A-Za-z0-9\s.,&()'/-]+$/.test(form.nameEn.trim()))
    e.nameEn = 'ইংরেজি নাম কেবল ইংরেজি অক্ষরে লিখুন।'
  if (!form.street.trim()) e.street = 'রাস্তা বা মহল্লার নাম লিখুন।'
  if (!form.holdingNo.trim()) e.holdingNo = 'হোল্ডিং নম্বর লিখুন।'

  const ward = Number(bnToEnDigits(form.ward))
  if (!form.ward.trim()) e.ward = 'ওয়ার্ড নির্বাচন করুন।'
  else if (!Number.isInteger(ward) || ward < 1 || ward > 21) e.ward = 'ওয়ার্ড ১ থেকে ২১ এর মধ্যে হতে হবে।'

  if (!form.ownerName.trim()) e.ownerName = 'মালিকের নাম লিখুন।'
  if (!form.fatherName.trim()) e.fatherName = 'পিতার নাম লিখুন।'
  if (!form.motherName.trim()) e.motherName = 'মাতার নাম লিখুন।'

  const nid = bnToEnDigits(form.nid).replace(/\s/g, '')
  if (!nid) e.nid = 'জাতীয় পরিচয়পত্র নম্বর লিখুন।'
  else if (!/^\d+$/.test(nid)) e.nid = 'এনআইডি নম্বরে কেবল সংখ্যা থাকবে।'
  else if (![10, 13, 17].includes(nid.length))
    e.nid = 'এনআইডি নম্বর ১০, ১৩ অথবা ১৭ সংখ্যার হতে হবে।'

  const mobile = bnToEnDigits(form.mobile).replace(/\s|-/g, '')
  if (!mobile) e.mobile = 'মোবাইল নম্বর লিখুন।'
  else if (!/^01\d{9}$/.test(mobile)) e.mobile = 'মোবাইল নম্বর ০১ দিয়ে শুরু হয়ে ১১ সংখ্যার হতে হবে।'

  return e
}

export function LicenceNew() {
  const navigate = useNavigate()
  const createLicence = useStore((s) => s.createLicence)
  const role = useStore((s) => s.session?.role)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  const feeLines = useMemo(() => feeLinesFor(form.typeKey), [form.typeKey])
  const feeTotal = feeTotalOf(feeLines)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    if (submitted) setErrors(validate({ ...form, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error('কিছু তথ্য সংশোধন করতে হবে')
      return
    }

    const ward = Number(bnToEnDigits(form.ward))
    const licence = createLicence({
      channel: 'office',
      business: {
        nameBn: form.nameBn.trim(),
        nameEn: form.nameEn.trim(),
        typeKey: form.typeKey,
        nature: form.nature,
        address: `${form.street.trim()}, ${form.area}, হোল্ডিং ${form.holdingNo.trim()}, ওয়ার্ড ${ward}, বগুড়া`,
        area: form.area,
        ward,
        holdingNo: form.holdingNo.trim(),
      },
      owner: {
        name: form.ownerName.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        nid: bnToEnDigits(form.nid).replace(/\s/g, ''),
        mobile: bnToEnDigits(form.mobile).replace(/\s|-/g, ''),
      },
    })
    toast.success(`আবেদন জমা হয়েছে, আবেদন নং ${toBnDigits(licence.appNo)}`)
    navigate(`/office/trade-licence/${licence.id}`)
  }

  if (role !== 'operator') {
    return (
      <>
        <PageHeader title="নতুন ট্রেড লাইসেন্স আবেদন" />
        <Card>
          <p className="text-[13.5px] text-muted">
            নতুন আবেদন কেবল <span className="font-medium text-ink">ডাটা এন্ট্রি অপারেটর</span> তৈরি
            করতে পারেন। উপরের ভূমিকা পরিবর্তনের তালিকা থেকে সেই ভূমিকা বেছে নিন।
          </p>
        </Card>
      </>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title="নতুন ট্রেড লাইসেন্স আবেদন"
        subtitle="কাগজের আবেদন ফরমের সব ঘর এখানে পূরণ করুন। অনুমোদনের সময় রেজিস্টার ক্রমিক নং বসবে।"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <Card title="প্রতিষ্ঠানের তথ্য">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="প্রতিষ্ঠানের নাম (বাংলা)" htmlFor="nameBn" required error={errors.nameBn}>
                <Input
                  id="nameBn"
                  value={form.nameBn}
                  invalid={!!errors.nameBn}
                  onChange={(e) => set('nameBn', e.target.value)}
                  placeholder="যেমন: মেসার্স রহমান স্টোর"
                />
              </Field>
              <Field label="প্রতিষ্ঠানের নাম (ইংরেজি)" htmlFor="nameEn" required error={errors.nameEn}>
                <Input
                  id="nameEn"
                  value={form.nameEn}
                  invalid={!!errors.nameEn}
                  onChange={(e) => set('nameEn', e.target.value)}
                  placeholder="Messrs Rahman Store"
                />
              </Field>
              <Field label="ব্যবসার ধরন" htmlFor="typeKey" required>
                <Select
                  id="typeKey"
                  value={form.typeKey}
                  onChange={(e) => set('typeKey', e.target.value)}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="ব্যবসার প্রকৃতি" htmlFor="nature" required>
                <Select
                  id="nature"
                  value={form.nature}
                  onChange={(e) => set('nature', e.target.value as BusinessNature)}
                >
                  {BUSINESS_NATURES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="রাস্তা / মহল্লার ঠিকানা" htmlFor="street" required error={errors.street}>
                <Input
                  id="street"
                  value={form.street}
                  invalid={!!errors.street}
                  onChange={(e) => set('street', e.target.value)}
                  placeholder="যেমন: স্টেশন রোড"
                />
              </Field>
              <Field label="এলাকা" htmlFor="area" required>
                <Select id="area" value={form.area} onChange={(e) => set('area', e.target.value)}>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="ওয়ার্ড" htmlFor="ward" required error={errors.ward}>
                <Select
                  id="ward"
                  value={form.ward}
                  invalid={!!errors.ward}
                  onChange={(e) => set('ward', e.target.value)}
                >
                  <option value="">নির্বাচন করুন</option>
                  {WARDS.map((w) => (
                    <option key={w} value={String(w)}>
                      ওয়ার্ড {toBnDigits(w)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="হোল্ডিং নম্বর" htmlFor="holdingNo" required error={errors.holdingNo}>
                <Input
                  id="holdingNo"
                  value={form.holdingNo}
                  invalid={!!errors.holdingNo}
                  onChange={(e) => set('holdingNo', e.target.value)}
                  placeholder="যেমন: ১১২/ক"
                />
              </Field>
            </div>
          </Card>

          <Card title="মালিকের তথ্য">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="মালিকের নাম" htmlFor="ownerName" required error={errors.ownerName}>
                <Input
                  id="ownerName"
                  value={form.ownerName}
                  invalid={!!errors.ownerName}
                  onChange={(e) => set('ownerName', e.target.value)}
                />
              </Field>
              <Field label="পিতার নাম" htmlFor="fatherName" required error={errors.fatherName}>
                <Input
                  id="fatherName"
                  value={form.fatherName}
                  invalid={!!errors.fatherName}
                  onChange={(e) => set('fatherName', e.target.value)}
                />
              </Field>
              <Field label="মাতার নাম" htmlFor="motherName" required error={errors.motherName}>
                <Input
                  id="motherName"
                  value={form.motherName}
                  invalid={!!errors.motherName}
                  onChange={(e) => set('motherName', e.target.value)}
                />
              </Field>
              <Field
                label="জাতীয় পরিচয়পত্র নং"
                htmlFor="nid"
                required
                error={errors.nid}
                hint="১০, ১৩ অথবা ১৭ সংখ্যা। বাংলা সংখ্যাও লেখা যাবে।"
              >
                <Input
                  id="nid"
                  inputMode="numeric"
                  value={form.nid}
                  invalid={!!errors.nid}
                  onChange={(e) => set('nid', e.target.value)}
                />
              </Field>
              <Field
                label="মোবাইল নম্বর"
                htmlFor="mobile"
                required
                error={errors.mobile}
                hint="০১ দিয়ে শুরু, মোট ১১ সংখ্যা।"
              >
                <Input
                  id="mobile"
                  inputMode="numeric"
                  value={form.mobile}
                  invalid={!!errors.mobile}
                  onChange={(e) => set('mobile', e.target.value)}
                  placeholder="০১৭XXXXXXXX"
                />
              </Field>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary">
              আবেদন জমা দিন
            </Button>
            <Button onClick={() => navigate('/office/trade-licence')}>বাতিল</Button>
          </div>
        </div>

        {/* Live fee preview, the way the cashier's rate chart sits beside the form. */}
        <Card title="ফি হিসাব" subtitle="ডেমো হার" className="lg:sticky lg:top-4">
          <table className="w-full text-[13.5px]">
            <tbody>
              {feeLines.map((line) => (
                <tr key={line.label} className="border-b border-rule/50 last:border-0">
                  <td className="py-1.5 pr-2 text-muted">{line.label}</td>
                  <td className="py-1.5 text-right whitespace-nowrap">{formatTaka(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink/20">
                <td className="py-2 pr-2 font-medium">মোট</td>
                <td className="py-2 text-right font-medium whitespace-nowrap">{formatTaka(feeTotal)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            ফি ব্যবসার ধরন অনুযায়ী পরিবর্তিত হয়। এগুলো প্রদর্শনীর জন্য ব্যবহৃত ডেমো হার, প্রকৃত
            তফসিল নয়।
          </p>
        </Card>
      </div>
    </form>
  )
}
