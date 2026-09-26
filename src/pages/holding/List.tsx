import { AlertTriangle, Download, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'

import { LedgerTable, type LedgerColumn, type LedgerRow } from '@/components/LedgerTable'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { Select } from '@/components/ui/Select'
import { WARDS } from '@/data/wards'
import { formatNumberBn, formatTaka, toBnDigits } from '@/lib/bn'
import { downloadCsv } from '@/lib/csv'
import { currentFiscalYear, fiscalYearOptions } from '@/lib/fiscal'
import {
  collectionRate,
  holdingLedger,
  ledgerTotals,
  normaliseHoldingNo,
  type HoldingLedgerRow,
} from '@/lib/holding'
import { useStore } from '@/store/useStore'

const COLUMNS: LedgerColumn[] = [
  { key: 'holdingNo', label: 'হোল্ডিং নং' },
  { key: 'owner', label: 'মালিকের নাম' },
  { key: 'address', label: 'ঠিকানা' },
  { key: 'ward', label: 'ওয়ার্ড', align: 'center' },
  { key: 'type', label: 'ধরন' },
  { key: 'valuation', label: 'বার্ষিক মূল্যায়ন', align: 'right' },
  { key: 'demand', label: 'বার্ষিক দাবি', align: 'right' },
  { key: 'paid', label: 'আদায়', align: 'right' },
  { key: 'instalments', label: 'কিস্তি', align: 'center' },
  { key: 'arrears', label: 'বকেয়া', align: 'right' },
  { key: 'outstanding', label: 'মোট অনাদায়ী', align: 'right' },
]

/**
 * The holding tax register (Spec v2 §10): one book line per holding, with the
 * year's demand, what has come in and what is still owed. The counter takes
 * money from the detail page, not here.
 */
export function HoldingList() {
  const holdings = useStore((s) => s.holdings)
  const [fy, setFy] = useState(currentFiscalYear())
  const [ward, setWard] = useState('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const needle = normaliseHoldingNo(query)
    const text = query.trim().toLowerCase()
    return holdingLedger(holdings, fy)
      .filter((r) => ward === 'all' || r.holding.ward === Number(ward))
      .filter((r) => {
        if (!text) return true
        if (needle && normaliseHoldingNo(r.holding.holdingNo).includes(needle)) return true
        return [r.holding.ownerName, r.holding.address, r.holding.area]
          .join(' ')
          .toLowerCase()
          .includes(text)
      })
  }, [holdings, fy, ward, query])

  const totals = ledgerTotals(rows)
  const rate = collectionRate(totals)

  function exportCsv() {
    downloadCsv(`holding-tax-${fy}`, rows, [
      { header: 'হোল্ডিং নং', value: (r: HoldingLedgerRow) => r.holding.holdingNo },
      { header: 'মালিকের নাম', value: (r: HoldingLedgerRow) => r.holding.ownerName },
      { header: 'মোবাইল', value: (r: HoldingLedgerRow) => r.holding.ownerMobile },
      { header: 'ঠিকানা', value: (r: HoldingLedgerRow) => r.holding.address },
      { header: 'ওয়ার্ড', value: (r: HoldingLedgerRow) => r.holding.ward },
      { header: 'ধরন', value: (r: HoldingLedgerRow) => r.holding.propertyType },
      { header: 'তলা', value: (r: HoldingLedgerRow) => r.holding.floors },
      { header: 'বার্ষিক মূল্যায়ন', value: (r: HoldingLedgerRow) => r.holding.annualValuation },
      { header: 'বার্ষিক দাবি', value: (r: HoldingLedgerRow) => r.demand },
      { header: 'আদায়', value: (r: HoldingLedgerRow) => r.paid },
      { header: 'চলতি বছরের বাকি', value: (r: HoldingLedgerRow) => r.due },
      { header: 'পূর্বের বকেয়া', value: (r: HoldingLedgerRow) => r.arrears },
      { header: 'সারচার্জ', value: (r: HoldingLedgerRow) => r.surcharge },
      { header: 'মোট অনাদায়ী', value: (r: HoldingLedgerRow) => r.outstanding },
    ])
  }

  const ledgerRows: LedgerRow[] = rows.map((r) => ({
    id: r.holding.holdingNo,
    to: `/office/holding/${r.holding.holdingNo}`,
    cells: [
      r.holding.holdingNo,
      r.holding.ownerName,
      <>
        <span className="text-[12.5px] text-muted">{r.holding.address}</span>
      </>,
      toBnDigits(r.holding.ward),
      <>
        {r.holding.propertyType}
        <span className="block text-[12px] text-muted">{toBnDigits(r.holding.floors)} তলা</span>
      </>,
      formatNumberBn(r.holding.annualValuation),
      formatNumberBn(r.demand),
      formatNumberBn(r.paid),
      `${toBnDigits(r.paidCount)}/${toBnDigits(4)}`,
      r.arrears + r.surcharge > 0 ? (
        <>
          <span className="text-stamp">{formatNumberBn(r.arrears + r.surcharge)}</span>
        </>
      ) : (
        '—'
      ),
      r.outstanding > 0 ? (
        <>
          <span className="font-medium">{formatNumberBn(r.outstanding)}</span>
        </>
      ) : (
        <>
          <span className="text-forest-700">পরিশোধিত</span>
        </>
      ),
    ],
  }))

  return (
    <div className="print-landscape">
      <PageHeader
        title="হোল্ডিং কর"
        subtitle="হোল্ডিংভিত্তিক দাবি, আদায় ও বকেয়ার রেজিস্টার। লাইনে ক্লিক করলে হোল্ডিংয়ের হিসাব খুলবে।"
        actions={
          <>
            <label className="sr-only" htmlFor="hold-fy">
              অর্থবছর
            </label>
            <Select id="hold-fy" value={fy} onChange={(e) => setFy(e.target.value)} className="w-32">
              {fiscalYearOptions(3).map((y) => (
                <option key={y} value={y}>
                  {toBnDigits(y)}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="hold-ward">
              ওয়ার্ড
            </label>
            <Select
              id="hold-ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-36"
            >
              <option value="all">সকল ওয়ার্ড</option>
              {WARDS.map((w) => (
                <option key={w} value={String(w)}>
                  ওয়ার্ড {toBnDigits(w)}
                </option>
              ))}
            </Select>
            <LinkButton to="/office/holding/defaulters">
              <AlertTriangle size={14} />
              খেলাপি তালিকা
            </LinkButton>
            <Button onClick={exportCsv} disabled={rows.length === 0}>
              <Download size={14} />
              CSV
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer size={14} />
              পাতা প্রিন্ট
            </Button>
          </>
        }
      />

      <div className="no-print mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">বছরের মোট দাবি</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{formatTaka(totals.demand)}</p>
          <p className="text-[12px] text-muted">{toBnDigits(totals.count)} টি হোল্ডিং</p>
        </Card>
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">আদায়</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{formatTaka(totals.paid)}</p>
          <p className="text-[12px] text-muted">দাবির {toBnDigits(rate)}%</p>
        </Card>
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">চলতি বছরের বাকি</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight">{formatTaka(totals.due)}</p>
        </Card>
        <Card bodyClassName="px-4 py-3">
          <p className="text-[12.5px] text-muted">পূর্বের বকেয়া ও সারচার্জ</p>
          <p className="mt-0.5 font-display text-[22px] leading-tight text-stamp">
            {formatTaka(totals.arrears + totals.surcharge)}
          </p>
        </Card>
      </div>

      <div className="no-print mb-3 flex justify-end">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="হোল্ডিং নং, মালিক, ঠিকানা…"
          className="w-64"
          aria-label="হোল্ডিং অনুসন্ধান"
        />
      </div>

      <LedgerTable
        title="হোল্ডিং কর রেজিস্টার"
        section="রাজস্ব শাখা"
        fiscalYear={toBnDigits(fy)}
        wardLabel={ward === 'all' ? 'সকল ওয়ার্ড' : `ওয়ার্ড ${toBnDigits(ward)}`}
        description="ডেমো হার: বার্ষিক মূল্যায়নের উপর হোল্ডিং কর ৭%, পরিচ্ছন্নতা রেট ৩%, সড়কবাতি রেট ২%; বকেয়ায় ৫% সারচার্জ।"
        columns={COLUMNS}
        rows={ledgerRows}
        minWidth="76rem"
        emptyLabel="এই বাছাইয়ে কোনো হোল্ডিং নেই।"
        footer={[
          `মোট ${toBnDigits(totals.count)} টি`,
          '',
          '',
          '',
          '',
          '',
          formatNumberBn(totals.demand),
          formatNumberBn(totals.paid),
          '',
          formatNumberBn(totals.arrears + totals.surcharge),
          formatNumberBn(totals.outstanding),
        ]}
      />
    </div>
  )
}
