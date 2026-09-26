import { ArrowLeft, BookOpen, Printer, Receipt as ReceiptIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataList } from '@/components/DataList'
import { PageHeader } from '@/components/PageHeader'
import { RoleHandoff } from '@/components/RoleHandoff'
import { SlaBadge } from '@/components/SlaBadge'
import { Stamp } from '@/components/Stamp'
import { StatusBadge } from '@/components/StatusBadge'
import { Timeline } from '@/components/Timeline'
import { WorkflowSteps } from '@/components/WorkflowSteps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { PAYMENT_MODES } from '@/data/seed'
import { formatDateBn, formatDateTimeBn, formatTaka, toBnDigits } from '@/lib/bn'
import { displayField } from '@/lib/registerFields'
import { fieldValueFrom, validateFormField } from '@/pages/registers/values'
import { entryStatusTone } from '@/lib/status'
import { getRegister } from '@/registers'
import { useStore } from '@/store/useStore'
import type { FieldValue, PaymentMode, Role } from '@/types'
import { FieldControl } from './fields'

export function RegisterDetail() {
  const { key, id } = useParams()
  const navigate = useNavigate()
  const config = getRegister(key)
  const entry = useStore((s) => s.entries.find((e) => e.id === id))
  const allAudit = useStore((s) => s.audit)
  const role = useStore((s) => s.session?.role)
  const currentWard = useStore((s) => s.session?.role === 'councillor' ? 5 : undefined)
  const advanceEntry = useStore((s) => s.advanceEntry)
  const cancelEntry = useStore((s) => s.cancelEntry)
  const collectAtCounter = useStore((s) => s.collectAtCounter)
  const payForEntry = useStore((s) => s.payForEntry)
  const receipts = useStore((s) => s.receipts)

  // Derived, not selected: a selector returning a fresh array re-renders forever.
  const audit = useMemo(() => allAudit.filter((a) => a.recordId === id), [allAudit, id])

  const [extra, setExtra] = useState<Record<string, string>>({})
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<PaymentMode>('নগদ')
  const [txnRef, setTxnRef] = useState('')
  const [txnError, setTxnError] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  if (!config) return <Navigate to="/office" replace />

  if (!entry || entry.registerKey !== config.key) {
    return (
      <>
        <PageHeader title="এন্ট্রি পাওয়া যায়নি" />
        <Card>
          <Button onClick={() => navigate(`/office/registers/${config.key}`)}>
            <BookOpen size={14} />
            রেজিস্টারে ফিরে যান
          </Button>
        </Card>
      </>
    )
  }

  const cancelled = !!entry.cancelled
  const stepKeys = config.steps.map((s) => s.key)
  const stepIndex = stepKeys.indexOf(entry.status)
  const isFinal = stepIndex >= config.steps.length - 1
  const nextStep = isFinal ? undefined : config.steps[stepIndex + 1]
  const currentStep = config.steps[stepIndex]

  const promptFields = (nextStep?.requiredFields ?? [])
    .map((k) => config.fields.find((f) => f.key === k))
    .filter((f): f is NonNullable<typeof f> => !!f)

  /** A ward-scoped register only lets that ward's councillor act. */
  const wardOk =
    !config.wardScoped || role !== 'councillor' || currentWard === undefined || entry.ward === currentWard
  const canAdvance = !!nextStep && !!role && nextStep.actors.includes(role) && wardOk
  const canCancel = !!role && config.cancelRoles.includes(role)
  const handoffRole: Role | undefined = canAdvance ? undefined : nextStep?.actors[0]
  const receipt = receipts.find((r) => r.id === entry.receiptId)

  function onAdvance() {
    const found: Record<string, string> = {}
    for (const field of promptFields) {
      // These columns become mandatory at the moment the status moves forward.
      const message = validateFormField({ ...field, required: true }, extra[field.key] ?? '')
      if (message) found[field.key] = message
    }
    setExtraErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error('কিছু তথ্য পূরণ করতে হবে')
      return
    }

    const payload: Record<string, FieldValue> = {}
    for (const field of promptFields) {
      payload[field.key] = fieldValueFrom(field, extra[field.key] ?? '')
    }
    const reached = advanceEntry(entry!.id, payload)
    if (reached) {
      setExtra({})
      const label = config!.steps.find((s) => s.key === reached)?.label ?? reached
      toast.success(`অবস্থা পরিবর্তন হয়েছে — ${label}`)
    }
  }

  function onCollect() {
    if (mode !== 'নগদ' && !txnRef.trim()) {
      setTxnError('নগদ ছাড়া অন্য মাধ্যমে লেনদেন রেফারেন্স লিখতে হবে।')
      return
    }
    if (!entry!.feeLines) return
    const created = collectAtCounter(
      {
        target: { type: 'register-entry', id: entry!.id, registerKey: config!.key },
        head: 'certificate',
        purpose: `${config!.title.replace(' রেজিস্টার', '')} ফি — ${entry!.applicantName}`,
        payerName: entry!.applicantName,
        payerMobile: entry!.applicantMobile,
        feeLines: entry!.feeLines,
        channel: 'office',
      },
      { mode, txnRef: txnRef.trim() || undefined },
    )
    setTxnError('')
    if (created) toast.success(`ফি আদায় হয়েছে, রসিদ নং ${toBnDigits(created.receiptNo)}`)
  }

  /** Same fee, handed to the mock gateway rather than collected at the counter. */
  function onPayOnline() {
    const payment = payForEntry(entry!.id, 'online')
    if (payment) navigate(`/pay/${payment.id}`)
  }

  function onCancel() {
    if (reason.trim().length < 5) {
      setReasonError('বাতিলের কারণ অবশ্যই লিখতে হবে।')
      return
    }
    cancelEntry(entry!.id, reason.trim())
    setCancelOpen(false)
    setReason('')
    setReasonError('')
    toast.success('বাতিল করা হয়েছে')
  }

  const doneCount = cancelled ? 0 : stepIndex + 1
  const photos = entry.photos ?? []

  return (
    <>
      <PageHeader
        title={`${config.title} — ক্রমিক নং ${toBnDigits(entry.serial ?? 0)}`}
        subtitle={
          <>
            {config.section} · {toBnDigits(entry.serialNo)} · অর্থবছর {toBnDigits(entry.fiscalYear)}
            {' · '}ট্র্যাকিং নং {entry.trackingNo}
            {entry.channel === 'online' && <> · অনলাইন আবেদন</>}
          </>
        }
        badge={
          <>
            {cancelled ? (
              <StatusBadge label="বাতিল" tone="danger" />
            ) : (
              <StatusBadge
                label={currentStep?.label ?? entry.status}
                tone={entryStatusTone(stepKeys, entry.status)}
              />
            )}
            <SlaBadge record={entry} />
          </>
        }
        actions={
          <>
            <Button onClick={() => navigate(`/office/registers/${config.key}`)}>
              <ArrowLeft size={14} />
              রেজিস্টার
            </Button>
            {isFinal && !cancelled && config.printable === 'certificate' && (
              <Button variant="primary" onClick={() => navigate(`/print/certificate/${entry.id}`)}>
                <Printer size={14} />
                সনদ প্রিন্ট
              </Button>
            )}
            {receipt && (
              <Button onClick={() => navigate(`/print/receipt/${receipt.id}`)}>
                <ReceiptIcon size={14} />
                রসিদ প্রিন্ট
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <WorkflowSteps
              steps={config.steps.map((s) => {
                const done = entry.history.find((h) => h.status === s.key)
                return {
                  label: s.label,
                  meta: done ? `${done.byName} — ${formatDateBn(done.at)}` : undefined,
                }
              })}
              done={doneCount}
              cancelled={cancelled}
            />
            {cancelled ? (
              <Stamp
                label="বাতিল"
                sub={entry.cancelled ? formatDateBn(entry.cancelled.at) : undefined}
                className="shrink-0"
              />
            ) : (
              isFinal && <Stamp label={config.printable ? 'অনুমোদিত' : 'নিষ্পন্ন'} size="sm" className="shrink-0" />
            )}
          </div>
          <p className="mt-3 border-t border-rule/60 pt-2 text-[12.5px] text-muted">
            আবেদনকারী {entry.applicantName}
            {entry.applicantMobile && <> · {toBnDigits(entry.applicantMobile)}</>} · ওয়ার্ড{' '}
            {toBnDigits(entry.ward)} · <SlaBadge record={entry} showDue />
          </p>
        </Card>

        {cancelled && (
          <Card className="border-stamp/35 bg-stamp/4">
            <p className="text-[13px] font-medium text-stamp">বাতিলের কারণ</p>
            <p className="mt-1 text-[13.5px] leading-relaxed">{entry.cancelled?.reason}</p>
            <p className="mt-2 text-[12.5px] text-muted">
              {entry.cancelled?.by} — {entry.cancelled && formatDateTimeBn(entry.cancelled.at)} · লাইনটি
              রেজিস্টারে কাটা অবস্থায় দৃশ্যমান থাকবে।
            </p>
          </Card>
        )}

        {!cancelled && nextStep && (
          <Card title="পরবর্তী পদক্ষেপ" subtitle={`পরবর্তী অবস্থা: ${nextStep.label}`}>
            {nextStep.payment ? (
              /* A payment step is reached by paying, not by a staff click. */
              role === 'accounts' ? (
                <div className="flex flex-col gap-3.5">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="পরিশোধের মাধ্যম" htmlFor="e-pay-mode" required>
                      <Select
                        id="e-pay-mode"
                        value={mode}
                        onChange={(e) => setMode(e.target.value as PaymentMode)}
                      >
                        {PAYMENT_MODES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field
                      label="লেনদেন রেফারেন্স"
                      htmlFor="e-txn-ref"
                      required={mode !== 'নগদ'}
                      error={txnError}
                      hint={mode === 'নগদ' ? 'নগদে প্রয়োজন নেই।' : 'বিকাশ/ব্যাংকের রেফারেন্স নম্বর।'}
                    >
                      <Input
                        id="e-txn-ref"
                        value={txnRef}
                        disabled={mode === 'নগদ'}
                        invalid={!!txnError}
                        onChange={(e) => setTxnRef(e.target.value)}
                      />
                    </Field>
                  </div>
                  <p className="text-[13.5px]">
                    আদায়যোগ্য ফি <span className="font-medium">{formatTaka(entry.feeTotal ?? 0)}</span>
                    <span className="text-muted"> · নাগরিক চাইলে নিজেও অনলাইনে পরিশোধ করতে পারেন।</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={onCollect}>
                      ফি আদায় করুন
                    </Button>
                    <Button onClick={onPayOnline}>অনলাইনে পরিশোধ (ডেমো)</Button>
                    {canCancel && (
                      <Button variant="danger" onClick={() => setCancelOpen(true)}>
                        বাতিল করুন
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <RoleHandoff role="accounts" action={nextStep.label} />
                  <p className="text-[12.5px] text-muted">
                    আদায়যোগ্য ফি {formatTaka(entry.feeTotal ?? 0)} — নাগরিক কর্নার থেকে অনলাইনেও
                    পরিশোধ করা যাবে।
                  </p>
                </div>
              )
            ) : canAdvance ? (
              <div className="flex flex-col gap-3.5">
                {promptFields.length > 0 && (
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {promptFields.map((field) => (
                      <Field
                        key={field.key}
                        label={field.label}
                        htmlFor={`f-${field.key}`}
                        required
                        error={extraErrors[field.key]}
                        className={field.type === 'textarea' ? 'sm:col-span-full' : undefined}
                      >
                        <FieldControl
                          field={field}
                          value={extra[field.key] ?? ''}
                          invalid={!!extraErrors[field.key]}
                          onChange={(value) => setExtra((v) => ({ ...v, [field.key]: value }))}
                        />
                      </Field>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={onAdvance}>
                    {nextStep.label} করুন
                  </Button>
                  {canCancel && (
                    <Button variant="danger" onClick={() => setCancelOpen(true)}>
                      বাতিল করুন
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {handoffRole && <RoleHandoff role={handoffRole} action={nextStep.label} />}
                {config.wardScoped && !wardOk && (
                  <p className="rounded-sm border border-amber/35 bg-amber/8 px-3 py-2 text-[12.5px] text-ink">
                    এই সনদটি ওয়ার্ড {toBnDigits(entry.ward)}-এর; কেবল সেই ওয়ার্ডের কাউন্সিলর অনুমোদন
                    দিতে পারবেন।
                  </p>
                )}
                {canCancel && (
                  <div>
                    <Button variant="danger" onClick={() => setCancelOpen(true)}>
                      বাতিল করুন
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {!cancelled && isFinal && (
          <Card title="কাজ সম্পন্ন">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13.5px] text-muted">
                এই লাইনের সব ধাপ শেষ হয়েছে
                {entry.certificateNo && <> · সনদ নং {toBnDigits(entry.certificateNo)}</>}। প্রয়োজনে
                কারণসহ বাতিল করা যাবে, তবে মুছে ফেলা যাবে না।
              </p>
              {canCancel && (
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  বাতিল করুন
                </Button>
              )}
            </div>
          </Card>
        )}

        {photos.length > 0 && (
          <Card title="ছবি" subtitle="আগে ও পরে">
            <div className="flex flex-wrap gap-3">
              {photos.map((photo) => (
                <figure key={photo.dataUrl.slice(-24)} className="w-44">
                  <img
                    src={photo.dataUrl}
                    alt={photo.caption ?? (photo.kind === 'before' ? 'আগের ছবি' : 'পরের ছবি')}
                    className="w-full rounded-sm border border-rule"
                  />
                  <figcaption className="mt-1 text-[12px] text-muted">
                    {photo.kind === 'before' ? 'আগে' : 'পরে'} · {formatDateBn(photo.at)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="এন্ট্রির বিবরণ">
            <DataList
              items={config.fields
                .filter((f) => f.type !== 'photo')
                .map((f) => ({
                  label: f.label,
                  value: displayField(f, entry.data[f.key]),
                  wide: f.type === 'textarea' || f.type === 'heirs',
                }))}
            />
            {receipt && (
              <p className="mt-3 border-t border-rule/60 pt-2 text-[13px]">
                রসিদ নং <span className="font-medium">{toBnDigits(receipt.receiptNo)}</span>{' '}
                <span className="text-muted">
                  (বই নং {toBnDigits(receipt.bookNo)}, পাতা {toBnDigits(receipt.pageNo)} ·{' '}
                  {receipt.mode ?? receipt.method})
                </span>
              </p>
            )}
            <p className="mt-3 border-t border-rule/60 pt-2 text-[12.5px] text-muted">
              এন্ট্রি করেছেন {entry.history[0]?.byName} — {formatDateTimeBn(entry.createdAt)}
            </p>
          </Card>

          <Card title="কার্যক্রমের ইতিহাস" subtitle="কার্যক্রম লগ থেকে তৈরি">
            <Timeline entries={audit} />
            {entry.feedback && (
              <p className="mt-3 border-t border-rule/60 pt-2 text-[13px]">
                নাগরিক রেটিং: {'★'.repeat(entry.feedback.rating)}
                <span className="text-muted">{'☆'.repeat(5 - entry.feedback.rating)}</span>
                {entry.feedback.comment && (
                  <span className="mt-1 block text-[12.5px] text-muted">
                    “{entry.feedback.comment}”
                  </span>
                )}
              </p>
            )}
          </Card>
        </div>
      </div>

      <Dialog
        open={cancelOpen}
        title="এই লাইন বাতিল করবেন?"
        description="বাতিল করলেও রেজিস্টার থেকে মুছে যাবে না — কারণসহ কাটা অবস্থায় থাকবে।"
        onClose={() => setCancelOpen(false)}
        footer={
          <>
            <Button onClick={() => setCancelOpen(false)}>থাক</Button>
            <Button variant="danger" onClick={onCancel}>
              বাতিল করুন
            </Button>
          </>
        }
      >
        <Field label="বাতিলের কারণ" htmlFor="entry-cancel-reason" required error={reasonError}>
          <Textarea
            id="entry-cancel-reason"
            value={reason}
            invalid={!!reasonError}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </Dialog>
    </>
  )
}
