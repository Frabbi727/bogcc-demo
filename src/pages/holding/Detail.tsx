import { ArrowLeft, Building2, CheckCircle2, Printer, Receipt as ReceiptIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { Select } from '@/components/ui/Select'
import { PAYMENT_MODES } from '@/data/seed'
import { formatDateBn, formatTaka, toBnDigits } from '@/lib/bn'
import { currentBill, findHolding, nextInstalment, outstandingOf, paidOf } from '@/lib/holding'
import { useStore } from '@/store/useStore'
import type { PaymentMode } from '@/types'

/**
 * One holding's tax account: the year's demand, the four instalments, and the
 * counter form the revenue desk collects with (Spec v2 §10). The store owns
 * every rule; this page only shows the bill and hands the money over.
 */
export function HoldingDetail() {
  const { holdingNo } = useParams()
  const navigate = useNavigate()
  const holdings = useStore((s) => s.holdings)
  const receipts = useStore((s) => s.receipts)
  const role = useStore((s) => s.session?.role)
  const payHoldingInstalment = useStore((s) => s.payHoldingInstalment)
  const collectHoldingAtCounter = useStore((s) => s.collectHoldingAtCounter)

  const [mode, setMode] = useState<PaymentMode>('নগদ')
  const [txnRef, setTxnRef] = useState('')
  const [txnError, setTxnError] = useState('')

  const holding = findHolding(holdings, holdingNo ?? '')
  const bill = holding ? currentBill(holding) : undefined

  if (!holding || !bill) {
    return (
      <>
        <PageHeader title="হোল্ডিং কর" subtitle="হোল্ডিংটি পাওয়া যায়নি।" />
        <Card>
          <EmptyState
            icon={<Building2 size={26} strokeWidth={1.5} />}
            title="এই হোল্ডিং নম্বরটি রেজিস্টারে নেই।"
            hint="নম্বরটি মিলিয়ে দেখুন, অথবা রেজিস্টার থেকে হোল্ডিং বেছে নিন।"
          />
          <div className="mt-3">
            <LinkButton to="/office/holding">
              <ArrowLeft size={14} />
              রেজিস্টারে ফিরুন
            </LinkButton>
          </div>
        </Card>
      </>
    )
  }

  const paid = paidOf(bill)
  const next = nextInstalment(bill)
  const outstanding = outstandingOf(bill)
  const holdingReceipts = receipts
    .filter((r) => r.source.type === 'holding' && r.source.holdingNo === holding.holdingNo)
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))

  // Only the two money desks take a holding payment; everyone else reads.
  const canCollect = role === 'revenueOfficer' || role === 'accounts'

  function onCollect() {
    if (!next) return
    if (mode !== 'নগদ' && !txnRef.trim()) {
      setTxnError('নগদ ছাড়া অন্য মাধ্যমে লেনদেন রেফারেন্স লিখতে হবে।')
      return
    }
    const created = collectHoldingAtCounter(holding!.holdingNo, bill!.fiscalYear, next.no, {
      mode,
      txnRef: txnRef.trim() || undefined,
    })
    setTxnError('')
    setTxnRef('')
    if (created) toast.success(`কিস্তি আদায় হয়েছে, রসিদ নং ${toBnDigits(created.receiptNo)}`)
    else toast.error('এই কিস্তিটি আদায় করা যাচ্ছে না।')
  }

  /** The same instalment through the mock gateway, for a citizen paying at the desk. */
  function onPayOnline() {
    if (!next) return
    const payment = payHoldingInstalment(holding!.holdingNo, bill!.fiscalYear, next.no, 'online')
    if (payment) navigate(`/pay/${payment.id}`)
  }

  return (
    <>
      <PageHeader
        title={`হোল্ডিং ${holding.holdingNo}`}
        subtitle={`${holding.ownerName} · ওয়ার্ড ${toBnDigits(holding.ward)} · ${holding.address}`}
        actions={
          <>
            <LinkButton to="/office/holding">
              <ArrowLeft size={14} />
              রেজিস্টার
            </LinkButton>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer size={14} />
              প্রিন্ট
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Card
            title={`${toBnDigits(bill.fiscalYear)} অর্থবছরের দাবি`}
            subtitle="ডেমো হার: বার্ষিক মূল্যায়নের উপর হিসাব করা"
          >
            <dl className="divide-y divide-rule/60">
              {bill.lines.map((line) => (
                <Row key={line.label} label={line.label} value={formatTaka(line.amount)} />
              ))}
              <Row label="মোট বার্ষিক দাবি" value={formatTaka(bill.total)} strong />
              <Row label="আদায়" value={formatTaka(paid)} />
              <Row label="চলতি বছরের বাকি" value={formatTaka(bill.total - paid)} />
              {bill.arrears > 0 && (
                <>
                  <Row label="পূর্বের বকেয়া" value={formatTaka(bill.arrears)} />
                  <Row label="বকেয়ার সারচার্জ (৫%, ডেমো)" value={formatTaka(bill.surcharge)} />
                </>
              )}
              <Row label="মোট অনাদায়ী" value={formatTaka(outstanding)} strong />
            </dl>
          </Card>

          <Card
            title="কিস্তি"
            subtitle={
              next
                ? `পরবর্তী আদায়যোগ্য: ${toBnDigits(next.no)}ম কিস্তি`
                : 'এই বছরের সব কিস্তি পরিশোধ হয়েছে।'
            }
          >
            <ul className="flex flex-col gap-2">
              {bill.instalments.map((inst) => (
                <li
                  key={inst.no}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-rule/70 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium">
                      {toBnDigits(inst.no)}ম কিস্তি · {formatTaka(inst.amount)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {inst.paidAt ? (
                        <span className="inline-flex items-center gap-1 text-forest-700">
                          <CheckCircle2 size={13} />
                          {formatDateBn(inst.paidAt)} তারিখে আদায়
                        </span>
                      ) : next?.no === inst.no ? (
                        'আদায়ের জন্য প্রস্তুত'
                      ) : (
                        'আগের কিস্তি আদায়ের পর সক্রিয় হবে'
                      )}
                    </p>
                  </div>
                  {inst.paidAt ? (
                    inst.receiptId && (
                      <LinkButton to={`/print/receipt/${inst.receiptId}`} size="sm" target="_blank">
                        <ReceiptIcon size={14} />
                        রসিদ
                      </LinkButton>
                    )
                  ) : (
                    <StatusBadge
                      label={next?.no === inst.no ? 'আদায়যোগ্য' : 'অপেক্ষমাণ'}
                      tone={next?.no === inst.no ? 'pending' : 'neutral'}
                    />
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="আদায়ের রসিদ" bodyClassName={holdingReceipts.length ? 'p-0' : undefined}>
            {holdingReceipts.length === 0 ? (
              <p className="text-[13px] text-muted">এই হোল্ডিংয়ে এখনো কোনো রসিদ হয়নি।</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead className="border-b border-rule/70 text-left text-[12.5px] text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">রসিদ নং</th>
                    <th scope="col" className="px-3 py-2 font-medium">তারিখ</th>
                    <th scope="col" className="px-3 py-2 font-medium">মাধ্যম</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">টাকা</th>
                    <th scope="col" className="px-3 py-2 font-medium">প্রিন্ট</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingReceipts.map((r) => (
                    <tr key={r.id} className="border-b border-rule/50 last:border-0">
                      <td className="px-3 py-2 font-medium">{toBnDigits(r.receiptNo)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateBn(r.collectedAt)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.mode ?? `অনলাইন — ${r.method ?? ''}`}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{formatTaka(r.total)}</td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/print/receipt/${r.id}`}
                          className="inline-flex items-center gap-1 text-forest-700 hover:underline"
                        >
                          <Printer size={13} />
                          রসিদ
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="হোল্ডিংয়ের তথ্য">
            <dl className="divide-y divide-rule/60">
              <Row label="হোল্ডিং নং" value={holding.holdingNo} />
              <Row label="মালিক" value={holding.ownerName} />
              <Row label="মোবাইল" value={toBnDigits(holding.ownerMobile)} />
              <Row label="ঠিকানা" value={holding.address} />
              <Row label="ওয়ার্ড" value={`ওয়ার্ড ${toBnDigits(holding.ward)}`} />
              <Row label="সম্পত্তির ধরন" value={holding.propertyType} />
              <Row label="তলা" value={`${toBnDigits(holding.floors)} তলা`} />
              <Row label="বার্ষিক মূল্যায়ন" value={formatTaka(holding.annualValuation)} />
            </dl>
          </Card>

          {next && canCollect && (
            <Card
              className="no-print"
              title="কাউন্টারে আদায়"
              subtitle={`${toBnDigits(next.no)}ম কিস্তি — ${formatTaka(next.amount)}`}
            >
              <div className="flex flex-col gap-3">
                <Field label="আদায়ের মাধ্যম" htmlFor="hold-mode">
                  <Select
                    id="hold-mode"
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
                  htmlFor="hold-txn"
                  required={mode !== 'নগদ'}
                  error={txnError}
                  hint={mode === 'নগদ' ? 'নগদে প্রয়োজন নেই।' : 'বিকাশ/ব্যাংকের রেফারেন্স নম্বর।'}
                >
                  <Input
                    id="hold-txn"
                    value={txnRef}
                    disabled={mode === 'নগদ'}
                    invalid={!!txnError}
                    onChange={(e) => setTxnRef(e.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={onCollect}>
                    আদায় করুন ও রসিদ দিন
                  </Button>
                  <Button onClick={onPayOnline}>অনলাইনে পরিশোধ</Button>
                </div>
                <p className="text-[12.5px] leading-relaxed text-muted">
                  পুরনো কিস্তি আগে আদায় হয়, তাই একবারে একটি কিস্তিই নেওয়া যায়।
                </p>
              </div>
            </Card>
          )}

          {next && !canCollect && (
            <Card className="no-print" title="কাউন্টারে আদায়">
              <p className="text-[13px] leading-relaxed text-muted">
                হোল্ডিং কর আদায় করেন রাজস্ব কর্মকর্তা ও হিসাবরক্ষক। উপরের ভূমিকা বদলে আদায়ের ফর্ম
                দেখা যাবে।
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className={strong ? 'text-[13.5px] font-medium' : 'text-[13px]'}>{value}</dd>
    </div>
  )
}
