import { ArrowLeft, BookOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataList } from '@/components/DataList'
import { PageHeader } from '@/components/PageHeader'
import { RoleHandoff } from '@/components/RoleHandoff'
import { Stamp } from '@/components/Stamp'
import { StatusBadge } from '@/components/StatusBadge'
import { Timeline } from '@/components/Timeline'
import { WorkflowSteps } from '@/components/WorkflowSteps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import { formatDateBn, formatDateTimeBn, toBnDigits } from '@/lib/bn'
import { entryStatusTone } from '@/lib/status'
import { getRegister } from '@/registers'
import { useStore } from '@/store/useStore'
import type { Role } from '@/types'
import { normaliseField, validateField } from '@/lib/registerFields'
import { FieldControl } from './fields'

export function RegisterDetail() {
  const { key, id } = useParams()
  const navigate = useNavigate()
  const config = getRegister(key)
  const entry = useStore((s) => s.entries.find((e) => e.id === id))
  const allAudit = useStore((s) => s.audit)
  const role = useStore((s) => s.session?.role)
  const advanceEntry = useStore((s) => s.advanceEntry)
  const cancelEntry = useStore((s) => s.cancelEntry)

  // Derived, not selected: a selector returning a fresh array re-renders forever.
  const audit = useMemo(() => allAudit.filter((a) => a.recordId === id), [allAudit, id])

  const [extra, setExtra] = useState<Record<string, string>>({})
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({})
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  if (!config) return <Navigate to="/" replace />

  if (!entry || entry.registerKey !== config.key) {
    return (
      <>
        <PageHeader title="এন্ট্রি পাওয়া যায়নি" />
        <Card>
          <Button onClick={() => navigate(`/registers/${config.key}`)}>
            <BookOpen size={14} />
            রেজিস্টারে ফিরে যান
          </Button>
        </Card>
      </>
    )
  }

  const cancelled = !!entry.cancelledAt
  const statusIndex = config.statuses.indexOf(entry.status)
  const isFinal = statusIndex >= config.statuses.length - 1
  const nextStatus = isFinal ? undefined : config.statuses[statusIndex + 1]
  const promptKeys = nextStatus ? (config.advancePrompts?.[nextStatus] ?? []) : []
  const promptFields = promptKeys
    .map((k) => config.fields.find((f) => f.key === k))
    .filter((f): f is NonNullable<typeof f> => !!f)

  const canAdvance = role ? config.roles.advance.includes(role) : false
  const canCancel = role ? config.roles.cancel.includes(role) : false
  const handoffRole: Role | undefined = canAdvance ? undefined : config.roles.advance[0]

  function onAdvance() {
    const found: Record<string, string> = {}
    for (const field of promptFields) {
      // These columns become mandatory at the moment the status moves forward.
      const message = validateField({ ...field, required: true }, extra[field.key] ?? '')
      if (message) found[field.key] = message
    }
    setExtraErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error('কিছু তথ্য পূরণ করতে হবে')
      return
    }

    const payload: Record<string, string | number> = {}
    for (const field of promptFields) {
      payload[field.key] = normaliseField(field, extra[field.key] ?? '')
    }
    const reached = advanceEntry(entry!.id, payload)
    if (reached) {
      setExtra({})
      toast.success(`অবস্থা পরিবর্তন হয়েছে — ${reached}`)
    }
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

  const doneCount = cancelled ? 0 : statusIndex + 1

  return (
    <>
      <PageHeader
        title={`${config.title} — ক্রমিক নং ${toBnDigits(entry.serial)}`}
        subtitle={`${config.section} · ${toBnDigits(entry.serialNo)} · অর্থবছর ${toBnDigits(entry.fiscalYear)}`}
        badge={
          cancelled ? (
            <StatusBadge label="বাতিল" tone="danger" />
          ) : (
            <StatusBadge label={entry.status} tone={entryStatusTone(config.statuses, entry.status)} />
          )
        }
        actions={
          <Button onClick={() => navigate(`/registers/${config.key}`)}>
            <ArrowLeft size={14} />
            রেজিস্টার
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <WorkflowSteps
              steps={config.statuses.map((s) => ({ label: s }))}
              done={doneCount}
              cancelled={cancelled}
            />
            {cancelled ? (
              <Stamp
                label="বাতিল"
                sub={entry.cancelledAt ? formatDateBn(entry.cancelledAt) : undefined}
                className="shrink-0"
              />
            ) : (
              isFinal && <Stamp label="অনুমোদিত" size="sm" className="shrink-0" />
            )}
          </div>
        </Card>

        {cancelled && (
          <Card className="border-stamp/35 bg-stamp/4">
            <p className="text-[13px] font-medium text-stamp">বাতিলের কারণ</p>
            <p className="mt-1 text-[13.5px] leading-relaxed">{entry.cancelReason}</p>
            <p className="mt-2 text-[12.5px] text-muted">
              {entry.cancelledBy} — {entry.cancelledAt && formatDateTimeBn(entry.cancelledAt)} · লাইনটি
              রেজিস্টারে কাটা অবস্থায় দৃশ্যমান থাকবে।
            </p>
          </Card>
        )}

        {!cancelled && nextStatus && (
          <Card title="পরবর্তী পদক্ষেপ" subtitle={`পরবর্তী অবস্থা: ${nextStatus}`}>
            {canAdvance ? (
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
                    {nextStatus} করুন
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
                {handoffRole && <RoleHandoff role={handoffRole} action={nextStatus} />}
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

        {!cancelled && isFinal && canCancel && (
          <Card title="কাজ সম্পন্ন">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13.5px] text-muted">
                এই লাইনের সব ধাপ শেষ হয়েছে। প্রয়োজনে কারণসহ বাতিল করা যাবে, তবে মুছে ফেলা যাবে না।
              </p>
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                বাতিল করুন
              </Button>
            </div>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="এন্ট্রির বিবরণ">
            <DataList
              items={config.fields.map((f) => ({
                label: f.label,
                value: displayValue(f.type, entry.data[f.key]),
                wide: f.type === 'textarea',
              }))}
            />
            <p className="mt-3 border-t border-rule/60 pt-2 text-[12.5px] text-muted">
              এন্ট্রি করেছেন {entry.createdBy} — {formatDateTimeBn(entry.createdAt)}
            </p>
          </Card>

          <Card title="কার্যক্রমের ইতিহাস" subtitle="কার্যক্রম লগ থেকে তৈরি">
            <Timeline entries={audit} />
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

function displayValue(type: string, value: string | number | undefined) {
  if (value === undefined || value === '') return '—'
  if (type === 'date') return formatDateBn(String(value))
  return toBnDigits(String(value))
}
