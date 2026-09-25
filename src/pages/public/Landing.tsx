import { Building2, ClipboardList, Star, Timer, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { DemoBanner } from '@/components/DemoBanner'
import { formatNumberBn, toBnDigits } from '@/lib/bn'
import { publicStats } from '@/lib/publicStats'
import { useStore } from '@/store/useStore'

/**
 * Public front door. Two ways in — the Citizen Corner and the office — plus a
 * short strip of live public numbers so the page is not just two buttons.
 */
export function Landing() {
  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)
  const notices = useStore((s) => s.notices)

  const stats = useMemo(() => publicStats([...licences, ...entries]), [licences, entries])
  const latestNotice = notices[0]

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <DemoBanner />

      <header className="border-b border-rule/70 bg-forest-700 px-4 py-7 text-white sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-[13px] text-white/75">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
          <h1 className="mt-1 font-display text-[28px] leading-tight sm:text-[34px]">
            বগুড়া সিটি কর্পোরেশন
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/85">
            নাগরিক সেবা ও ডিজিটাল রেজিস্টার ব্যবস্থা। হাতে লেখা রেজিস্টার খাতার প্রতিটি লাইন এখন
            ডিজিটাল — নাগরিক নিজেই আবেদনের অবস্থা দেখতে পারেন।
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/nagorik"
            className="group flex flex-col rounded-md border border-forest-700/25 bg-white px-5 py-6 transition-colors hover:border-forest-700/50 hover:bg-forest-50"
          >
            <span className="flex size-11 items-center justify-center rounded-md bg-forest-700/10 text-forest-700">
              <Users size={22} />
            </span>
            <h2 className="mt-3 font-display text-[21px] leading-tight">নাগরিক কর্নার</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
              সেবার তালিকা দেখুন, অনলাইনে আবেদন বা অভিযোগ করুন, আবেদন ট্র্যাক করুন, হোল্ডিং কর দিন
              এবং সনদ যাচাই করুন।
            </p>
            <span className="mt-3 text-[13.5px] font-medium text-forest-700 group-hover:underline">
              প্রবেশ করুন →
            </span>
          </Link>

          <Link
            to="/office/login"
            className="group flex flex-col rounded-md border border-rule bg-white px-5 py-6 transition-colors hover:border-forest-700/40 hover:bg-forest-50"
          >
            <span className="flex size-11 items-center justify-center rounded-md bg-sky/10 text-sky">
              <Building2 size={22} />
            </span>
            <h2 className="mt-3 font-display text-[21px] leading-tight">অফিস লগইন</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
              কর্পোরেশনের কর্মকর্তা ও কর্মচারীদের জন্য — রেজিস্টার, অনুমোদন, ফি আদায়, রিপোর্ট ও
              মেয়র ড্যাশবোর্ড।
            </p>
            <span className="mt-3 text-[13.5px] font-medium text-forest-700 group-hover:underline">
              ভূমিকা বেছে নিন →
            </span>
          </Link>
        </div>

        <section className="mt-6 rounded-md border border-rule/70 bg-white px-4 py-4">
          <h2 className="font-display text-[16px]">এই মাসে আমরা</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={<ClipboardList size={16} />}
              label="সেবা প্রদান (এ মাসে)"
              value={formatNumberBn(stats.deliveredThisMonth)}
            />
            <Stat
              icon={<Users size={16} />}
              label="অভিযোগ সমাধান"
              value={formatNumberBn(stats.complaintsSolved)}
            />
            <Stat
              icon={<Timer size={16} />}
              label="গড় সময়"
              value={`${toBnDigits(stats.averageDays)} কর্মদিবস`}
            />
            <Stat
              icon={<Star size={16} />}
              label="নাগরিক সন্তুষ্টি"
              value={stats.averageRating ? `${toBnDigits(stats.averageRating)} / ৫` : '—'}
            />
          </dl>
        </section>

        {latestNotice && (
          <section className="mt-4 rounded-md border border-rule/70 bg-white px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[16px]">সর্বশেষ নোটিশ</h2>
              <Link to="/nagorik/notices" className="text-[13px] text-forest-700 hover:underline">
                সব নোটিশ
              </Link>
            </div>
            <p className="mt-2 text-[14px] font-medium">{latestNotice.title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{latestNotice.body}</p>
          </section>
        )}
      </main>

      <footer className="border-t border-rule/70 px-4 py-4 text-center text-[12.5px] text-muted sm:px-6">
        বগুড়া সিটি কর্পোরেশন · ডেমো সংস্করণ — সকল তথ্য কাল্পনিক
      </footer>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[12.5px] text-muted">
        <span className="text-forest-700/70">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-[22px] leading-tight">{value}</dd>
    </div>
  )
}
