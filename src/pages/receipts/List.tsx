import { Printer, Receipt as ReceiptIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { Select } from '@/components/ui/Select'
import { PAYMENT_MODES } from '@/data/seed'
import { formatDateBn, formatTaka, formatTimeBn, toBnDigits } from '@/lib/bn'
import { currentFiscalYear, fiscalYearOptions } from '@/lib/fiscal'
import { useStore } from '@/store/useStore'

/** Local-date key (YYYY-MM-DD) for today. */
function todayKey(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function ReceiptList() {
  const receipts = useStore((s) => s.receipts)
  const licences = useStore((s) => s.licences)
  const [fy, setFy] = useState(currentFiscalYear())
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return receipts
      .filter((r) => r.fiscalYear === fy)
      .filter((r) =>
        !q ? true : [r.receiptNo, r.payerName, r.purpose, r.txnRef ?? ''].join(' ').toLowerCase().includes(q),
      )
      .sort((a, b) => b.no - a.no)
  }, [receipts, fy, query])

  const today = todayKey()
  const yearTotal = receipts.filter((r) => r.fiscalYear === fy).reduce((s, r) => s + r.total, 0)
  const todayReceipts = receipts.filter((r) => r.collectedAt.slice(0, 10) === today)
  const todayTotal = todayReceipts.reduce((s, r) => s + r.total, 0)

  const counterModes = PAYMENT_MODES.map((mode) => ({
    label: mode,
    rows: todayReceipts.filter((r) => r.channel === 'office' && r.mode === mode),
  }))
  const byMode = [
    ...counterModes,
    { label: 'অনলাইন', rows: todayReceipts.filter((r) => r.channel === 'online') },
  ].map((m) => ({
    label: m.label,
    count: m.rows.length,
    total: m.rows.reduce((s, r) => s + r.total, 0),
  }))

  return (
    <>
      <PageHeader
        title="রসিদ"
        subtitle="আদায়কৃত ফির রসিদ ও দৈনিক আদায়ের সারসংক্ষেপ।"
        actions={
          <>
            <label className="sr-only" htmlFor="rcp-fy">
              অর্থবছর
            </label>
            <Select id="rcp-fy" value={fy} onChange={(e) => setFy(e.target.value)} className="w-32">
              {fiscalYearOptions(3).map((y) => (
                <option key={y} value={y}>
                  {toBnDigits(y)}
                </option>
              ))}
            </Select>
            <LinkButton to="/office/receipts/daily" variant="primary">
              দৈনিক আদায়
            </LinkButton>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">এ অর্থবছরের মোট আদায়</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{formatTaka(yearTotal)}</p>
        </Card>
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">আজকের আদায়</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{formatTaka(todayTotal)}</p>
          <p className="text-[12px] text-muted">{toBnDigits(todayReceipts.length)} টি রসিদ</p>
        </Card>
        {byMode.map((m) => (
          <Card key={m.label} bodyClassName="px-4 py-3" className="hidden lg:block">
            <p className="text-[12.5px] text-muted">আজ — {m.label}</p>
            <p className="mt-0.5 font-display text-[19px] leading-tight">{formatTaka(m.total)}</p>
            <p className="text-[12px] text-muted">{toBnDigits(m.count)} টি</p>
          </Card>
        ))}
      </div>

      <Card
        title="রসিদের তালিকা"
        bodyClassName="p-0"
        actions={
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="রসিদ নং, জমাদানকারী…"
            className="w-56"
            aria-label="রসিদ অনুসন্ধান"
          />
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title="কোনো রসিদ নেই"
            hint="এই অর্থবছরে এখনো কোনো ফি আদায় হয়নি, অথবা অনুসন্ধানের সাথে কিছু মেলেনি।"
            icon={<ReceiptIcon size={26} strokeWidth={1.5} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-[13.5px]">
              <thead className="border-b border-rule/70 text-left text-[12.5px] text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">রসিদ নং</th>
                  <th scope="col" className="px-3 py-2 font-medium">বই / পাতা</th>
                  <th scope="col" className="px-3 py-2 font-medium">তারিখ</th>
                  <th scope="col" className="px-3 py-2 font-medium">জমাদানকারী</th>
                  <th scope="col" className="px-3 py-2 font-medium">খাত</th>
                  <th scope="col" className="px-3 py-2 font-medium">মাধ্যম</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">টাকা</th>
                  <th scope="col" className="px-3 py-2 font-medium">প্রিন্ট</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const source = r.source
                  const licence =
                    source.type === 'trade-licence'
                      ? licences.find((l) => l.id === source.id)
                      : undefined
                  return (
                    <tr key={r.id} className="border-b border-rule/50 last:border-0 hover:bg-forest-50/40">
                      <td className="px-3 py-2 align-top whitespace-nowrap font-medium">
                        {toBnDigits(r.receiptNo)}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap text-muted">
                        বই {toBnDigits(r.bookNo)}, পাতা {toBnDigits(r.pageNo)}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {formatDateBn(r.collectedAt)}
                        <span className="block text-[12px] text-muted">{formatTimeBn(r.collectedAt)}</span>
                      </td>
                      <td className="px-3 py-2 align-top">{r.payerName}</td>
                      <td className="px-3 py-2 align-top">
                        {licence ? (
                          <Link to={`/office/trade-licence/${licence.id}`} className="text-forest-700 hover:underline">
                            {licence.business.nameBn}
                          </Link>
                        ) : (
                          r.purpose
                        )}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {r.mode ?? `অনলাইন — ${r.method ?? ''}`}
                        {r.txnRef && (
                          <span className="block text-[12px] text-muted">{toBnDigits(r.txnRef)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right align-top whitespace-nowrap">{formatTaka(r.total)}</td>
                      <td className="px-3 py-2 align-top">
                        <Link
                          to={`/print/receipt/${r.id}`}
                          className="inline-flex items-center gap-1 text-forest-700 hover:underline"
                        >
                          <Printer size={13} />
                          রসিদ
                        </Link>
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
