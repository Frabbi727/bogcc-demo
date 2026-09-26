import { ArrowLeft, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import {
  amountInWords,
  banglaCalendarDate,
  formatDateBn,
  formatTaka,
  formatTimeBn,
  toBnDigits,
} from '@/lib/bn'
import { byChannel, byHead, cashTotal, receiptsOn, totalOf } from '@/lib/collection'
import { fiscalYearOf } from '@/lib/fiscal'
import { useStore } from '@/store/useStore'
import type { CollectionLine } from '@/lib/collection'

/**
 * দৈনিক আদায় বিবরণী — the sheet the cashier signs and the accounts officer
 * counters at the end of the day (Spec v2 §14). Opens directly at
 * `/print/daily/:date` so it can be shared or bookmarked.
 */
export function PrintDailyStatement() {
  const { date } = useParams()
  const receipts = useStore((s) => s.receipts)
  const day = date ?? ''
  const rows = receiptsOn(receipts, day)

  // A day with no receipts still prints: an empty statement is a real record.
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(day)
  if (!isDate) {
    return (
      <div className="p-8 text-center">
        <p>তারিখটি বোঝা যায়নি।</p>
      </div>
    )
  }

  const at = `${day}T00:00:00`
  const channels = byChannel(rows)
  const heads = byHead(rows).filter((l) => l.count > 0)
  const total = totalOf(rows)
  const cash = cashTotal(rows)

  return (
    <div className="min-h-screen bg-paper py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4">
        <Link
          to="/office/receipts/daily"
          className="inline-flex items-center gap-1.5 text-[13.5px] text-forest-700 hover:underline"
        >
          <ArrowLeft size={14} />
          ফিরে যান
        </Link>
        <Button variant="primary" onClick={() => window.print()}>
          <Printer size={14} />
          প্রিন্ট করুন
        </Button>
      </div>

      <article className="print-sheet mx-auto max-w-[210mm] bg-page px-10 py-8 shadow-sm print:shadow-none">
        <header className="border-b-2 border-double border-ink/40 pb-3 text-center">
          <h1 className="font-display text-[24px] leading-tight">বগুড়া সিটি কর্পোরেশন</h1>
          <p className="font-display text-[13px] text-muted">হিসাব শাখা, বগুড়া</p>
          <h2 className="mt-2 inline-block border-2 border-ink/55 px-5 py-1 font-display text-[18px]">
            দৈনিক আদায় বিবরণী
          </h2>
        </header>

        <div className="mt-4 flex flex-wrap justify-between gap-y-1 font-display text-[14px]">
          <p>
            তারিখ: <span className="font-medium">{formatDateBn(at)}</span>
          </p>
          <p>অর্থবছর: {toBnDigits(fiscalYearOf(at))}</p>
          <p>রসিদ সংখ্যা: {toBnDigits(rows.length)} টি</p>
        </div>
        <p className="mt-0.5 text-[12.5px] text-muted">{banglaCalendarDate(at)}</p>

        <SummaryTable title="মাধ্যম অনুযায়ী আদায়" lines={channels} total={total} />
        <SummaryTable title="খাত অনুযায়ী আদায়" lines={heads} total={total} />

        <table className="mt-4 w-full border border-ink/25 text-[12.5px]">
          <thead>
            <tr className="border-b border-ink/25 bg-forest-50/70">
              <th scope="col" className="px-2 py-1.5 text-left font-display font-normal">রসিদ নং</th>
              <th scope="col" className="px-2 py-1.5 text-left font-display font-normal">বই/পাতা</th>
              <th scope="col" className="px-2 py-1.5 text-left font-display font-normal">সময়</th>
              <th scope="col" className="px-2 py-1.5 text-left font-display font-normal">জমাদানকারী</th>
              <th scope="col" className="px-2 py-1.5 text-left font-display font-normal">খাত</th>
              <th scope="col" className="px-2 py-1.5 text-left font-display font-normal">মাধ্যম</th>
              <th scope="col" className="px-2 py-1.5 text-right font-display font-normal">টাকা</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-muted">
                  এই দিনে কোনো টাকা আদায় হয়নি।
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/12 last:border-0 align-top">
                <td className="px-2 py-1.5 whitespace-nowrap">{toBnDigits(r.receiptNo)}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  {toBnDigits(r.bookNo)}/{toBnDigits(r.pageNo)}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">{formatTimeBn(r.collectedAt)}</td>
                <td className="px-2 py-1.5">{r.payerName}</td>
                <td className="px-2 py-1.5">{r.purpose}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  {r.mode ?? `অনলাইন — ${r.method ?? ''}`}
                </td>
                <td className="px-2 py-1.5 text-right whitespace-nowrap">{formatTaka(r.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink/25 font-medium">
              <td className="px-2 py-1.5" colSpan={6}>
                দিনের সর্বমোট
              </td>
              <td className="px-2 py-1.5 text-right">{formatTaka(total)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-2.5 border border-ink/20 bg-forest-50/50 px-3 py-2 text-[13.5px]">
          <span className="text-muted">কথায়: </span>
          <span className="font-display">{amountInWords(total)}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-[13.5px]">
          <p>
            <span className="text-muted">নগদ জমা: </span>
            {formatTaka(cash)}
          </p>
          <p>
            <span className="text-muted">নগদ ছাড়া (বিকাশ/ব্যাংক/অনলাইন): </span>
            {formatTaka(total - cash)}
          </p>
        </div>

        <div className="mt-10 flex items-end justify-between gap-6 text-center font-display text-[13px]">
          <div className="w-52 border-t border-ink/60 pt-1">
            ক্যাশিয়ার
            <span className="block text-[12px] text-muted">স্বাক্ষর ও তারিখ</span>
          </div>
          <div className="w-52 border-t border-ink/60 pt-1">
            হিসাবরক্ষণ কর্মকর্তা
            <span className="block text-[12px] text-muted">স্বাক্ষর ও তারিখ</span>
          </div>
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink/20 pt-2.5 text-[11.5px] text-muted">
          <p>এই বিবরণী কম্পিউটারে তৈরি, রসিদ বই থেকে সরাসরি হিসাব করা।</p>
          <p className="font-medium text-amber">ডেমো সংস্করণ — সকল তথ্য কাল্পনিক</p>
        </footer>
      </article>
    </div>
  )
}

function SummaryTable({
  title,
  lines,
  total,
}: {
  title: string
  lines: CollectionLine[]
  total: number
}) {
  return (
    <table className="mt-4 w-full border border-ink/25 text-[13.5px]">
      <thead>
        <tr className="border-b border-ink/25 bg-forest-50/70">
          <th scope="col" className="px-3 py-1.5 text-left font-display font-normal">
            {title}
          </th>
          <th scope="col" className="w-24 px-3 py-1.5 text-right font-display font-normal">
            সংখ্যা
          </th>
          <th scope="col" className="w-36 px-3 py-1.5 text-right font-display font-normal">
            টাকা
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr key={l.label} className="border-b border-ink/12 last:border-0">
            <td className="px-3 py-1.5">{l.label}</td>
            <td className="px-3 py-1.5 text-right">{toBnDigits(l.count)}</td>
            <td className="px-3 py-1.5 text-right">{formatTaka(l.total)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-ink/25 font-medium">
          <td className="px-3 py-1.5">মোট</td>
          <td className="px-3 py-1.5 text-right">
            {toBnDigits(lines.reduce((s, l) => s + l.count, 0))}
          </td>
          <td className="px-3 py-1.5 text-right">{formatTaka(total)}</td>
        </tr>
      </tfoot>
    </table>
  )
}
