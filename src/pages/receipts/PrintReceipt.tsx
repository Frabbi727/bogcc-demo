import { ArrowLeft, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { amountInWords, banglaCalendarDate, formatDateBn, formatTaka, formatTimeBn, toBnDigits } from '@/lib/bn'
import { useStore } from '@/store/useStore'

export function PrintReceipt() {
  const { id } = useParams()
  const receipt = useStore((s) => s.receipts.find((r) => r.id === id))
  const licence = useStore((s) => s.licences.find((l) => l.id === receipt?.licenceId))

  if (!receipt) {
    return (
      <div className="p-8 text-center">
        <p>রসিদ পাওয়া যায়নি।</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4">
        <Link
          to={licence ? `/trade-licence/${licence.id}` : '/receipts'}
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
            টাকা আদায়ের রসিদ
          </h2>
        </header>

        <div className="mt-4 flex flex-wrap justify-between gap-y-1 font-display text-[14px]">
          <p>
            রসিদ নং: <span className="font-medium">{toBnDigits(receipt.receiptNo)}</span>
          </p>
          <p>
            বই নং {toBnDigits(receipt.bookNo)}, পাতা {toBnDigits(receipt.pageNo)}
          </p>
          <p>
            তারিখ: <span className="font-medium">{formatDateBn(receipt.collectedAt)}</span>
          </p>
        </div>
        <p className="mt-0.5 text-[12.5px] text-muted">
          {banglaCalendarDate(receipt.collectedAt)} · {formatTimeBn(receipt.collectedAt)} · অর্থবছর{' '}
          {toBnDigits(receipt.fiscalYear)}
        </p>

        <table className="mt-4 w-full border border-ink/25 text-[13.5px]">
          <tbody>
            {[
              ['জমাদানকারীর নাম', receipt.payerName],
              ['প্রতিষ্ঠান', licence ? licence.business.nameBn : receipt.purpose],
              [
                'ঠিকানা',
                licence ? toBnDigits(licence.business.address) : '—',
              ],
              ['খাত', receipt.purpose],
              ['লাইসেন্স নং', licence?.licenceNo ? toBnDigits(licence.licenceNo) : '—'],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-ink/15 last:border-0">
                <th scope="row" className="w-[34%] border-r border-ink/15 px-3 py-1.5 text-left font-normal text-muted">
                  {label}
                </th>
                <td className="px-3 py-1.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mt-3.5 w-full border border-ink/25 text-[13.5px]">
          <thead>
            <tr className="border-b border-ink/25 bg-forest-50/70">
              <th scope="col" className="w-12 px-3 py-1.5 text-left font-display font-normal">ক্রম</th>
              <th scope="col" className="px-3 py-1.5 text-left font-display font-normal">বিবরণ</th>
              <th scope="col" className="px-3 py-1.5 text-right font-display font-normal">টাকা</th>
            </tr>
          </thead>
          <tbody>
            {receipt.feeLines.map((line, i) => (
              <tr key={line.label} className="border-b border-ink/12 last:border-0">
                <td className="px-3 py-1.5">{toBnDigits(i + 1)}</td>
                <td className="px-3 py-1.5">{line.label}</td>
                <td className="px-3 py-1.5 text-right">{formatTaka(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink/25 font-medium">
              <td className="px-3 py-1.5" colSpan={2}>
                সর্বমোট
              </td>
              <td className="px-3 py-1.5 text-right">{formatTaka(receipt.total)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-2.5 border border-ink/20 bg-forest-50/50 px-3 py-2 text-[13.5px]">
          <span className="text-muted">কথায়: </span>
          <span className="font-display">{amountInWords(receipt.total)}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-[13.5px]">
          <p>
            <span className="text-muted">পরিশোধের মাধ্যম: </span>
            {receipt.mode}
          </p>
          {receipt.txnRef && (
            <p>
              <span className="text-muted">লেনদেন রেফারেন্স: </span>
              {toBnDigits(receipt.txnRef)}
            </p>
          )}
        </div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="text-[12px] text-muted">
            <p>জমাদানকারীর স্বাক্ষর</p>
            <div className="mt-6 w-44 border-t border-ink/50" />
          </div>
          <div className="text-center font-display text-[13px]">
            <div className="mt-6 w-52 border-t border-ink/60 pt-1">
              {receipt.collectedBy}
              <span className="block text-[12px] text-muted">হিসাবরক্ষক / ক্যাশিয়ার</span>
            </div>
          </div>
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink/20 pt-2.5 text-[11.5px] text-muted">
          <p>এই রসিদ কম্পিউটারে তৈরি, কাগজের রসিদ বইয়ের বিকল্প।</p>
          <p className="font-medium text-amber">ডেমো সংস্করণ — সকল তথ্য কাল্পনিক</p>
        </footer>
      </article>
    </div>
  )
}
