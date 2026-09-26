import {
  ClipboardList,
  FileSearch,
  Megaphone,
  MapPin,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { formatNumberBn, timeAgoBn, toBnDigits } from '@/lib/bn'
import { COUNCILLOR_WARD } from '@/data/wards'
import { publicStats } from '@/lib/publicStats'
import { useStore } from '@/store/useStore'

const TILES = [
  { to: '/nagorik/services', label: 'আবেদন করুন', hint: 'ট্রেড লাইসেন্স, সনদ', icon: ClipboardList },
  { to: '/nagorik/services', label: 'অভিযোগ করুন', hint: 'সড়কবাতি, বর্জ্য', icon: Trash2 },
  { to: '/nagorik/track', label: 'আবেদন ট্র্যাক করুন', hint: 'ট্র্যাকিং নং দিয়ে', icon: FileSearch },
  { to: '/nagorik/holding', label: 'হোল্ডিং কর দিন', hint: 'বকেয়া দেখে পরিশোধ', icon: Receipt },
  { to: '/verify', label: 'সনদ যাচাই', hint: 'QR বা নম্বর দিয়ে', icon: ShieldCheck },
  { to: '/nagorik/notices', label: 'নোটিশ', hint: 'কর্পোরেশনের ঘোষণা', icon: Megaphone },
  {
    to: '/nagorik/apply/tl-renew',
    label: 'লাইসেন্স নবায়ন',
    hint: 'ট্রেড লাইসেন্স',
    icon: RefreshCw,
  },
  {
    to: `/nagorik/ward/${COUNCILLOR_WARD}`,
    label: 'আমার ওয়ার্ড',
    hint: 'কাউন্সিলর ও যোগাযোগ',
    icon: MapPin,
  },
]

export function CitizenHome() {
  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)
  const notices = useStore((s) => s.notices)

  const stats = useMemo(() => publicStats([...licences, ...entries]), [licences, entries])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-forest-700/20 bg-forest-50 px-4 py-4">
        <h1 className="font-display text-[20px] leading-tight">স্বাগতম</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink/85">
          অফিসে না এসেই আবেদন করুন, অভিযোগ জানান এবং প্রতিটি ধাপ নিজে দেখুন। প্রতিটি আবেদনের জন্য
          একটি ট্র্যাকিং নম্বর পাবেন।
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TILES.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className="flex min-h-24 flex-col justify-between rounded-md border border-rule bg-white px-3 py-3 transition-colors hover:border-forest-700/40 hover:bg-forest-50"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-forest-700/10 text-forest-700">
              <tile.icon size={18} />
            </span>
            <span>
              <span className="block text-[13.5px] font-medium leading-snug">{tile.label}</span>
              <span className="block text-[11.5px] text-muted">{tile.hint}</span>
            </span>
          </Link>
        ))}
      </div>

      <Card title="এই মাসে আমরা">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[12px] text-muted">সেবা প্রদান</dt>
            <dd className="font-display text-[20px]">{formatNumberBn(stats.deliveredThisMonth)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted">অভিযোগ সমাধান</dt>
            <dd className="font-display text-[20px]">{formatNumberBn(stats.complaintsSolved)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted">গড় সময়</dt>
            <dd className="font-display text-[20px]">{toBnDigits(stats.averageDays)} দিন</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted">নাগরিক সন্তুষ্টি</dt>
            <dd className="font-display text-[20px]">
              {stats.averageRating ? `${toBnDigits(stats.averageRating)} / ৫` : '—'}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="সর্বশেষ নোটিশ">
        <ul className="flex flex-col gap-3">
          {notices.slice(0, 3).map((notice) => (
            <li key={notice.id}>
              <p className="text-[13.5px] font-medium leading-snug">{notice.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{notice.body}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">{timeAgoBn(notice.at)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
