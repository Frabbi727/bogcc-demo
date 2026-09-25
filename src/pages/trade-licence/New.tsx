import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { feeLinesFor } from '@/data/seed'
import { toBnDigits } from '@/lib/bn'
import { currentFiscalYear } from '@/lib/fiscal'
import { findDuplicate } from '@/lib/licence'
import { useStore } from '@/store/useStore'
import {
  EMPTY_FORM,
  type Errors,
  type FormState,
  licenceInputFrom,
  validateForm,
} from './form'
import { BusinessFields, FeeCard, OwnerFields } from './LicenceForm'

export function LicenceNew() {
  const navigate = useNavigate()
  const createLicence = useStore((s) => s.createLicence)
  const licences = useStore((s) => s.licences)
  const role = useStore((s) => s.session?.role)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  const feeLines = useMemo(() => feeLinesFor(form.typeKey), [form.typeKey])

  // Warn, do not block: two shops can genuinely share a name, and only the
  // counter clerk can tell whether this is the same one being filed twice.
  const duplicate = useMemo(
    () =>
      findDuplicate(licences, {
        nid: form.nid,
        nameBn: form.nameBn,
        fiscalYear: currentFiscalYear(),
      }),
    [licences, form.nid, form.nameBn],
  )

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

    const licence = createLicence({ channel: 'office', ...licenceInputFrom(form) })
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
          {duplicate && (
            <Card className="border-amber/40 bg-amber/5">
              <p className="flex items-start gap-2 text-[13.5px] leading-relaxed">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber" />
                <span>
                  এই এনআইডি ও প্রতিষ্ঠানের নামে চলতি অর্থবছরে একটি আবেদন{' '}
                  <Link
                    to={`/office/trade-licence/${duplicate.id}`}
                    className="font-medium text-forest-700 hover:underline"
                  >
                    {toBnDigits(duplicate.registerNo ?? duplicate.appNo)}
                  </Link>{' '}
                  ইতিমধ্যে রয়েছে। নবায়ন হলে{' '}
                  <Link to="/office/trade-licence/renew" className="font-medium text-forest-700 hover:underline">
                    নবায়ন ফরম
                  </Link>{' '}
                  ব্যবহার করুন। একই দোকানের জন্য দুটি লাইন যেন খাতায় না ওঠে।
                </span>
              </p>
            </Card>
          )}

          <BusinessFields form={form} errors={errors} set={set} />
          <OwnerFields form={form} errors={errors} set={set} />

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary">
              আবেদন জমা দিন
            </Button>
            <Button onClick={() => navigate('/office/trade-licence')}>বাতিল</Button>
          </div>
        </div>

        <FeeCard lines={feeLines} />
      </div>
    </form>
  )
}
