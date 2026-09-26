import { Building2, CheckCircle2, Receipt, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { formatDateBn, formatTaka, toBnDigits } from '@/lib/bn'
import { currentBill, findHolding } from '@/lib/holding'
import { useStore } from '@/store/useStore'

/**
 * Citizen holding tax: look a holding up, read the year's demand, pay an
 * instalment through the mock gateway. Spec §10 and §13.6.
 *
 * The store already owns every rule here (`payHoldingInstalment` builds the
 * payment, the gateway settles it and writes the receipt), so this page only
 * presents the bill and hands off.
 */
export function CitizenHolding() {
  const holdings = useStore((s) => s.holdings)
  const payHoldingInstalment = useStore((s) => s.payHoldingInstalment)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState<string | null>(null)

  // A presenter typing on stage should not be tripped by a dash or a Bangla
  // digit, so the lookup collapses both sides to bare alphanumerics.
  const found = useMemo(
    () => (searched ? findHolding(holdings, searched) : undefined),
    [holdings, searched],
  )

  const bill = found ? currentBill(found) : undefined

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearched(query)
  }

  function pay(instalmentNo: number) {
    if (!found || !bill) return
    const payment = payHoldingInstalment(found.holdingNo, bill.fiscalYear, instalmentNo, 'online')
    if (!payment) {
      toast.error('এই কিস্তিটি পরিশোধ করা যাচ্ছে না।')
      return
    }
    navigate(`/pay/${payment.id}`)
  }

  const unpaid = bill?.instalments.filter((i) => !i.paidAt) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-[20px] leading-tight">হোল্ডিং কর</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink/85">
          হোল্ডিং নম্বর দিয়ে আপনার বাড়ির কর ও বকেয়া দেখুন এবং অনলাইনে পরিশোধ করুন।
        </p>
      </div>

      <Card>
        <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field
            label="হোল্ডিং নম্বর"
            htmlFor="holding-no"
            hint="হোল্ডিং কর রসিদের উপরে লেখা থাকে, যেমন W05-0123"
            className="flex-1"
          >
            <Input
              id="holding-no"
              value={query}
              placeholder="W05-0123"
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" className="sm:mb-6">
            <Search size={15} />
            খুঁজুন
          </Button>
        </form>
      </Card>

      {searched !== null && !found && (
        <Card>
          <EmptyState
            icon={<Building2 size={26} strokeWidth={1.5} />}
            title="এই হোল্ডিং নম্বরটি পাওয়া যায়নি।"
            hint={
              holdings.length > 0
                ? `নম্বরটি রসিদের সাথে মিলিয়ে দেখুন। ডেমোতে দেখার জন্য একটি নম্বর: ${holdings[0].holdingNo}`
                : 'নম্বরটি রসিদের সাথে মিলিয়ে দেখুন।'
            }
          />
        </Card>
      )}

      {found && bill && (
        <>
          <Card title="হোল্ডিংয়ের তথ্য" subtitle={found.holdingNo}>
            <dl className="divide-y divide-rule/60">
              <Row label="মালিকের নাম" value={found.ownerName} />
              <Row label="ঠিকানা" value={found.address} />
              <Row label="ওয়ার্ড" value={`ওয়ার্ড ${toBnDigits(found.ward)}`} />
              <Row label="সম্পত্তির ধরন" value={found.propertyType} />
              <Row label="তলা" value={`${toBnDigits(found.floors)} তলা`} />
              <Row label="বার্ষিক মূল্যায়ন" value={formatTaka(found.annualValuation)} />
            </dl>
          </Card>

          <Card
            title={`${toBnDigits(bill.fiscalYear)} অর্থবছরের দাবি`}
            subtitle="ডেমো হার: বার্ষিক মূল্যায়নের উপর হিসাব করা"
          >
            <dl className="divide-y divide-rule/60">
              {bill.lines.map((line) => (
                <Row key={line.label} label={line.label} value={formatTaka(line.amount)} />
              ))}
              <Row label="মোট বার্ষিক দাবি" value={formatTaka(bill.total)} strong />
              {bill.arrears > 0 && (
                <>
                  <Row label="পূর্বের বকেয়া" value={formatTaka(bill.arrears)} />
                  <Row label="বকেয়ার সারচার্জ (৫%, ডেমো)" value={formatTaka(bill.surcharge)} />
                </>
              )}
            </dl>

            {bill.arrears > 0 && (
              <p className="mt-3 rounded-sm bg-amber/10 px-3 py-2 text-[12.5px] leading-relaxed text-ink/85">
                পূর্ববর্তী অর্থবছরের বকেয়া রয়েছে। বকেয়া পরিশোধের জন্য কর নির্ধারণ শাখায় যোগাযোগ করুন।
              </p>
            )}
          </Card>

          <Card
            title="কিস্তি"
            subtitle={
              unpaid.length === 0
                ? 'এই বছরের সব কিস্তি পরিশোধ হয়েছে।'
                : `${toBnDigits(unpaid.length)}টি কিস্তি বাকি আছে`
            }
          >
            <ul className="flex flex-col gap-2">
              {bill.instalments.map((inst) => {
                const receipt = inst.receiptId
                // Pay in order: the counter never takes a later quarter while an
                // earlier one is still open, and neither should the demo.
                const isNext = !inst.paidAt && unpaid[0]?.no === inst.no
                return (
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
                            {formatDateBn(inst.paidAt)} তারিখে পরিশোধিত
                          </span>
                        ) : isNext ? (
                          'পরিশোধের জন্য প্রস্তুত'
                        ) : (
                          'আগের কিস্তি পরিশোধের পর সক্রিয় হবে'
                        )}
                      </p>
                    </div>

                    {inst.paidAt ? (
                      receipt && (
                        <LinkButton to={`/print/receipt/${receipt}`} size="sm" target="_blank">
                          <Receipt size={14} />
                          রসিদ
                        </LinkButton>
                      )
                    ) : (
                      <Button
                        variant={isNext ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={!isNext}
                        onClick={() => pay(inst.no)}
                      >
                        পরিশোধ করুন
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>

            {unpaid.length > 1 && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                একবারে একটি কিস্তি পরিশোধ করা যায়, পুরনো কিস্তি আগে। বাকি{' '}
                {toBnDigits(unpaid.length)}টি কিস্তির মোট{' '}
                {formatTaka(unpaid.reduce((s, i) => s + i.amount, 0))} পরিশোধ করতে কিস্তিগুলো একের পর
                এক পরিশোধ করুন।
              </p>
            )}
          </Card>
        </>
      )}
    </div>
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
