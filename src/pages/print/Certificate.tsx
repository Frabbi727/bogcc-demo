import { ArrowLeft, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useParams } from 'react-router-dom'

import { Stamp } from '@/components/Stamp'
import { Button } from '@/components/ui/Button'
import { USERS } from '@/data/users'
import { wardInfo } from '@/data/wards'
import { banglaCalendarDate, formatDateBn, toBnDigits } from '@/lib/bn'
import { displayField } from '@/lib/registerFields'
import { stepAt } from '@/lib/records'
import { getRegister } from '@/registers'
import { useStore } from '@/store/useStore'
import type { Heir } from '@/types'

/**
 * Printable certificate for any register whose config declares one. The wording
 * and the fields come from the config, so a new certificate register needs no new
 * page here.
 */
export function PrintCertificate() {
  const { id } = useParams()
  const entry = useStore((s) => s.entries.find((e) => e.id === id))
  const config = getRegister(entry?.registerKey)
  const certificate = config?.certificate

  if (!entry || !config || !certificate) {
    return (
      <div className="p-8 text-center">
        <p>সনদ পাওয়া যায়নি।</p>
      </div>
    )
  }

  const issuedOn = stepAt(entry, config.steps[config.steps.length - 1].key) ?? entry.createdAt
  const councillor = wardInfo(entry.ward)?.councillor ?? USERS.councillor.name

  /** `{{field}}` placeholders are filled from the entry's own data. */
  const body = certificate.body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = entry.data[key]
    if (value === undefined || Array.isArray(value)) return ''
    const field = config.fields.find((f) => f.key === key)
    return field?.type === 'date' ? formatDateBn(String(value)) : toBnDigits(String(value))
  })

  const heirs = (entry.data.heirs as Heir[] | undefined) ?? []

  // The QR carries the data in the URL, so a phone can verify it without a server.
  const verifyUrl = `${window.location.origin}/verify?${new URLSearchParams({
    t: 'cert',
    ln: entry.certificateNo ?? entry.serialNo,
    bn: certificate.docTitle,
    on: entry.applicantName,
    vu: issuedOn.slice(0, 10),
    w: String(entry.ward),
  }).toString()}`

  return (
    <div className="min-h-screen bg-paper py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4">
        <Link
          to={`/office/registers/${config.key}/${entry.id}`}
          className="inline-flex items-center gap-1.5 text-[13.5px] text-forest-700 hover:underline"
        >
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
          <p className="font-display text-[13px] tracking-wide text-muted">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
          </p>
          <h1 className="font-display text-[26px] leading-tight">বগুড়া সিটি কর্পোরেশন</h1>
          <p className="font-display text-[13.5px] text-muted">{config.section}, বগুড়া</p>
          <h2 className="mt-2.5 inline-block border-2 border-ink/55 px-5 py-1 font-display text-[19px]">
            {certificate.docTitle}
          </h2>
        </header>

        <div className="mt-4 flex flex-wrap justify-between gap-2 font-display text-[14px]">
          <p>
            সনদ নং: <span className="font-medium">{toBnDigits(entry.certificateNo ?? '—')}</span>
          </p>
          <p>
            রেজিস্টার ক্রমিক নং: <span className="font-medium">{toBnDigits(entry.serial ?? '—')}</span>
          </p>
          <p>
            তারিখ: <span className="font-medium">{formatDateBn(issuedOn)}</span>
          </p>
        </div>

        <p className="mt-4 text-justify text-[14.5px] leading-[2]">{body}</p>

        {certificate.sections.map((section) => (
          <section key={section.label} className="mt-4">
            <h3 className="font-display text-[14px] text-muted">{section.label}</h3>
            <table className="mt-1 w-full border border-ink/25 text-[13.5px]">
              <tbody>
                {section.fields.map((key) => {
                  const field = config.fields.find((f) => f.key === key)
                  return (
                    <tr key={key} className="border-b border-ink/15 last:border-0">
                      <th
                        scope="row"
                        className="w-[34%] border-r border-ink/15 px-3 py-1.5 text-left font-normal text-muted"
                      >
                        {field?.label ?? key}
                      </th>
                      <td className="px-3 py-1.5">{displayField(field, entry.data[key])}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ))}

        {heirs.length > 0 && (
          <section className="mt-4">
            <h3 className="font-display text-[14px] text-muted">ওয়ারিশগণের তালিকা</h3>
            <table className="mt-1 w-full border border-ink/25 text-[13.5px]">
              <thead>
                <tr className="border-b border-ink/25 bg-paper">
                  <th className="w-12 border-r border-ink/15 px-3 py-1.5 font-normal">ক্রম</th>
                  <th className="border-r border-ink/15 px-3 py-1.5 text-left font-normal">নাম</th>
                  <th className="border-r border-ink/15 px-3 py-1.5 text-left font-normal">সম্পর্ক</th>
                  <th className="px-3 py-1.5 text-left font-normal">বয়স</th>
                </tr>
              </thead>
              <tbody>
                {heirs.map((heir, i) => (
                  <tr key={`${heir.name}-${i}`} className="border-b border-ink/15 last:border-0">
                    <td className="border-r border-ink/15 px-3 py-1.5 text-center">
                      {toBnDigits(i + 1)}
                    </td>
                    <td className="border-r border-ink/15 px-3 py-1.5">{heir.name}</td>
                    <td className="border-r border-ink/15 px-3 py-1.5">{heir.relation}</td>
                    <td className="px-3 py-1.5">{toBnDigits(heir.age)} বছর</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="mt-6 flex items-end justify-between gap-6">
          <div className="text-center">
            <QRCodeSVG value={verifyUrl} size={92} level="M" includeMargin={false} />
            <p className="mt-1 text-[11px] text-muted">যাচাইয়ের জন্য স্ক্যান করুন</p>
          </div>

          <Stamp label="অনুমোদিত" sub={formatDateBn(issuedOn)} />

          <div className="flex gap-8 text-center">
            {certificate.signatories.map((title, i) => (
              <div key={title} className="mt-8 w-44 border-t border-ink/60 pt-1 font-display text-[13px]">
                {i === 0 ? councillor : USERS.ceo.name}
                <span className="block text-[12px] text-muted">
                  {i === 0 ? `${title}, ওয়ার্ড ${toBnDigits(entry.ward)}` : title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-ink/20 pt-2.5 text-[11.5px] text-muted">
          <p>
            ইস্যুর তারিখ: {formatDateBn(issuedOn)} · {banglaCalendarDate(issuedOn)}
          </p>
          <p className="font-medium text-amber">ডেমো সংস্করণ — সকল তথ্য কাল্পনিক</p>
        </footer>
      </article>
    </div>
  )
}
