import { ArrowLeft, Printer, Receipt as ReceiptIcon, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataList } from '@/components/DataList'
import { PageHeader } from '@/components/PageHeader'
import { Stamp } from '@/components/Stamp'
import { StatusBadge } from '@/components/StatusBadge'
import { Timeline } from '@/components/Timeline'
import { WorkflowSteps } from '@/components/WorkflowSteps'
import { RoleHandoff } from '@/components/RoleHandoff'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { PAYMENT_MODES, businessTypeOf } from '@/data/seed'
import { formatDateBn, formatDateTimeBn, formatTaka, toBnDigits } from '@/lib/bn'
import { validUntil } from '@/lib/fiscal'
import { LinkButton } from '@/components/ui/LinkButton'
import {
  expiryOf,
  RENEWAL_LABEL,
  RENEWAL_TONE,
  renewalFor,
  renewalState,
  renewedFrom,
} from '@/lib/licence'
import { LICENCE_STATUS_LABEL, LICENCE_STATUS_TONE, nextActionFor } from '@/lib/status'
import { useStore } from '@/store/useStore'
import { SlaBadge } from '@/components/SlaBadge'
import { approvedAt, issuedAt, receiptFor, stepBy, verifiedAt } from '@/lib/records'
import type { PaymentMode } from '@/types'

const STEP_LABELS = ['আবেদন জমা', 'মাঠ যাচাই', 'অনুমোদন ও রেজিস্টার নম্বর', 'ফি আদায় ও ইস্যু']
const DONE_BY_STATUS = { submitted: 1, verified: 2, approved: 3, issued: 4, cancelled: 0 } as const

export function LicenceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const licences = useStore((s) => s.licences)
  const licence = licences.find((l) => l.id === id)
  const receipts = useStore((s) => s.receipts)
  const allAudit = useStore((s) => s.audit)
  const role = useStore((s) => s.session?.role)

  const verifyLicence = useStore((s) => s.verifyLicence)
  const approveLicence = useStore((s) => s.approveLicence)
  const collectAtCounter = useStore((s) => s.collectAtCounter)
  const cancelLicence = useStore((s) => s.cancelLicence)

  // Derived, not selected: a selector returning a fresh array re-renders forever.
  const audit = useMemo(() => allAudit.filter((a) => a.recordId === id), [allAudit, id])

  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')
  const [mode, setMode] = useState<PaymentMode>('নগদ')
  const [txnRef, setTxnRef] = useState('')
  const [txnError, setTxnError] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  if (!licence) {
    return (
      <>
        <PageHeader title="রেকর্ড পাওয়া যায়নি" />
        <Card>
          <Link to="/office/trade-licence" className="text-forest-700 hover:underline">
            ট্রেড লাইসেন্স তালিকায় ফিরে যান
          </Link>
        </Card>
      </>
    )
  }

  const receipt = receiptFor(receipts, licence)
  const verifiedOn = verifiedAt(licence)
  const approvedOn = approvedAt(licence)
  const issuedOn = issuedAt(licence)
  const cancelled = licence.status === 'cancelled'
  const done = DONE_BY_STATUS[licence.status]
  const next = nextActionFor(licence.status)
  const type = businessTypeOf(licence.business.typeKey)
  const renewal = renewalFor(licences, licence)
  const parent = renewedFrom(licences, licence)
  const validity = renewalState(licences, licence)

  const steps = [
    {
      label: STEP_LABELS[0],
      meta: `${licence.history[0]?.byName ?? ''} — ${formatDateBn(licence.createdAt)}`,
    },
    {
      label: STEP_LABELS[1],
      meta: verifiedOn ? `${stepBy(licence, 'verified')} — ${formatDateBn(verifiedOn)}` : undefined,
    },
    {
      label: STEP_LABELS[2],
      meta: approvedOn
        ? `ক্রমিক নং ${toBnDigits(licence.serial ?? '')} — ${formatDateBn(approvedOn)}`
        : undefined,
    },
    {
      label: STEP_LABELS[3],
      meta: receipt ? `রসিদ নং ${toBnDigits(receipt.receiptNo)}` : undefined,
    },
  ]

  function onVerify() {
    if (note.trim().length < 5) {
      setNoteError('যাচাইয়ের মন্তব্য লিখুন (অন্তত কয়েকটি শব্দ)।')
      return
    }
    verifyLicence(licence!.id, note.trim())
    setNote('')
    setNoteError('')
    toast.success('যাচাই সম্পন্ন হয়েছে')
  }

  function onApprove() {
    const result = approveLicence(licence!.id)
    if (result) toast.success(`অনুমোদিত, ক্রমিক নং ${toBnDigits(result.serial)}`)
  }

  function onCollect() {
    if (mode !== 'নগদ' && !txnRef.trim()) {
      setTxnError('নগদ ছাড়া অন্য মাধ্যমে লেনদেন রেফারেন্স লিখতে হবে।')
      return
    }
    const created = collectAtCounter(
      {
        target: { type: 'trade-licence', id: licence!.id },
        head: 'trade-licence',
        purpose: `${licence!.kind === 'renewal' ? 'ট্রেড লাইসেন্স নবায়ন ফি' : 'ট্রেড লাইসেন্স ফি'} — ${licence!.business.nameBn}`,
        payerName: licence!.owner.name,
        payerMobile: licence!.applicantMobile,
        feeLines: licence!.feeLines,
        channel: 'office',
      },
      { mode, txnRef: txnRef.trim() || undefined },
    )
    setTxnError('')
    if (created) toast.success(`ফি আদায় হয়েছে, রসিদ নং ${toBnDigits(created.receiptNo)}`)
  }

  function onCancel() {
    if (reason.trim().length < 5) {
      setReasonError('বাতিলের কারণ অবশ্যই লিখতে হবে।')
      return
    }
    cancelLicence(licence!.id, reason.trim())
    setCancelOpen(false)
    setReason('')
    setReasonError('')
    toast.success('বাতিল করা হয়েছে')
  }

  const canCancel =
    role === 'licenceOfficer' && ['submitted', 'verified', 'approved'].includes(licence.status)

  return (
    <>
      <PageHeader
        title={licence.business.nameBn}
        subtitle={
          <>
            আবেদন নং {toBnDigits(licence.appNo)}
            {licence.registerNo && <> · লাইসেন্স নং {toBnDigits(licence.registerNo)}</>}
            {' · '}অর্থবছর {toBnDigits(licence.fiscalYear)}
            {parent && (
              <>
                {' · '}নবায়ন —{' '}
                <Link
                  to={`/office/trade-licence/${parent.id}`}
                  className="text-forest-700 hover:underline"
                >
                  আগের লাইসেন্স {toBnDigits(parent.registerNo ?? parent.appNo)}
                </Link>
              </>
            )}
          </>
        }
        badge={
          <>
            <StatusBadge
              label={LICENCE_STATUS_LABEL[licence.status]}
              tone={LICENCE_STATUS_TONE[licence.status]}
            />
            <SlaBadge record={licence} />
          </>
        }
        actions={
          <>
            <Button onClick={() => navigate('/office/trade-licence')}>
              <ArrowLeft size={14} />
              তালিকা
            </Button>
            {licence.status === 'issued' && (
              <>
                <Button variant="primary" onClick={() => navigate(`/print/licence/${licence.id}`)}>
                  <Printer size={14} />
                  লাইসেন্স প্রিন্ট
                </Button>
                {receipt && (
                  <Button onClick={() => navigate(`/print/receipt/${receipt.id}`)}>
                    <ReceiptIcon size={14} />
                    রসিদ প্রিন্ট
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <WorkflowSteps steps={steps} done={done} cancelled={cancelled} />
            {(licence.status === 'approved' || licence.status === 'issued') && (
              <Stamp
                label="অনুমোদিত"
                sub={approvedOn ? formatDateBn(approvedOn) : undefined}
                className="shrink-0"
              />
            )}
            {cancelled && (
              <Stamp
                label="বাতিল"
                sub={licence.cancelled ? formatDateBn(licence.cancelled.at) : undefined}
                className="shrink-0"
              />
            )}
          </div>
        </Card>

        {cancelled && (
          <Card className="border-stamp/35 bg-stamp/4">
            <p className="text-[13px] font-medium text-stamp">বাতিলের কারণ</p>
            <p className="mt-1 text-[13.5px] leading-relaxed">{licence.cancelled?.reason}</p>
            <p className="mt-2 text-[12.5px] text-muted">
              {licence.cancelled?.by} — {licence.cancelled && formatDateTimeBn(licence.cancelled.at)}
              {' · '}রেকর্ডটি মুছে ফেলা হয়নি, রেজিস্টারে দৃশ্যমান থাকবে।
            </p>
          </Card>
        )}

        {/* Only the role that acts next sees an action. Everyone else sees the handoff. */}
        {!cancelled && next && (
          <Card title="পরবর্তী পদক্ষেপ">
            {role === next.role ? (
              <div className="flex flex-col gap-3">
                {licence.status === 'submitted' && (
                  <>
                    <Field
                      label="মাঠ যাচাইয়ের মন্তব্য"
                      htmlFor="verify-note"
                      required
                      error={noteError}
                      hint="সরেজমিনে যা দেখা হয়েছে সংক্ষেপে লিখুন।"
                    >
                      <Textarea
                        id="verify-note"
                        value={note}
                        invalid={!!noteError}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </Field>
                    <div>
                      <Button variant="primary" onClick={onVerify}>
                        যাচাই সম্পন্ন করুন
                      </Button>
                    </div>
                  </>
                )}

                {licence.status === 'verified' && (
                  <>
                    <p className="text-[13.5px] text-muted">
                      অনুমোদন দিলে এই মুহূর্তেই রেজিস্টারে ক্রমিক নং ও লাইসেন্স নম্বর বসবে — ঠিক
                      যেভাবে খাতায় নতুন লাইন লেখা হয়।
                    </p>
                    {licence.verificationNote && (
                      <p className="rounded-sm border border-rule/70 bg-paper px-3 py-2 text-[13px] leading-relaxed">
                        <span className="text-muted">পরিদর্শকের মন্তব্য: </span>
                        {licence.verificationNote}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" onClick={onApprove}>
                        অনুমোদন দিন
                      </Button>
                      <Button variant="danger" onClick={() => setCancelOpen(true)}>
                        বাতিল করুন
                      </Button>
                    </div>
                  </>
                )}

                {licence.status === 'approved' && (
                  <>
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <Field label="পরিশোধের মাধ্যম" htmlFor="pay-mode" required>
                        <Select
                          id="pay-mode"
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
                        htmlFor="txn-ref"
                        required={mode !== 'নগদ'}
                        error={txnError}
                        hint={mode === 'নগদ' ? 'নগদে প্রয়োজন নেই।' : 'বিকাশ/ব্যাংকের রেফারেন্স নম্বর।'}
                      >
                        <Input
                          id="txn-ref"
                          value={txnRef}
                          disabled={mode === 'নগদ'}
                          invalid={!!txnError}
                          onChange={(e) => setTxnRef(e.target.value)}
                        />
                      </Field>
                    </div>
                    <p className="text-[13.5px]">
                      আদায়যোগ্য মোট ফি{' '}
                      <span className="font-medium">{formatTaka(licence.feeTotal)}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" onClick={onCollect}>
                        ফি আদায় করুন
                      </Button>
                      <Button variant="danger" onClick={() => setCancelOpen(true)}>
                        বাতিল করুন
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <RoleHandoff role={next.role} action={next.action} />
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

        {licence.status === 'issued' && (
          <Card
            title="ইস্যু সম্পন্ন"
            actions={
              <>
                <StatusBadge label={RENEWAL_LABEL[validity]} tone={RENEWAL_TONE[validity]} />
                {/* Renewal is the operator's counter job, and only once per licence. */}
                {role === 'operator' && !renewal && (
                  <LinkButton to={`/office/trade-licence/renew?from=${licence.id}`} variant="primary">
                    <RefreshCw size={14} />
                    নবায়ন করুন
                  </LinkButton>
                )}
              </>
            }
          >
            <p className="text-[13.5px] text-muted">
              লাইসেন্স ইস্যু হয়েছে {issuedOn && formatDateTimeBn(issuedOn)}। মেয়াদ{' '}
              {formatDateBn(validUntil(licence.fiscalYear))} পর্যন্ত, প্রতি অর্থবছরে নবায়ন করতে হবে।
            </p>
            {renewal && (
              <p className="mt-2 text-[13.5px]">
                নবায়ন আবেদন{' '}
                <Link
                  to={`/office/trade-licence/${renewal.id}`}
                  className="font-medium text-forest-700 hover:underline"
                >
                  {toBnDigits(renewal.registerNo ?? renewal.appNo)}
                </Link>{' '}
                <span className="text-muted">
                  ({LICENCE_STATUS_LABEL[renewal.status]} · অর্থবছর {toBnDigits(renewal.fiscalYear)})
                </span>
              </p>
            )}
            {validity === 'expired' && !renewal && (
              <p className="mt-2 text-[13px] text-stamp">
                মেয়াদ {formatDateBn(expiryOf(licence))} তারিখে শেষ হয়েছে, এখনো নবায়ন হয়নি।
              </p>
            )}
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="প্রতিষ্ঠানের তথ্য">
            <DataList
              items={[
                { label: 'নাম (বাংলা)', value: licence.business.nameBn },
                { label: 'নাম (ইংরেজি)', value: licence.business.nameEn },
                { label: 'ব্যবসার ধরন', value: type.label },
                { label: 'প্রকৃতি', value: licence.business.nature },
                { label: 'ওয়ার্ড', value: toBnDigits(licence.business.ward) },
                { label: 'হোল্ডিং নং', value: toBnDigits(licence.business.holdingNo) },
                { label: 'ঠিকানা', value: toBnDigits(licence.business.address), wide: true },
              ]}
            />
          </Card>

          <Card title="মালিকের তথ্য">
            <DataList
              items={[
                { label: 'নাম', value: licence.owner.name },
                { label: 'পিতার নাম', value: licence.owner.fatherName },
                { label: 'মাতার নাম', value: licence.owner.motherName },
                { label: 'জাতীয় পরিচয়পত্র নং', value: toBnDigits(licence.owner.nid) },
                { label: 'মোবাইল', value: toBnDigits(licence.owner.mobile) },
              ]}
            />
          </Card>

          <Card title="ফি বিবরণ" subtitle="ডেমো হার">
            <table className="w-full text-[13.5px]">
              <tbody>
                {licence.feeLines.map((line) => (
                  <tr key={line.label} className="border-b border-rule/50 last:border-0">
                    <td className="py-1.5 pr-2 text-muted">{line.label}</td>
                    <td className="py-1.5 text-right whitespace-nowrap">{formatTaka(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink/20">
                  <td className="py-2 pr-2 font-medium">মোট</td>
                  <td className="py-2 text-right font-medium">{formatTaka(licence.feeTotal)}</td>
                </tr>
              </tfoot>
            </table>
            {receipt && (
              <p className="mt-2.5 text-[13px]">
                রসিদ নং{' '}
                <Link
                  to={`/print/receipt/${receipt.id}`}
                  className="font-medium text-forest-700 hover:underline"
                >
                  {toBnDigits(receipt.receiptNo)}
                </Link>{' '}
                <span className="text-muted">
                  (বই নং {toBnDigits(receipt.bookNo)}, পাতা {toBnDigits(receipt.pageNo)} · {receipt.mode})
                </span>
              </p>
            )}
          </Card>

          <Card title="কার্যক্রমের ইতিহাস" subtitle="কার্যক্রম লগ থেকে তৈরি">
            <Timeline entries={audit} />
          </Card>
        </div>
      </div>

      <Dialog
        open={cancelOpen}
        title="আবেদন বাতিল করবেন?"
        description="বাতিল করলেও রেকর্ড মুছে যাবে না — কারণসহ রেজিস্টারে দৃশ্যমান থাকবে।"
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
        <Field label="বাতিলের কারণ" htmlFor="cancel-reason" required error={reasonError}>
          <Textarea
            id="cancel-reason"
            value={reason}
            invalid={!!reasonError}
            onChange={(e) => setReason(e.target.value)}
            placeholder="কেন বাতিল করা হচ্ছে তা স্পষ্টভাবে লিখুন"
          />
        </Field>
      </Dialog>
    </>
  )
}
