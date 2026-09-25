import { BadgeCheck, CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { formatDateBn, toBnDigits } from '@/lib/bn'

/**
 * Public licence check. Everything shown comes from the QR code's own URL, so
 * scanning works on a phone that has never opened the app.
 */
export function Verify() {
  const [params] = useSearchParams()
  // Read the clock once, so re-renders cannot flip the verdict mid-view.
  const [checkedAt] = useState(() => Date.now())
  const licenceNo = params.get('ln')
  const businessName = params.get('bn')
  const ownerName = params.get('on')
  const validUntilRaw = params.get('vu')
  const ward = params.get('w')

  const hasData = !!licenceNo
  const expiry = validUntilRaw ? new Date(`${validUntilRaw}T23:59:59`) : null
  const valid = expiry ? expiry.getTime() >= checkedAt : false

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="flex items-center justify-center bg-amber/12 px-4 py-1.5 text-[13px] font-medium text-amber">
        ডেমো সংস্করণ: সকল তথ্য কাল্পনিক
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-8">
        <header className="text-center">
          <p className="font-display text-[14px] text-muted">বগুড়া সিটি কর্পোরেশন</p>
          <h1 className="mt-0.5 text-[24px] leading-tight">ট্রেড লাইসেন্স যাচাই</h1>
        </header>

        {!hasData ? (
          <div className="mt-6 rounded-md border border-rule bg-white px-4 py-6 text-center">
            <CircleAlert size={26} strokeWidth={1.5} className="mx-auto text-muted" />
            <p className="mt-2 text-[14px]">যাচাইয়ের কোনো তথ্য পাওয়া যায়নি।</p>
            <p className="mt-1 text-[13px] text-muted">
              লাইসেন্সের কিউআর কোড স্ক্যান করলে এই পাতায় বিবরণ দেখা যাবে।
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-md border border-rule bg-white">
            <div
              className={
                valid
                  ? 'flex items-center gap-2 border-b border-forest-700/25 bg-forest-700/10 px-4 py-3 text-forest-800'
                  : 'flex items-center gap-2 border-b border-stamp/30 bg-stamp/8 px-4 py-3 text-stamp'
              }
            >
              {valid ? <BadgeCheck size={20} /> : <CircleAlert size={20} />}
              <div>
                <p className="font-medium">{valid ? 'বৈধ লাইসেন্স' : 'মেয়াদ উত্তীর্ণ'}</p>
                <p className="text-[12.5px] opacity-85">
                  {validUntilRaw && <>মেয়াদ {formatDateBn(validUntilRaw)} পর্যন্ত</>}
                </p>
              </div>
            </div>

            <dl className="divide-y divide-rule/60">
              {[
                ['লাইসেন্স নং', toBnDigits(licenceNo)],
                ['প্রতিষ্ঠানের নাম', businessName ?? '—'],
                ['মালিকের নাম', ownerName ?? '—'],
                ['ওয়ার্ড', ward ? toBnDigits(ward) : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-[13px] text-muted">{label}</dt>
                  <dd className="text-right text-[14px]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <p className="mt-4 rounded-sm border border-rule bg-white px-3 py-2.5 text-[12.5px] leading-relaxed text-muted">
          এই ডেমোতে তথ্যগুলো কিউআর কোডের লিংক থেকেই পড়া হচ্ছে। প্রকৃত ব্যবস্থায় লাইসেন্স নম্বর
          সার্ভারের ডাটাবেজে মিলিয়ে যাচাই করা হবে এবং বাতিল হওয়া লাইসেন্সও শনাক্ত করা যাবে।
        </p>

        <p className="mt-4 text-center text-[13px]">
          <Link to="/" className="text-forest-700 hover:underline">
            ডিজিটাল রেজিস্টার ব্যবস্থায় যান
          </Link>
        </p>
      </div>
    </div>
  )
}
