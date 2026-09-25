/**
 * Yearly renewal. A licence runs out on 30 June, and the shop comes back to the
 * counter with last year's licence in hand — so the form opens already filled
 * with what is on that licence and the clerk corrects only what changed.
 */

import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { businessTypeOf, feeLinesFor } from '@/data/seed'
import { isLateRenewal } from '@/data/businessTypes'
import { formatDateBn, toBnDigits } from '@/lib/bn'
import { currentFiscalYear } from '@/lib/fiscal'
import {
  expiryOf,
  matchesLicence,
  normalizeTerm,
  RENEWAL_LABEL,
  RENEWAL_TONE,
  renewableLicences,
  renewalFor,
  renewalState,
} from '@/lib/licence'
import { useStore } from '@/store/useStore'
import type { Business, Channel, Licence, Owner } from '@/types'
import {
  type Errors,
  type FormState,
  formFromLicence,
  licenceInputFrom,
  validateForm,
} from './form'
import { BusinessFields, FeeCard, OwnerFields } from './LicenceForm'

export function LicenceRenew() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const licences = useStore((s) => s.licences)
  const createLicence = useStore((s) => s.createLicence)
  const role = useStore((s) => s.session?.role)

  const source = licences.find((l) => l.id === params.get('from'))

  if (role !== 'operator') {
    return (
      <>
        <PageHeader title="ট্রেড লাইসেন্স নবায়ন" />
        <Card>
          <p className="text-[13.5px] text-muted">
            নবায়নের আবেদন কেবল <span className="font-medium text-ink">ডাটা এন্ট্রি অপারেটর</span>{' '}
            তৈরি করতে পারেন। উপরের ভূমিকা পরিবর্তনের তালিকা থেকে সেই ভূমিকা বেছে নিন।
          </p>
        </Card>
      </>
    )
  }

  if (!source) {
    return <PickLicence onPick={(id) => setParams({ from: id })} />
  }

  return (
    <RenewForm
      key={source.id}
      source={source}
      onBack={() => setParams({})}
      onDone={(id) => navigate(`/office/trade-licence/${id}`)}
      createLicence={createLicence}
      licences={licences}
    />
  )
}

/* ---------- step 1: find the licence being renewed ---------- */

function PickLicence({ onPick }: { onPick: (id: string) => void }) {
  const licences = useStore((s) => s.licences)
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = normalizeTerm(query)
    return renewableLicences(licences)
      .filter((l) => matchesLicence(l, q))
      .sort((a, b) => expiryOf(a).localeCompare(expiryOf(b)))
  }, [licences, query])

  return (
    <>
      <PageHeader
        title="ট্রেড লাইসেন্স নবায়ন"
        subtitle="যে লাইসেন্সটি নবায়ন হবে সেটি খুঁজে নিন। গত বছরের তথ্য ফরমে বসে যাবে।"
        actions={
          <Button onClick={() => history.back()}>
            <ArrowLeft size={14} />
            ফিরে যান
          </Button>
        }
      />

      <Card
        bodyClassName="p-0"
        title="নবায়নযোগ্য লাইসেন্স"
        actions={
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="প্রতিষ্ঠান, মালিক, এনআইডি, লাইসেন্স নং…"
            className="w-64"
            aria-label="নবায়নযোগ্য লাইসেন্সে অনুসন্ধান"
          />
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title="নবায়নযোগ্য কোনো লাইসেন্স নেই"
            hint="কেবল ইস্যুকৃত লাইসেন্স নবায়ন করা যায়, এবং একটি লাইসেন্স একবারই নবায়ন হবে।"
            icon={<RefreshCw size={26} strokeWidth={1.5} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-[13.5px]">
              <thead className="border-b border-rule/70 text-left text-[12.5px] text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">লাইসেন্স নং</th>
                  <th scope="col" className="px-3 py-2 font-medium">প্রতিষ্ঠান</th>
                  <th scope="col" className="px-3 py-2 font-medium">মালিক</th>
                  <th scope="col" className="px-3 py-2 font-medium">ব্যবসার ধরন</th>
                  <th scope="col" className="px-3 py-2 font-medium">মেয়াদ শেষ</th>
                  <th scope="col" className="px-3 py-2 font-medium">অবস্থা</th>
                  <th scope="col" className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const state = renewalState(licences, l)
                  return (
                    <tr key={l.id} className="border-b border-rule/50 last:border-0 hover:bg-forest-50/40">
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <Link
                          to={`/office/trade-licence/${l.id}`}
                          className="font-medium text-forest-700 hover:underline"
                        >
                          {toBnDigits(l.registerNo ?? l.appNo)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {l.business.nameBn}
                        <span className="block text-[12px] text-muted">
                          {l.business.area} · ওয়ার্ড {toBnDigits(l.business.ward)}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {l.owner.name}
                        <span className="block text-[12px] text-muted">{toBnDigits(l.owner.mobile)}</span>
                      </td>
                      <td className="px-3 py-2 align-top">{businessTypeOf(l.business.typeKey).label}</td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {formatDateBn(expiryOf(l))}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <StatusBadge label={RENEWAL_LABEL[state]} tone={RENEWAL_TONE[state]} />
                      </td>
                      <td className="px-3 py-2 text-right align-top">
                        <Button variant="primary" onClick={() => onPick(l.id)}>
                          নবায়ন করুন
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

/* ---------- step 2: the prefilled form ---------- */

interface FormProps {
  source: Licence
  licences: Licence[]
  createLicence: (input: {
    business: Business
    owner: Owner
    channel: Channel
    kind?: Licence['kind']
    renewalOf?: string
  }) => Licence
  onBack: () => void
  onDone: (id: string) => void
}

function RenewForm({ source, licences, createLicence, onBack, onDone }: FormProps) {
  const [form, setForm] = useState<FormState>(() => formFromLicence(source))
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  const fy = currentFiscalYear()
  const late = isLateRenewal(fy, new Date())
  const feeLines = feeLinesFor(form.typeKey, { renewal: true, late })
  const existing = renewalFor(licences, source)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    if (submitted) setErrors(validateForm({ ...form, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const found = validateForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error('কিছু তথ্য সংশোধন করতে হবে')
      return
    }
    if (existing) {
      toast.error('এই লাইসেন্সের নবায়ন আবেদন ইতিমধ্যে জমা আছে')
      return
    }

    const licence = createLicence({
      channel: 'office',
      kind: 'renewal',
      renewalOf: source.id,
      ...licenceInputFrom(form),
    })
    toast.success(`নবায়ন আবেদন জমা হয়েছে, আবেদন নং ${toBnDigits(licence.appNo)}`)
    onDone(licence.id)
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title="ট্রেড লাইসেন্স নবায়ন"
        subtitle={
          <>
            লাইসেন্স নং {toBnDigits(source.registerNo ?? source.appNo)} · মেয়াদ শেষ{' '}
            {formatDateBn(expiryOf(source))} · নতুন অর্থবছর {toBnDigits(fy)}
          </>
        }
        actions={
          <Button onClick={onBack}>
            <ArrowLeft size={14} />
            অন্য লাইসেন্স
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="flex flex-col gap-4">
          {existing && (
            <Card className="border-amber/40 bg-amber/5">
              <p className="flex items-start gap-2 text-[13.5px] leading-relaxed">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber" />
                <span>
                  এই লাইসেন্সের নবায়ন আবেদন{' '}
                  <Link
                    to={`/office/trade-licence/${existing.id}`}
                    className="font-medium text-forest-700 hover:underline"
                  >
                    {toBnDigits(existing.registerNo ?? existing.appNo)}
                  </Link>{' '}
                  ইতিমধ্যে জমা আছে। নতুন করে আর একটি জমা দেওয়া যাবে না।
                </span>
              </p>
            </Card>
          )}

          <Card className="bg-paper">
            <p className="text-[13.5px] leading-relaxed text-muted">
              গত বছরের লাইসেন্সের তথ্য নিচে বসানো হয়েছে। যা বদলেছে কেবল সেটুকু সংশোধন করুন —
              বাকিটা যেমন আছে তেমনই থাকবে। নবায়নে আবেদন ফরম ও বই মূল্য লাগে না।
            </p>
          </Card>

          <BusinessFields
            form={form}
            errors={errors}
            set={set}
            lockedTypeNote="ব্যবসার ধরন বদলালে ফি-ও বদলাবে।"
          />
          <OwnerFields form={form} errors={errors} set={set} />

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary" disabled={!!existing}>
              নবায়ন আবেদন জমা দিন
            </Button>
            <Button onClick={() => onDone(source.id)}>বাতিল</Button>
          </div>
        </div>

        <FeeCard
          lines={feeLines}
          note={
            late
              ? '৩০ সেপ্টেম্বরের পরে নবায়নে ১০% বিলম্ব ফি যুক্ত হয়েছে (ডেমো হার)।'
              : '৩০ সেপ্টেম্বরের মধ্যে নবায়ন করলে বিলম্ব ফি লাগে না। এগুলো ডেমো হার।'
          }
        />
      </div>
    </form>
  )
}
