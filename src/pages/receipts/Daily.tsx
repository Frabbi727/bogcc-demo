import { Download, Printer, Receipt as ReceiptIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { formatDateBn, formatNumberBn, formatTaka, formatTimeBn, toBnDigits } from '@/lib/bn'
import {
  byChannel,
  byHead,
  cashTotal,
  dateKey,
  receiptsOn,
  totalOf,
  type CollectionLine,
} from '@/lib/collection'
import { downloadCsv } from '@/lib/csv'
import { receiptTargetPath } from '@/lib/records'
import { useStore } from '@/store/useStore'
import type { Receipt } from '@/types'

/**
 * One day's collection, the way the accounts desk closes the till: totals by
 * channel and by head, then the receipt lines that make them up (Spec v2 §14).
 */
export function DailyCollection() {
  const receipts = useStore((s) => s.receipts)
  const [day, setDay] = useState(dateKey())

  const rows = useMemo(() => receiptsOn(receipts, day), [receipts, day])
  const heads = byHead(rows).filter((l) => l.count > 0)
  const channels = byChannel(rows).filter((l) => l.count > 0)
  const total = totalOf(rows)
  const cash = cashTotal(rows)

  function exportCsv() {
    downloadCsv(`daily-collection-${day}`, rows, [
      { header: 'রসিদ নং', value: (r: Receipt) => r.receiptNo },
      { header: 'বই', value: (r: Receipt) => r.bookNo },
      { header: 'পাতা', value: (r: Receipt) => r.pageNo },
      { header: 'সময়', value: (r: Receipt) => r.collectedAt },
      { header: 'জমাদানকারী', value: (r: Receipt) => r.payerName },
      { header: 'খাত', value: (r: Receipt) => r.purpose },
      { header: 'মাধ্যম', value: (r: Receipt) => r.mode ?? `অনলাইন — ${r.method ?? ''}` },
      { header: 'লেনদেন রেফারেন্স', value: (r: Receipt) => r.txnRef ?? '' },
      { header: 'আদায়কারী', value: (r: Receipt) => r.collectedBy },
      { header: 'টাকা', value: (r: Receipt) => r.total },
    ])
  }

  return (
    <>
      <PageHeader
        title="দৈনিক আদায়"
        subtitle="একদিনের আদায় — মাধ্যম ও খাত অনুযায়ী সারসংক্ষেপ, এবং প্রতিটি রসিদের লাইন।"
        actions={
          <>
            <label className="sr-only" htmlFor="daily-date">
              তারিখ
            </label>
            <Input
              id="daily-date"
              type="date"
              value={day}
              max={dateKey()}
              onChange={(e) => setDay(e.target.value || dateKey())}
              className="w-40"
            />
            <LinkButton to="/office/receipts">সব রসিদ</LinkButton>
            <Button onClick={exportCsv} disabled={rows.length === 0}>
              <Download size={14} />
              CSV
            </Button>
            <LinkButton to={`/print/daily/${day}`} variant="primary" target="_blank">
              <Printer size={14} />
              আদায় বিবরণী
            </LinkButton>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">{formatDateBn(`${day}T00:00:00`)} — মোট আদায়</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{formatTaka(total)}</p>
          <p className="text-[12px] text-muted">{toBnDigits(rows.length)} টি রসিদ</p>
        </Card>
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">নগদ (জমা দিতে হবে)</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{formatTaka(cash)}</p>
        </Card>
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">নগদ ছাড়া (বিকাশ/ব্যাংক/অনলাইন)</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{formatTaka(total - cash)}</p>
        </Card>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <SummaryCard title="মাধ্যম অনুযায়ী" lines={channels} total={total} />
        <SummaryCard title="খাত অনুযায়ী" lines={heads} total={total} />
      </div>

      <Card title="রসিদের লাইন" subtitle={formatDateBn(`${day}T00:00:00`)} bodyClassName="p-0">
        {rows.length === 0 ? (
          <EmptyState
            title="এই দিনে কোনো আদায় হয়নি"
            hint="অন্য তারিখ বেছে নিন, অথবা কাউন্টার থেকে একটি ফি আদায় করে দেখুন।"
            icon={<ReceiptIcon size={26} strokeWidth={1.5} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-[13.5px]">
              <thead className="border-b border-rule/70 text-left text-[12.5px] text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">রসিদ নং</th>
                  <th scope="col" className="px-3 py-2 font-medium">সময়</th>
                  <th scope="col" className="px-3 py-2 font-medium">জমাদানকারী</th>
                  <th scope="col" className="px-3 py-2 font-medium">খাত</th>
                  <th scope="col" className="px-3 py-2 font-medium">মাধ্যম</th>
                  <th scope="col" className="px-3 py-2 font-medium">আদায়কারী</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">টাকা</th>
                  <th scope="col" className="px-3 py-2 font-medium">প্রিন্ট</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-rule/50 last:border-0 hover:bg-forest-50/40">
                    <td className="px-3 py-2 align-top whitespace-nowrap font-medium">
                      <Link to={receiptTargetPath(r)} className="text-forest-700 hover:underline">
                        {toBnDigits(r.receiptNo)}
                      </Link>
                      <span className="block text-[12px] text-muted">
                        বই {toBnDigits(r.bookNo)}, পাতা {toBnDigits(r.pageNo)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      {formatTimeBn(r.collectedAt)}
                    </td>
                    <td className="px-3 py-2 align-top">{r.payerName}</td>
                    <td className="px-3 py-2 align-top">{r.purpose}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      {r.mode ?? `অনলাইন — ${r.method ?? ''}`}
                      {r.txnRef && (
                        <span className="block text-[12px] text-muted">{toBnDigits(r.txnRef)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">{r.collectedBy}</td>
                    <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                      {formatNumberBn(r.total)}
                    </td>
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
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink/20 bg-forest-50/60 font-medium">
                  <td className="px-3 py-2" colSpan={6}>
                    দিনের মোট
                  </td>
                  <td className="px-3 py-2 text-right">{formatNumberBn(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function SummaryCard({
  title,
  lines,
  total,
}: {
  title: string
  lines: CollectionLine[]
  total: number
}) {
  return (
    <Card title={title} bodyClassName={lines.length ? 'p-0' : undefined}>
      {lines.length === 0 ? (
        <p className="text-[13px] text-muted">এই দিনে কোনো আদায় হয়নি।</p>
      ) : (
        <table className="w-full text-[13.5px]">
          <tbody>
            {lines.map((l) => (
              <tr key={l.label} className="border-b border-rule/50 last:border-0">
                <td className="px-4 py-2">{l.label}</td>
                <td className="px-4 py-2 text-right text-[12.5px] text-muted whitespace-nowrap">
                  {toBnDigits(l.count)} টি
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">{formatNumberBn(l.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/15 bg-forest-50/60 font-medium">
              <td className="px-4 py-2" colSpan={2}>
                মোট
              </td>
              <td className="px-4 py-2 text-right">{formatNumberBn(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </Card>
  )
}
