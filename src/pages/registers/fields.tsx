import { ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { WARDS } from '@/data/seed'
import { bnToEnDigits, toBnDigits } from '@/lib/bn'
import { cn } from '@/lib/cn'
import { MAX_EDGE, compressImage } from '@/lib/image'
import { EMPTY_HEIR, parseHeirs, serialiseHeirs } from '@/pages/registers/values'
import type { Heir } from '@/types'
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

  if (field.type === 'photo') {
    return <PhotoControl id={id} value={value} invalid={invalid} onChange={onChange} />
  }

  if (field.type === 'heirs') {
    return <HeirsControl value={value} invalid={invalid} onChange={onChange} />
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

/**
 * Photo field. The picture is scaled and re-encoded by `compressImage` before it
 * becomes the field value, because the whole demo lives in localStorage and a
 * phone camera file would blow that budget on its own. The value is the JPEG data
 * URL, so it travels through `createEntry` like any other string.
 */
function PhotoControl({
  id,
  value,
  invalid,
  onChange,
}: {
  id: string
  value: string
  invalid?: boolean
  onChange: (value: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(undefined)
    try {
      const image = await compressImage(file)
      onChange(image.dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ছবিটি নেওয়া যায়নি।')
    } finally {
      setBusy(false)
      // Let the same file be chosen again after a failure.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      {value ? (
        <div className="flex items-start gap-3">
          <img
            src={value}
            alt="আপলোড করা ছবি"
            className="size-20 rounded-sm border border-rule object-cover"
          />
          <div className="flex flex-col items-start gap-1.5">
            <p className="text-[12.5px] text-muted">ছবি যুক্ত হয়েছে</p>
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
                বদলান
              </Button>
              <Button size="sm" variant="danger" onClick={() => onChange('')} disabled={busy}>
                <X size={13} />
                সরান
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant={invalid ? 'danger' : 'secondary'}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="self-start"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          {busy ? 'ছবি প্রস্তুত হচ্ছে…' : 'ছবি যুক্ত করুন'}
        </Button>
      )}

      <p className={cn('text-[12px]', error ? 'text-stamp' : 'text-muted')}>
        {error ??
          `ছবি তুলুন বা গ্যালারি থেকে বাছুন। সংরক্ষণের আগে ছবিটি ছোট করা হয় (সর্বোচ্চ ${toBnDigits(MAX_EDGE)} পিক্সেল)।`}
      </p>
    </div>
  )
}

/**
 * The heirs table for the warish certificate: one row per heir. The value is the
 * JSON the `heirs` helpers round-trip, so the surrounding form keeps its plain
 * string state.
 */
function HeirsControl({
  value,
  invalid,
  onChange,
}: {
  value: string
  invalid?: boolean
  onChange: (value: string) => void
}) {
  // Rows live here, not in the field value: a freshly added row is still blank,
  // and blank rows are exactly what the stored value must not contain. Keeping
  // both lets the citizen see an empty row to type into while the entry stays clean.
  const [rows, setRows] = useState<Heir[]>(() => {
    const parsed = parseHeirs(value)
    return parsed.length ? parsed : [{ ...EMPTY_HEIR }]
  })

  function write(next: Heir[]) {
    const rowsToShow = next.length ? next : [{ ...EMPTY_HEIR }]
    setRows(rowsToShow)
    onChange(serialiseHeirs(rowsToShow.filter(isFilled)))
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {rows.map((heir, i) => (
          // eslint-disable-next-line react/no-array-index-key -- rows have no id; position is the identity
          <li
            key={i}
            className={cn(
              'grid gap-2 rounded-sm border px-2.5 py-2 sm:grid-cols-[1fr_1fr_5rem_auto]',
              invalid ? 'border-stamp' : 'border-rule',
            )}
          >
            <Input
              aria-label={`${toBnDigits(i + 1)} নম্বর ওয়ারিশের নাম`}
              placeholder="নাম"
              value={heir.name}
              onChange={(e) => write(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
            />
            <Input
              aria-label={`${toBnDigits(i + 1)} নম্বর ওয়ারিশের সম্পর্ক`}
              placeholder="সম্পর্ক, যেমন পুত্র"
              value={heir.relation}
              onChange={(e) =>
                write(rows.map((r, j) => (j === i ? { ...r, relation: e.target.value } : r)))
              }
            />
            <Input
              aria-label={`${toBnDigits(i + 1)} নম্বর ওয়ারিশের বয়স`}
              placeholder="বয়স"
              inputMode="numeric"
              value={heir.age ? String(heir.age) : ''}
              onChange={(e) => {
                const age = Number(bnToEnDigits(e.target.value).replace(/\D/g, '') || 0)
                write(rows.map((r, j) => (j === i ? { ...r, age } : r)))
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              aria-label={`${toBnDigits(i + 1)} নম্বর সারি মুছুন`}
              disabled={rows.length === 1}
              onClick={() => write(rows.filter((_, j) => j !== i))}
            >
              <Trash2 size={14} />
            </Button>
          </li>
        ))}
      </ul>

      <Button
        size="sm"
        className="self-start"
        onClick={() => write([...rows, { ...EMPTY_HEIR }])}
      >
        <Plus size={14} />
        আরেকজন যোগ করুন
      </Button>
    </div>
  )
}

/** A row the citizen has actually started filling in. */
function isFilled(heir: Heir): boolean {
  return !!heir.name.trim() || !!heir.relation.trim() || heir.age > 0
}
