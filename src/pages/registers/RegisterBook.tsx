import { Download, Plus, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { LedgerTable, type LedgerColumn, type LedgerRow } from '@/components/LedgerTable'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { Select } from '@/components/ui/Select'
import { WARDS } from '@/data/seed'
import { formatNumberBn, toBnDigits } from '@/lib/bn'
import { currentFiscalYear, fiscalYearOptions } from '@/lib/fiscal'
import { entryStatusTone } from '@/lib/status'
import { getRegister } from '@/registers'
import { useStore } from '@/store/useStore'
import { displayField, plainField } from '@/lib/registerFields'
import { SLA_LABEL, slaStatus } from '@/lib/sla'
import { downloadCsv } from '@/lib/csv'
import type { RegisterEntry } from '@/types'

export function RegisterBook() {
  const { key } = useParams()
  const config = getRegister(key)
  const entries = useStore((s) => s.entries)
  const role = useStore((s) => s.session?.role)

  const [fy, setFy] = useState(currentFiscalYear())
  const [ward, setWard] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const bookFields = useMemo(
    () => (config ? config.fields.filter((f) => f.showInBook) : []),
    [config],
  )

  const rows = useMemo(() => {
    if (!config) return []
    const dateOf = (e: RegisterEntry) =>
      (config.dateField === 'createdAt'
        ? e.createdAt
        : String(e.data[config.dateField] ?? '')
      ).slice(0, 10)
    return entries
      .filter((e) => e.registerKey === config.key && e.fiscalYear === fy)
      .filter((e) => ward === 'all' || String(e.ward) === ward)
      .filter((e) => {
        const date = dateOf(e)
        if (from && date < from) return false
        if (to && date > to) return false
        return true
      })
      .sort((a, b) => (a.serial ?? 0) - (b.serial ?? 0))
  }, [entries, config, fy, ward, from, to])

  if (!config) return <Navigate to="/" replace />

  const columns: LedgerColumn[] = [
    { key: 'serial', label: 'ক্রমিক নং', align: 'center' },
    ...bookFields.map((f) => ({
      key: f.key,
      label: f.label,
      align: (f.type === 'number' ? 'right' : f.type === 'ward' ? 'center' : 'left') as
        | 'left'
        | 'right'
        | 'center',
    })),
    { key: 'status', label: 'অবস্থা' },
    { key: 'sla', label: 'সময়সীমা' },
  ]

  const statusLabel = (key: string) => config.steps.find((s) => s.key === key)?.label ?? key
  const stepKeys = config.steps.map((s) => s.key)

  const ledgerRows: LedgerRow[] = rows.map((e) => {
    const sla = slaStatus(e)
    return {
      id: e.id,
      cancelled: !!e.cancelled,
      to: `/office/registers/${config.key}/${e.id}`,
      cells: [
        toBnDigits(e.serial ?? 0),
        ...bookFields.map((f) => displayField(f, e.data[f.key])),
        e.cancelled ? (
          <StatusBadge key="status" label="বাতিল" tone="danger" />
        ) : (
          <StatusBadge
            key="status"
            label={statusLabel(e.status)}
            tone={entryStatusTone(stepKeys, e.status)}
          />
        ),
        e.cancelled ? (
          '—'
        ) : (
          <StatusBadge
            key="sla"
            label={SLA_LABEL[sla]}
            tone={sla === 'overdue' ? 'danger' : sla === 'due-soon' ? 'pending' : 'success'}
          />
        ),
      ],
    }
  })

  const active = rows.filter((e) => !e.cancelled)
  const footer = [
    '',
    ...bookFields.map((f) => {
      if (config.totals?.includes(f.key)) {
        const sum = active.reduce((s, e) => s + Number(e.data[f.key] ?? 0), 0)
        return formatNumberBn(sum)
      }
      return ''
    }),
    `মোট ${toBnDigits(rows.length)} টি এন্ট্রি`,
    '',
  ]

  /** Officers open these in Excel, so the CSV carries plain values, not Bangla digits. */
  function exportCsv() {
    downloadCsv(`${config!.key}-${fy}`, rows, [
      { header: 'ক্রমিক নং', value: (e) => e.serial ?? '' },
      { header: 'সিরিয়াল', value: (e) => e.serialNo },
      ...bookFields.map((f) => ({
        header: f.label,
        value: (e: RegisterEntry) => plainField(f, e.data[f.key]),
      })),
      { header: 'অবস্থা', value: (e) => (e.cancelled ? 'বাতিল' : statusLabel(e.status)) },
      { header: 'সময়সীমা', value: (e) => (e.cancelled ? '' : SLA_LABEL[slaStatus(e)]) },
      { header: 'ট্র্যাকিং নং', value: (e) => e.trackingNo },
      { header: 'বাতিলের কারণ', value: (e) => e.cancelled?.reason ?? '' },
    ])
  }

  const canCreate = role ? config.createRoles.includes(role) : false

  return (
    <div className="print-landscape">
      <PageHeader
        title={config.title}
        subtitle={config.description}
        actions={
          <>
            <label className="sr-only" htmlFor="bk-fy">
              অর্থবছর
            </label>
            <Select id="bk-fy" value={fy} onChange={(e) => setFy(e.target.value)} className="w-32">
              {fiscalYearOptions(3).map((y) => (
                <option key={y} value={y}>
                  {toBnDigits(y)}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="bk-ward">
              ওয়ার্ড
            </label>
            <Select id="bk-ward" value={ward} onChange={(e) => setWard(e.target.value)} className="w-36">
              <option value="all">সকল ওয়ার্ড</option>
              {WARDS.map((w) => (
                <option key={w} value={String(w)}>
                  ওয়ার্ড {toBnDigits(w)}
                </option>
              ))}
            </Select>
            {canCreate && (
              <LinkButton to={`/office/registers/${config.key}/new`} variant="primary">
                <Plus size={14} />
                নতুন এন্ট্রি
              </LinkButton>
            )}
            <Button onClick={exportCsv}>
              <Download size={14} />
              CSV
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={14} />
              পাতা প্রিন্ট
            </Button>
          </>
        }
      />

      <div className="no-print mb-3 flex flex-wrap items-end gap-3 rounded-sm border border-rule/70 bg-white px-3 py-2.5">
        <Field label="তারিখ হতে" htmlFor="bk-from" className="w-40">
          <Input id="bk-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="তারিখ পর্যন্ত" htmlFor="bk-to" className="w-40">
          <Input id="bk-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        {(from || to) && (
          <Button
            size="sm"
            onClick={() => {
              setFrom('')
              setTo('')
            }}
          >
            তারিখ বাছাই মুছুন
          </Button>
        )}
        <p className="ml-auto text-[12.5px] text-muted">
          মোট {toBnDigits(rows.length)} টি লাইন দেখানো হচ্ছে
        </p>
      </div>

      <LedgerTable
        title={config.title}
        section={config.section}
        fiscalYear={toBnDigits(fy)}
        wardLabel={ward === 'all' ? 'সকল ওয়ার্ড' : `ওয়ার্ড ${toBnDigits(ward)}`}
        columns={columns}
        rows={ledgerRows}
        footer={footer}
        minWidth={`${Math.max(58, columns.length * 8)}rem`}
        emptyLabel="এই বাছাইয়ে রেজিস্টারে কোনো লাইন নেই।"
      />
    </div>
  )
}
