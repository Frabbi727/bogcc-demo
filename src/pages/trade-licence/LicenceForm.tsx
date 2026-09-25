/**
 * The form's fields, laid out the way the paper application form reads. Shared
 * by the new-application screen and the renewal screen.
 */

import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AREAS, BUSINESS_NATURES, BUSINESS_TYPES, WARDS } from '@/data/seed'
import { formatTaka, toBnDigits } from '@/lib/bn'
import type { BusinessNature, FeeLine } from '@/types'

import type { Errors, FormState } from './form'

interface FieldsProps {
  form: FormState
  errors: Errors
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  /** A renewal keeps the trade it was licensed for; only the office may change it. */
  lockedTypeNote?: string
}

export function BusinessFields({ form, errors, set, lockedTypeNote }: FieldsProps) {
  return (
    <Card title="প্রতিষ্ঠানের তথ্য" subtitle={lockedTypeNote}>
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
          <Select id="typeKey" value={form.typeKey} onChange={(e) => set('typeKey', e.target.value)}>
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
  )
}

export function OwnerFields({ form, errors, set }: FieldsProps) {
  return (
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
  )
}

/** Live fee preview, the way the cashier's rate chart sits beside the form. */
export function FeeCard({ lines, note }: { lines: readonly FeeLine[]; note?: string }) {
  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  return (
    <Card title="ফি হিসাব" subtitle="ডেমো হার" className="lg:sticky lg:top-4">
      <table className="w-full text-[13.5px]">
        <tbody>
          {lines.map((line) => (
            <tr key={line.label} className="border-b border-rule/50 last:border-0">
              <td className="py-1.5 pr-2 text-muted">{line.label}</td>
              <td className="py-1.5 text-right whitespace-nowrap">{formatTaka(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink/20">
            <td className="py-2 pr-2 font-medium">মোট</td>
            <td className="py-2 text-right font-medium whitespace-nowrap">{formatTaka(total)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 text-[12px] leading-relaxed text-muted">
        {note ??
          'ফি ব্যবসার ধরন অনুযায়ী পরিবর্তিত হয়। এগুলো প্রদর্শনীর জন্য ব্যবহৃত ডেমো হার, প্রকৃত তফসিল নয়।'}
      </p>
    </Card>
  )
}
