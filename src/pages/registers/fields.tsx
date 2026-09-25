import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { WARDS } from '@/data/seed'
import { toBnDigits } from '@/lib/bn'
import type { RegisterField } from '@/registers/types'

/** Renders one register field as a form control, driven by its `type`. */
export function FieldControl({
  field,
  value,
  invalid,
  onChange,
}: {
  field: RegisterField
  value: string
  invalid?: boolean
  onChange: (value: string) => void
}) {
  const id = `f-${field.key}`

  if (field.type === 'select') {
    return (
      <Select id={id} value={value} invalid={invalid} onChange={(e) => onChange(e.target.value)}>
        <option value="">নির্বাচন করুন</option>
        {(field.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    )
  }

  if (field.type === 'ward') {
    return (
      <Select id={id} value={value} invalid={invalid} onChange={(e) => onChange(e.target.value)}>
        <option value="">নির্বাচন করুন</option>
        {WARDS.map((w) => (
          <option key={w} value={String(w)}>
            ওয়ার্ড {toBnDigits(w)}
          </option>
        ))}
      </Select>
    )
  }

  if (field.type === 'textarea') {
    return (
      <Textarea id={id} value={value} invalid={invalid} onChange={(e) => onChange(e.target.value)} />
    )
  }

  if (field.type === 'date') {
    return (
      <Input id={id} type="date" value={value} invalid={invalid} onChange={(e) => onChange(e.target.value)} />
    )
  }

  return (
    <Input
      id={id}
      inputMode={field.type === 'number' || field.type === 'phone' ? 'numeric' : undefined}
      value={value}
      invalid={invalid}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
