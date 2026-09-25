import { SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { toBnDigits } from '@/lib/bn'
import { searchAll } from '@/lib/search'
import { useStore } from '@/store/useStore'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)
  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)

  const groups = useMemo(() => searchAll(q, licences, entries), [q, licences, entries])
  const total = groups.reduce((sum, g) => sum + g.hits.length, 0)

  return (
    <>
      <PageHeader
        title="অনুসন্ধান"
        subtitle="প্রতিষ্ঠান, মালিক, এনআইডি, মোবাইল, লাইসেন্স নং, হোল্ডিং নং কিংবা রেজিস্টারের যেকোনো তথ্য দিয়ে খুঁজুন।"
      />

      <Card className="mb-4">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setParams(draft.trim() ? { q: draft.trim() } : {})
          }}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="search-q" className="mb-1 block text-[13px] font-medium">
              অনুসন্ধান
            </label>
            <Input
              id="search-q"
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="যেমন: রহমান স্টোর, ০১৭১১২৩৪৫৬৭, SL/2026-27/0004"
            />
          </div>
          <Button type="submit" variant="primary">
            খুঁজুন
          </Button>
        </form>
      </Card>

      {!q ? (
        <Card>
          <p className="text-[13.5px] text-muted">
            কিছু লিখে অনুসন্ধান করুন। ফলাফল রেজিস্টার অনুসারে আলাদা করে দেখানো হবে।
          </p>
        </Card>
      ) : total === 0 ? (
        <Card>
          <EmptyState
            title={`"${q}" দিয়ে কিছু পাওয়া যায়নি`}
            hint="বানান মিলিয়ে দেখুন, অথবা নামের অংশ দিয়ে খুঁজুন।"
            icon={<SearchX size={26} strokeWidth={1.5} />}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-muted">
            মোট {toBnDigits(total)} টি ফলাফল, {toBnDigits(groups.length)} টি রেজিস্টারে।
          </p>
          {groups.map((group) => (
            <Card key={group.key} title={group.label} subtitle={`${toBnDigits(group.hits.length)} টি ফলাফল`} bodyClassName="p-0">
              <ul className="divide-y divide-rule/50">
                {group.hits.map((hit) => (
                  <li key={hit.id}>
                    <Link
                      to={hit.to}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-forest-50/50"
                    >
                      <span className="min-w-0">
                        <span
                          className={
                            hit.cancelled
                              ? 'block text-[14px] font-medium text-stamp line-through'
                              : 'block text-[14px] font-medium'
                          }
                        >
                          {hit.title}
                        </span>
                        <span className="block text-[12.5px] text-muted">{hit.subtitle}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {hit.cancelled && <StatusBadge label="বাতিল" tone="danger" />}
                        <span className="text-[12.5px] text-muted">{toBnDigits(hit.meta)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
