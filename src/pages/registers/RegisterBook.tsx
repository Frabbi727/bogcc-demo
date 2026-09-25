import { Plus, Printer } from 'lucide-react'
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
import { displayField } from '@/lib/registerFields'

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
    return entries
      .filter((e) => e.registerKey === config.key && e.fiscalYear === fy)
      .filter((e) => ward === 'all' || String(e.data.ward ?? '') === ward)
      .filter((e) => {
        const date = String(e.data[config.dateField] ?? '')
        if (from && date < from) return false
        if (to && date > to) return false
        return true
      })
      .sort((a, b) => a.serial - b.serial)
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
  ]

  const ledgerRows: LedgerRow[] = rows.map((e) => ({
    id: e.id,
    cancelled: !!e.cancelledAt,
    to: `/registers/${config.key}/${e.id}`,
    cells: [
      toBnDigits(e.serial),
      ...bookFields.map((f) => displayField(f, e.data[f.key])),
      e.cancelledAt ? (
        <StatusBadge key="status" label="বাতিল" tone="danger" />
      ) : (
        <StatusBadge key="status" label={e.status} tone={entryStatusTone(config.statuses, e.status)} />
      ),
    ],
  }))

  const active = rows.filter((e) => !e.cancelledAt)
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
  ]

  const canCreate = role ? config.roles.create.includes(role) : false

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
              <LinkButton to={`/registers/${config.key}/new`} variant="primary">
                <Plus size={14} />
                নতুন এন্ট্রি
              </LinkButton>
            )}
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
