import { Printer } from 'lucide-react'
import { useMemo, useState } from 'react'

import { LedgerTable, type LedgerColumn, type LedgerRow } from '@/components/LedgerTable'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { WARDS, businessTypeOf } from '@/data/seed'
import { formatDateBn, formatNumberBn, toBnDigits } from '@/lib/bn'
import { currentFiscalYear, fiscalYearOptions } from '@/lib/fiscal'
import { useStore } from '@/store/useStore'
import { approvedAt, approvedBy, receiptFor } from '@/lib/records'

const COLUMNS: LedgerColumn[] = [
  { key: 'serial', label: 'ক্রমিক নং', align: 'center' },
  { key: 'registerNo', label: 'লাইসেন্স নং' },
  { key: 'date', label: 'তারিখ' },
  { key: 'business', label: 'প্রতিষ্ঠানের নাম ও ঠিকানা' },
  { key: 'owner', label: 'মালিক ও পিতার নাম' },
  { key: 'type', label: 'ব্যবসার ধরন' },
  { key: 'ward', label: 'ওয়ার্ড', align: 'center' },
  { key: 'fee', label: 'ফি (টাকা)', align: 'right' },
  { key: 'receipt', label: 'রসিদ নং' },
  { key: 'remarks', label: 'মন্তব্য' },
  { key: 'approver', label: 'অনুমোদনকারী' },
]

export function TradeLicenceRegister() {
  const licences = useStore((s) => s.licences)
  const receipts = useStore((s) => s.receipts)
  const [fy, setFy] = useState(currentFiscalYear())
  const [ward, setWard] = useState('all')

  const entries = useMemo(
    () =>
      licences
        // Only lines that were actually written in the book have a serial.
        .filter((l) => l.serial && l.fiscalYear === fy)
        .filter((l) => ward === 'all' || l.business.ward === Number(ward))
        .sort((a, b) => (a.serial ?? 0) - (b.serial ?? 0)),
    [licences, fy, ward],
  )

  const totalFee = entries
    .filter((l) => l.status !== 'cancelled')
    .reduce((sum, l) => sum + l.feeTotal, 0)

  const rows: LedgerRow[] = entries.map((l) => {
    const receipt = receiptFor(receipts, l)
    return {
      id: l.id,
      cancelled: l.status === 'cancelled',
      to: `/office/trade-licence/${l.id}`,
      cells: [
        toBnDigits(l.serial ?? ''),
        toBnDigits(l.registerNo ?? ''),
        formatDateBn(approvedAt(l) ?? l.createdAt),
        <>
          <span className="font-medium">{l.business.nameBn}</span>
          <span className="block text-[12px] text-muted">{toBnDigits(l.business.address)}</span>
        </>,
        <>
          {l.owner.name}
          <span className="block text-[12px] text-muted">পিতা: {l.owner.fatherName}</span>
        </>,
        businessTypeOf(l.business.typeKey).label,
        toBnDigits(l.business.ward),
        formatNumberBn(l.feeTotal),
        receipt ? toBnDigits(receipt.receiptNo) : '—',
        l.status === 'cancelled'
          ? `বাতিল — ${l.cancelled?.reason ?? ''}`
          : l.kind === 'renewal'
            ? l.status === 'approved'
              ? 'নবায়ন — ফি আদায় বাকি'
              : 'নবায়ন'
            : l.status === 'approved'
              ? 'ফি আদায় বাকি'
              : 'ইস্যুকৃত',
        approvedBy(l) ?? '—',
      ],
    }
  })

  return (
    <div className="print-landscape">
      <PageHeader
        title="ট্রেড লাইসেন্স রেজিস্টার"
        subtitle="কাগজের রেজিস্টার খাতার পাতার মতোই সাজানো। কেবল অনুমোদিত রেকর্ড, ক্রমিক অনুসারে।"
        actions={
          <>
            <label className="sr-only" htmlFor="reg-fy">
              অর্থবছর
            </label>
            <Select id="reg-fy" value={fy} onChange={(e) => setFy(e.target.value)} className="w-32">
              {fiscalYearOptions(3).map((y) => (
                <option key={y} value={y}>
                  {toBnDigits(y)}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="reg-ward">
              ওয়ার্ড
            </label>
            <Select id="reg-ward" value={ward} onChange={(e) => setWard(e.target.value)} className="w-36">
              <option value="all">সকল ওয়ার্ড</option>
              {WARDS.map((w) => (
                <option key={w} value={String(w)}>
                  ওয়ার্ড {toBnDigits(w)}
                </option>
              ))}
            </Select>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer size={14} />
              পাতা প্রিন্ট
            </Button>
          </>
        }
      />

      <LedgerTable
        title="ট্রেড লাইসেন্স রেজিস্টার"
        section="রাজস্ব শাখা"
        fiscalYear={toBnDigits(fy)}
        wardLabel={ward === 'all' ? 'সকল ওয়ার্ড' : `ওয়ার্ড ${toBnDigits(ward)}`}
        columns={COLUMNS}
        rows={rows}
        minWidth="72rem"
        emptyLabel="এই অর্থবছর ও ওয়ার্ডে রেজিস্টারে কোনো লাইন লেখা হয়নি।"
        footer={[
          '',
          `মোট ${toBnDigits(entries.length)} টি এন্ট্রি`,
          '',
          '',
          '',
          '',
          '',
          formatNumberBn(totalFee),
          '',
          'বাতিল বাদে মোট আদায়যোগ্য',
          '',
        ]}
      />
    </div>
  )
}
