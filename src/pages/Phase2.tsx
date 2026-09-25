import { Navigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Card } from '@/components/ui/Card'
import { getPhase2Module } from '@/data/phase2'
import { toBnDigits } from '@/lib/bn'

export function Phase2() {
  const { key } = useParams()
  const module = getPhase2Module(key)

  if (!module) return <Navigate to="/office" replace />

  return (
    <>
      <PageHeader
        title={module.title}
        subtitle={module.section}
        badge={<StatusBadge label="দ্বিতীয় ধাপ" tone="pending" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="এই মডিউল কী করবে">
          <p className="text-[14px] leading-relaxed">{module.purpose}</p>
          <p className="mt-3 rounded-sm border border-amber/30 bg-amber/8 px-3 py-2 text-[12.5px] leading-relaxed text-ink/85">
            এই অংশটি এখনো তৈরি হয়নি। এই ধাপে ট্রেড লাইসেন্স, হোল্ডিং কর, অভিযোগ ও সনদের রেজিস্টার
            দেখানো হচ্ছে; একই ইঞ্জিন ব্যবহার করে পরের ধাপে এই রেজিস্টারগুলো যোগ হবে।
          </p>
          {module.external && (
            <p className="mt-2 text-[12.5px] leading-relaxed">
              এই কাজটি হয়{' '}
              <a
                href={module.external.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-forest-700 hover:underline"
              >
                {module.external.label}
              </a>
              -এ।
            </p>
          )}
        </Card>

        <Card title="পরিকল্পিত রেজিস্টার কলাম" subtitle={`${toBnDigits(module.columns.length)} টি কলাম`}>
          <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {module.columns.map((c, i) => (
              <li key={c} className="flex gap-2 text-[13.5px]">
                <span className="w-6 shrink-0 text-right text-muted">{toBnDigits(i + 1)}.</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}
