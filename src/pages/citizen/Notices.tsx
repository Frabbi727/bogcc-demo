import { Megaphone } from 'lucide-react'
import { useMemo } from 'react'

import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateBn, timeAgoBn } from '@/lib/bn'
import { roleTitle } from '@/data/users'
import { useStore } from '@/store/useStore'

/** The public notice board, newest first. */
export function CitizenNotices() {
  const notices = useStore((s) => s.notices)
  const ordered = useMemo(
    () => [...notices].sort((a, b) => b.at.localeCompare(a.at)),
    [notices],
  )

  return (
    <>
      <PageHeader title="নোটিশ বোর্ড" subtitle="কর্পোরেশনের সর্বশেষ ঘোষণা ও বিজ্ঞপ্তি।" />

      {ordered.length === 0 ? (
        <EmptyState
          title="এখন কোনো নোটিশ নেই"
          icon={<Megaphone size={26} strokeWidth={1.5} />}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((notice) => (
            <li key={notice.id} className="rounded-md border border-rule/70 bg-white px-4 py-3">
              <h2 className="text-[15px] font-medium leading-snug">{notice.title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/85">{notice.body}</p>
              <p className="mt-1.5 text-[11.5px] text-muted">
                {formatDateBn(notice.at)} · {timeAgoBn(notice.at)} · {notice.byName},{' '}
                {roleTitle(notice.byRole)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
