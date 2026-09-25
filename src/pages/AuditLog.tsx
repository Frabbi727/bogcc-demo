import { Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { USERS } from '@/data/seed'
import { formatDateBn, formatTimeBn, toBnDigits } from '@/lib/bn'
import { REGISTERS } from '@/registers'
import { useStore } from '@/store/useStore'
import type { AuditEntry } from '@/types'

const RECORD_LABEL: Record<string, string> = {
  'trade-licence': 'ট্রেড লাইসেন্স',
  receipt: 'রসিদ',
  system: 'সিস্টেম',
}

function registerLabel(entry: AuditEntry): string {
  if (entry.recordType === 'register-entry') {
    return REGISTERS.find((r) => r.key === entry.recordKey)?.title ?? entry.recordKey
  }
  return RECORD_LABEL[entry.recordKey] ?? entry.recordKey
}

function linkFor(entry: AuditEntry): string | undefined {
  if (entry.recordType === 'trade-licence') return `/trade-licence/${entry.recordId}`
  if (entry.recordType === 'register-entry') return `/registers/${entry.recordKey}/${entry.recordId}`
  return undefined
}

export function AuditLog() {
  const audit = useStore((s) => s.audit)
  const [action, setAction] = useState('all')
  const [register, setRegister] = useState('all')

  const actions = useMemo(() => [...new Set(audit.map((a) => a.action))].sort(), [audit])
  const registers = useMemo(() => [...new Set(audit.map((a) => a.recordKey))], [audit])

  const rows = useMemo(
    () =>
      audit
        .filter((a) => action === 'all' || a.action === action)
        .filter((a) => register === 'all' || a.recordKey === register)
        .slice()
        .reverse(),
    [audit, action, register],
  )

  return (
    <>
      <PageHeader
        title="কার্যক্রম লগ"
        subtitle="কে, কখন, কী করেছেন — প্রতিটি পদক্ষেপের স্থায়ী রেকর্ড।"
        actions={
          <>
            <label className="sr-only" htmlFor="au-action">
              কার্যক্রম
            </label>
            <Select id="au-action" value={action} onChange={(e) => setAction(e.target.value)} className="w-44">
              <option value="all">সকল কার্যক্রম</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="au-register">
              রেজিস্টার
            </label>
            <Select id="au-register" value={register} onChange={(e) => setRegister(e.target.value)} className="w-56">
              <option value="all">সকল রেজিস্টার</option>
              {registers.map((key) => (
                <option key={key} value={key}>
                  {REGISTERS.find((r) => r.key === key)?.title ?? RECORD_LABEL[key] ?? key}
                </option>
              ))}
            </Select>
          </>
        }
      />

      <div className="mb-3 flex items-center gap-2 rounded-sm border border-rule/70 bg-white px-3 py-2 text-[12.5px] text-muted">
        <Lock size={14} className="shrink-0" />
        <p>
          এই লগে কোনো এন্ট্রি সম্পাদনা বা মুছে ফেলার ব্যবস্থা নেই — কেবল নতুন এন্ট্রি যোগ হয়। মোট{' '}
          {toBnDigits(audit.length)} টি এন্ট্রি।
        </p>
      </div>

      <Card bodyClassName="p-0">
        {rows.length === 0 ? (
          <EmptyState title="এই বাছাইয়ে কোনো এন্ট্রি নেই" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] text-[13px]">
              <thead className="border-b border-rule/70 text-left text-[12.5px] text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">সময়</th>
                  <th scope="col" className="px-3 py-2 font-medium">ব্যবহারকারী</th>
                  <th scope="col" className="px-3 py-2 font-medium">কার্যক্রম</th>
                  <th scope="col" className="px-3 py-2 font-medium">রেজিস্টার / রেকর্ড</th>
                  <th scope="col" className="px-3 py-2 font-medium">মন্তব্য</th>
                  <th scope="col" className="px-3 py-2 font-medium">পরিবর্তন</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const to = linkFor(a)
                  return (
                    <tr key={a.id} className="border-b border-rule/50 last:border-0 align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatDateBn(a.at)}
                        <span className="block text-[12px] text-muted">{formatTimeBn(a.at)}</span>
                      </td>
                      <td className="px-3 py-2">
                        {a.userName}
                        <span className="block text-[12px] text-muted">{USERS[a.role]?.title}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={a.action === 'বাতিল' ? 'font-medium text-stamp' : 'font-medium'}>
                          {a.action}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="block text-[12px] text-muted">{registerLabel(a)}</span>
                        {to ? (
                          <Link to={to} className="text-forest-700 hover:underline">
                            {toBnDigits(a.recordLabel)}
                          </Link>
                        ) : (
                          toBnDigits(a.recordLabel)
                        )}
                      </td>
                      <td className="max-w-md px-3 py-2 leading-relaxed">{a.note ?? '—'}</td>
                      <td className="px-3 py-2">
                        {a.changes && a.changes.length > 0 ? (
                          <ul>
                            {a.changes.map((c) => (
                              <li key={c.field} className="text-[12px] text-muted">
                                {c.field}: <span className="line-through">{toBnDigits(c.before)}</span> →{' '}
                                <span className="text-ink">{toBnDigits(c.after)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
