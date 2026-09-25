import { ArrowLeft, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useParams } from 'react-router-dom'

import { Stamp } from '@/components/Stamp'
import { Button } from '@/components/ui/Button'
import { businessTypeOf } from '@/data/seed'
import { amountInWords, banglaCalendarDate, formatDateBn, formatTaka, toBnDigits } from '@/lib/bn'
import { validUntil } from '@/lib/fiscal'
import { useStore } from '@/store/useStore'

export function PrintLicence() {
  const { id } = useParams()
  const licence = useStore((s) => s.licences.find((l) => l.id === id))
  const receipt = useStore((s) => s.receipts.find((r) => r.licenceId === id))

  if (!licence) {
    return (
      <div className="p-8 text-center">
        <p>রেকর্ড পাওয়া যায়নি।</p>
      </div>
    )
  }

  const expiry = validUntil(licence.fiscalYear)
  const type = businessTypeOf(licence.business.typeKey)

  // The QR carries the data in the URL, so a phone can verify it offline.
  const verifyUrl = `${window.location.origin}/verify?${new URLSearchParams({
    ln: licence.licenceNo ?? licence.appNo,
    bn: licence.business.nameBn,
    on: licence.owner.name,
    vu: expiry.slice(0, 10),
    w: String(licence.business.ward),
  }).toString()}`

  return (
    <div className="min-h-screen bg-paper py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4">
        <Link to={`/trade-licence/${licence.id}`} className="inline-flex items-center gap-1.5 text-[13.5px] text-forest-700 hover:underline">
          <ArrowLeft size={14} />
          রেকর্ডে ফিরে যান
        </Link>
        <Button variant="primary" onClick={() => window.print()}>
          <Printer size={14} />
          প্রিন্ট করুন
        </Button>
      </div>

      <article className="print-sheet mx-auto max-w-[210mm] bg-page px-10 py-8 shadow-sm print:shadow-none">
        <header className="border-b-2 border-double border-ink/40 pb-3 text-center">
          <p className="font-display text-[13px] tracking-wide text-muted">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
          <h1 className="font-display text-[26px] leading-tight">বগুড়া সিটি কর্পোরেশন</h1>
          <p className="font-display text-[13.5px] text-muted">রাজস্ব শাখা, বগুড়া</p>
          <h2 className="mt-2.5 inline-block border-2 border-ink/55 px-5 py-1 font-display text-[19px]">
            ট্রেড লাইসেন্স
          </h2>
        </header>

        <div className="mt-4 flex flex-wrap justify-between gap-2 font-display text-[14px]">
          <p>
            লাইসেন্স নং: <span className="font-medium">{toBnDigits(licence.licenceNo ?? '—')}</span>
          </p>
          <p>
            রেজিস্টার ক্রমিক নং: <span className="font-medium">{toBnDigits(licence.serial ?? '—')}</span>
          </p>
          <p>
            অর্থবছর: <span className="font-medium">{toBnDigits(licence.fiscalYear)}</span>
          </p>
        </div>

        <p className="mt-4 text-[14px] leading-relaxed">
          নিম্নবর্ণিত প্রতিষ্ঠানকে বগুড়া সিটি কর্পোরেশন এলাকায় ব্যবসা পরিচালনার জন্য এই ট্রেড লাইসেন্স
          প্রদান করা হলো। এই লাইসেন্সের মেয়াদ{' '}
          <span className="font-medium">{formatDateBn(expiry)}</span> পর্যন্ত বলবৎ থাকবে এবং প্রতি
          অর্থবছরে নবায়ন করতে হবে।
        </p>

        <table className="mt-4 w-full border border-ink/25 text-[13.5px]">
          <tbody>
            {[
              ['প্রতিষ্ঠানের নাম', `${licence.business.nameBn} (${licence.business.nameEn})`],
              ['ব্যবসার ধরন', type.label],
              ['ব্যবসার প্রকৃতি', licence.business.nature],
              ['ঠিকানা', toBnDigits(licence.business.address)],
              ['হোল্ডিং নং / ওয়ার্ড', `${toBnDigits(licence.business.holdingNo)} / ওয়ার্ড ${toBnDigits(licence.business.ward)}`],
              ['মালিকের নাম', licence.owner.name],
              ['পিতার নাম', licence.owner.fatherName],
              ['মাতার নাম', licence.owner.motherName],
              ['জাতীয় পরিচয়পত্র নং', toBnDigits(licence.owner.nid)],
              ['মোবাইল', toBnDigits(licence.owner.mobile)],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-ink/15 last:border-0">
                <th scope="row" className="w-[38%] border-r border-ink/15 px-3 py-1.5 text-left font-normal text-muted">
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
              <th scope="col" className="px-3 py-1.5 text-left font-display font-normal">ফি বিবরণ (ডেমো হার)</th>
              <th scope="col" className="px-3 py-1.5 text-right font-display font-normal">টাকা</th>
            </tr>
          </thead>
          <tbody>
            {licence.feeLines.map((line) => (
              <tr key={line.label} className="border-b border-ink/12 last:border-0">
                <td className="px-3 py-1.5">{line.label}</td>
                <td className="px-3 py-1.5 text-right">{formatTaka(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink/25 font-medium">
              <td className="px-3 py-1.5">মোট</td>
              <td className="px-3 py-1.5 text-right">{formatTaka(licence.feeTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-1.5 text-[12.5px] text-muted">
          কথায়: {amountInWords(licence.feeTotal)}
          {receipt && <> · রসিদ নং {toBnDigits(receipt.receiptNo)}</>}
        </p>

        <div className="mt-6 flex items-end justify-between gap-6">
          <div className="text-center">
            <QRCodeSVG value={verifyUrl} size={92} level="M" includeMargin={false} />
            <p className="mt-1 text-[11px] text-muted">যাচাইয়ের জন্য স্ক্যান করুন</p>
          </div>

          <Stamp label="অনুমোদিত" sub={licence.approvedAt ? formatDateBn(licence.approvedAt) : undefined} />

          <div className="text-center">
            <div className="mt-8 w-52 border-t border-ink/60 pt-1 font-display text-[13px]">
              {licence.approvedBy}
              <span className="block text-[12px] text-muted">লাইসেন্স অফিসার</span>
            </div>
          </div>
        </div>

        <footer className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-ink/20 pt-2.5 text-[11.5px] text-muted">
          <p>
            ইস্যুর তারিখ: {licence.issuedAt ? formatDateBn(licence.issuedAt) : '—'} ·{' '}
            {licence.issuedAt ? banglaCalendarDate(licence.issuedAt) : ''}
          </p>
          <p className="font-medium text-amber">ডেমো সংস্করণ — সকল তথ্য কাল্পনিক</p>
        </footer>
      </article>
    </div>
  )
}
