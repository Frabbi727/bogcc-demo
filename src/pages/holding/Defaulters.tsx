import { ArrowLeft, Download, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LinkButton } from '@/components/ui/LinkButton'
import { Select } from '@/components/ui/Select'
import { formatNumberBn, formatTaka, toBnDigits } from '@/lib/bn'
import { downloadCsv } from '@/lib/csv'
import { currentFiscalYear, fiscalYearOptions } from '@/lib/fiscal'
import { arrearsByWard, holdingLedger, ledgerTotals, type HoldingLedgerRow } from '@/lib/holding'
import { useStore } from '@/store/useStore'

/**
 * Who owes holding tax, and which wards owe the most (Spec v2 §10). A defaulter
 * here is any holding with something still unpaid — the year's balance, arrears
 * or the surcharge.
 */
export function HoldingDefaulters() {
  const holdings = useStore((s) => s.holdings)
  const [fy, setFy] = useState(currentFiscalYear())
  const [ward, setWard] = useState('all')

  const all = useMemo(
    () => holdingLedger(holdings, fy).filter((r) => r.outstanding > 0),
    [holdings, fy],
  )
  const byWard = useMemo(() => arrearsByWard(all), [all])
  const rows = useMemo(
    () =>
      (ward === 'all' ? all : all.filter((r) => r.holding.ward === Number(ward))).sort(
        (a, b) => b.outstanding - a.outstanding,
      ),
    [all, ward],
  )
  const totals = ledgerTotals(rows)

  function exportCsv() {
    downloadCsv(`holding-defaulters-${fy}`, rows, [
      { header: 'হোল্ডিং নং', value: (r: HoldingLedgerRow) => r.holding.holdingNo },
      { header: 'মালিকের নাম', value: (r: HoldingLedgerRow) => r.holding.ownerName },
      { header: 'মোবাইল', value: (r: HoldingLedgerRow) => r.holding.ownerMobile },
      { header: 'ঠিকানা', value: (r: HoldingLedgerRow) => r.holding.address },
      { header: 'ওয়ার্ড', value: (r: HoldingLedgerRow) => r.holding.ward },
      { header: 'চলতি বছরের বাকি', value: (r: HoldingLedgerRow) => r.due },
      { header: 'পূর্বের বকেয়া', value: (r: HoldingLedgerRow) => r.arrears },
      { header: 'সারচার্জ', value: (r: HoldingLedgerRow) => r.surcharge },
      { header: 'মোট অনাদায়ী', value: (r: HoldingLedgerRow) => r.outstanding },
      { header: 'পরিশোধিত কিস্তি', value: (r: HoldingLedgerRow) => r.paidCount },
    ])
  }

  return (
    <>
      <PageHeader
        title="হোল্ডিং কর খেলাপি তালিকা"
        subtitle="যেসব হোল্ডিংয়ে চলতি বছরের কিস্তি বা পূর্বের বকেয়া অনাদায়ী রয়েছে।"
        actions={
          <>
            <label className="sr-only" htmlFor="def-fy">
              অর্থবছর
            </label>
            <Select id="def-fy" value={fy} onChange={(e) => setFy(e.target.value)} className="w-32">
              {fiscalYearOptions(3).map((y) => (
                <option key={y} value={y}>
                  {toBnDigits(y)}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="def-ward">
              ওয়ার্ড
            </label>
            <Select
              id="def-ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-36"
            >
              <option value="all">সকল ওয়ার্ড</option>
              {byWard.map((w) => (
                <option key={w.ward} value={String(w.ward)}>
                  ওয়ার্ড {toBnDigits(w.ward)}
                </option>
              ))}
            </Select>
            <LinkButton to="/office/holding">
              <ArrowLeft size={14} />
              রেজিস্টার
            </LinkButton>
            <Button onClick={exportCsv} disabled={rows.length === 0}>
              <Download size={14} />
              CSV
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer size={14} />
              প্রিন্ট
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">খেলাপি হোল্ডিং</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{toBnDigits(totals.count)} টি</p>
        </Card>
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">মোট অনাদায়ী</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight text-stamp">
            {formatTaka(totals.outstanding)}
          </p>
        </Card>
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">এর মধ্যে পূর্বের বকেয়া ও সারচার্জ</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">
            {formatTaka(totals.arrears + totals.surcharge)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card title="ওয়ার্ডভিত্তিক বকেয়া" subtitle="সবচেয়ে বেশি অনাদায়ী আগে" bodyClassName="p-0">
          {byWard.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-muted">কোনো বকেয়া নেই।</p>
          ) : (
            <ul>
              {byWard.map((w) => (
                <li
                  key={w.ward}
                  className="flex items-center justify-between gap-2 border-b border-rule/50 px-4 py-2 last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => setWard(String(w.ward))}
                    className="text-left text-[13.5px] text-forest-700 hover:underline"
                  >
                    ওয়ার্ড {toBnDigits(w.ward)}
                    <span className="block text-[12px] text-muted">
                      {toBnDigits(w.count)} টি হোল্ডিং
                    </span>
                  </button>
                  <span className="text-[13px] font-medium whitespace-nowrap">
                    {formatNumberBn(w.outstanding)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="খেলাপি হোল্ডিং"
          subtitle={ward === 'all' ? 'সকল ওয়ার্ড' : `ওয়ার্ড ${toBnDigits(ward)}`}
          bodyClassName="p-0"
        >
          {rows.length === 0 ? (
            <EmptyState
              title="কোনো খেলাপি নেই"
              hint="এই বাছাইয়ে সব হোল্ডিংয়ের কর আদায় হয়ে গেছে।"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-[13.5px]">
                <thead className="border-b border-rule/70 text-left text-[12.5px] text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">হোল্ডিং নং</th>
                    <th scope="col" className="px-3 py-2 font-medium">মালিক ও ঠিকানা</th>
                    <th scope="col" className="px-3 py-2 font-medium">ওয়ার্ড</th>
                    <th scope="col" className="px-3 py-2 text-center font-medium">কিস্তি</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">চলতি বাকি</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">পূর্বের বকেয়া</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.holding.holdingNo}
                      className="border-b border-rule/50 last:border-0 hover:bg-forest-50/40"
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap font-medium">
                        <Link
                          to={`/office/holding/${r.holding.holdingNo}`}
                          className="text-forest-700 hover:underline"
                        >
                          {r.holding.holdingNo}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {r.holding.ownerName}
                        <span className="block text-[12px] text-muted">{r.holding.address}</span>
                        <span className="block text-[12px] text-muted">
                          মোবাইল: {toBnDigits(r.holding.ownerMobile)}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        ওয়ার্ড {toBnDigits(r.holding.ward)}
                      </td>
                      <td className="px-3 py-2 text-center align-top whitespace-nowrap">
                        {toBnDigits(r.paidCount)}/{toBnDigits(4)}
                      </td>
                      <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                        {formatNumberBn(r.due)}
                      </td>
                      <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                        {r.arrears + r.surcharge > 0 ? formatNumberBn(r.arrears + r.surcharge) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right align-top font-medium whitespace-nowrap">
                        {formatNumberBn(r.outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-ink/20 bg-forest-50/60 font-medium">
                    <td className="px-3 py-2" colSpan={4}>
                      মোট {toBnDigits(totals.count)} টি হোল্ডিং
                    </td>
                    <td className="px-3 py-2 text-right">{formatNumberBn(totals.due)}</td>
                    <td className="px-3 py-2 text-right">
                      {formatNumberBn(totals.arrears + totals.surcharge)}
                    </td>
                    <td className="px-3 py-2 text-right">{formatNumberBn(totals.outstanding)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
