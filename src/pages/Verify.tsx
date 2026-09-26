import { BadgeCheck, CircleAlert, CircleSlash, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { bnToEnDigits, formatDateBn, toBnDigits } from '@/lib/bn'
import { expiryOf } from '@/lib/licence'
import { getRegister } from '@/registers'
import { useStore } from '@/store/useStore'
import type { Licence, RegisterEntry } from '@/types'

/**
 * Public licence and certificate check.
 *
 * Two ways in. A QR code carries the details in its own URL, so scanning works on
 * a phone that has never opened the app. When the record does live in this
 * browser's store it is preferred over those params, because only the record
 * knows whether it was cancelled after being printed.
 */

type Kind = 'licence' | 'cert'

interface Subject {
  kind: Kind
  no: string
  title: string
  ownerName?: string
  ward?: string
  /** Licences expire; certificates carry their issue date instead. */
  validUntil?: string
  issuedOn?: string
  cancelled?: { at: string; reason: string }
  /** True when this came from the store rather than from the QR's URL. */
  fromRecord: boolean
}

export function Verify() {
  const [params] = useSearchParams()
  // Read the clock once, so re-renders cannot flip the verdict mid-view.
  const [checkedAt] = useState(() => Date.now())
  const [query, setQuery] = useState('')
  const [lookedUp, setLookedUp] = useState<string | null>(null)

  const licences = useStore((s) => s.licences)
  const entries = useStore((s) => s.entries)

  const paramKind: Kind = params.get('t') === 'cert' ? 'cert' : 'licence'
  const paramNo = params.get('ln')

  const subject = useMemo(() => {
    const wanted = lookedUp ?? paramNo
    if (!wanted) return undefined

    const record = findRecord(licences, entries, wanted)
    if (record) return fromRecord(record)

    // Nothing in this browser's store: fall back to what the QR itself carries.
    // A manual lookup has no params to fall back on.
    if (lookedUp !== null || !paramNo) return undefined
    return {
      kind: paramKind,
      no: paramNo,
      title: params.get('bn') ?? (paramKind === 'cert' ? 'সনদ' : 'ট্রেড লাইসেন্স'),
      ownerName: params.get('on') ?? undefined,
      ward: params.get('w') ?? undefined,
      validUntil: paramKind === 'licence' ? (params.get('vu') ?? undefined) : undefined,
      issuedOn: paramKind === 'cert' ? (params.get('vu') ?? undefined) : undefined,
      fromRecord: false,
    } satisfies Subject
  }, [lookedUp, paramNo, paramKind, params, licences, entries])

  const searched = lookedUp !== null || !!paramNo
  const verdict = subject ? verdictOf(subject, checkedAt) : undefined

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="flex items-center justify-center bg-amber/12 px-4 py-1.5 text-[13px] font-medium text-amber">
        ডেমো সংস্করণ: সকল তথ্য কাল্পনিক
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-8">
        <header className="text-center">
          <p className="font-display text-[14px] text-muted">বগুড়া সিটি কর্পোরেশন</p>
          <h1 className="mt-0.5 text-[24px] leading-tight">
            {subject?.kind === 'cert' ? 'সনদ যাচাই' : 'লাইসেন্স ও সনদ যাচাই'}
          </h1>
        </header>

        <form
          className="mt-6 flex flex-col gap-3 rounded-md border border-rule bg-white px-4 py-3.5 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            setLookedUp(query)
          }}
        >
          <Field
            label="লাইসেন্স বা সনদ নম্বর"
            htmlFor="verify-no"
            hint="কাগজের উপরে লেখা নম্বরটি লিখুন, অথবা কিউআর কোড স্ক্যান করুন।"
            className="flex-1"
          >
            <Input
              id="verify-no"
              value={query}
              placeholder="যেমন TL/2026-27/0123"
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" className="sm:mb-6">
            <Search size={15} />
            যাচাই করুন
          </Button>
        </form>

        {searched && !subject && (
          <div className="mt-4 rounded-md border border-rule bg-white px-4 py-6 text-center">
            <CircleAlert size={26} strokeWidth={1.5} className="mx-auto text-muted" />
            <p className="mt-2 text-[14px]">এই নম্বরে কোনো রেকর্ড পাওয়া যায়নি।</p>
            <p className="mt-1 text-[13px] text-muted">
              নম্বরটি কাগজের সাথে মিলিয়ে দেখুন। লাইসেন্স বা সনদের কিউআর কোড স্ক্যান করলেও এই পাতায়
              বিবরণ দেখা যাবে।
            </p>
          </div>
        )}

        {subject && verdict && (
          <div className="mt-4 overflow-hidden rounded-md border border-rule bg-white">
            <div className={`flex items-center gap-2 border-b px-4 py-3 ${verdict.tone}`}>
              <verdict.icon size={20} />
              <div>
                <p className="font-medium">{verdict.label}</p>
                {verdict.detail && <p className="text-[12.5px] opacity-85">{verdict.detail}</p>}
              </div>
            </div>

            <dl className="divide-y divide-rule/60">
              <Row
                label={subject.kind === 'cert' ? 'সনদ নং' : 'লাইসেন্স নং'}
                value={toBnDigits(subject.no)}
              />
              <Row
                label={subject.kind === 'cert' ? 'সনদের ধরন' : 'প্রতিষ্ঠানের নাম'}
                value={subject.title}
              />
              <Row
                label={subject.kind === 'cert' ? 'আবেদনকারীর নাম' : 'মালিকের নাম'}
                value={subject.ownerName ?? '—'}
              />
              <Row label="ওয়ার্ড" value={subject.ward ? toBnDigits(subject.ward) : '—'} />
            </dl>

            {subject.cancelled && (
              <p className="border-t border-stamp/25 bg-stamp/5 px-4 py-2.5 text-[12.5px] leading-relaxed text-stamp">
                বাতিলের কারণ: {subject.cancelled.reason}
              </p>
            )}
          </div>
        )}

        <p className="mt-4 rounded-sm border border-rule bg-white px-3 py-2.5 text-[12.5px] leading-relaxed text-muted">
          {subject && !subject.fromRecord
            ? 'এই তথ্যগুলো কিউআর কোডের লিংক থেকেই পড়া হচ্ছে, তাই কাগজ ছাপানোর পরে বাতিল হয়ে থাকলে তা এখানে ধরা পড়বে না। প্রকৃত ব্যবস্থায় নম্বরটি সার্ভারের ডাটাবেজে মিলিয়ে যাচাই করা হবে।'
            : 'প্রকৃত ব্যবস্থায় নম্বরটি সার্ভারের ডাটাবেজে মিলিয়ে যাচাই করা হবে। এই ডেমোতে এই ব্রাউজারে রাখা রেকর্ড থেকে যাচাই করা হচ্ছে।'}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-right text-[14px]">{value}</dd>
    </div>
  )
}

/** valid / expired / cancelled — a certificate never expires, so it is never the second. */
function verdictOf(subject: Subject, checkedAt: number) {
  if (subject.cancelled) {
    return {
      label: subject.kind === 'cert' ? 'বাতিল সনদ' : 'বাতিল লাইসেন্স',
      detail: `${formatDateBn(subject.cancelled.at)} তারিখে বাতিল`,
      icon: CircleSlash,
      tone: 'border-stamp/30 bg-stamp/8 text-stamp',
    }
  }

  if (subject.kind === 'cert') {
    return {
      label: 'বৈধ সনদ',
      detail: subject.issuedOn ? `ইস্যুর তারিখ ${formatDateBn(subject.issuedOn)}` : undefined,
      icon: BadgeCheck,
      tone: 'border-forest-700/25 bg-forest-700/10 text-forest-800',
    }
  }

  const expiry = subject.validUntil ? new Date(`${subject.validUntil}T23:59:59`) : null
  const valid = expiry ? expiry.getTime() >= checkedAt : false
  return valid
    ? {
        label: 'বৈধ লাইসেন্স',
        detail: subject.validUntil ? `মেয়াদ ${formatDateBn(subject.validUntil)} পর্যন্ত` : undefined,
        icon: BadgeCheck,
        tone: 'border-forest-700/25 bg-forest-700/10 text-forest-800',
      }
    : {
        label: 'মেয়াদ উত্তীর্ণ',
        detail: subject.validUntil ? `মেয়াদ ${formatDateBn(subject.validUntil)} পর্যন্ত` : undefined,
        icon: CircleAlert,
        tone: 'border-stamp/30 bg-stamp/8 text-stamp',
      }
}

/** Bangla digits and stray spacing must not stop a number from matching. */
function normalise(s: string): string {
  return bnToEnDigits(s).trim().toUpperCase().replace(/\s+/g, '')
}

function findRecord(
  licences: Licence[],
  entries: RegisterEntry[],
  wanted: string,
): Licence | RegisterEntry | undefined {
  const needle = normalise(wanted)
  if (!needle) return undefined

  const licence = licences.find(
    (l) => normalise(l.registerNo ?? '') === needle || normalise(l.appNo) === needle,
  )
  if (licence) return licence

  // Only registers that issue a certificate are verifiable. A complaint has a
  // serial too, and must not come back as a valid certificate.
  return entries.find((e) => {
    if (!getRegister(e.registerKey)?.certificate) return false
    return normalise(e.certificateNo ?? '') === needle || normalise(e.serialNo) === needle
  })
}

function fromRecord(record: Licence | RegisterEntry): Subject {
  const cancelled = record.cancelled
    ? { at: record.cancelled.at, reason: record.cancelled.reason }
    : undefined

  if ('business' in record) {
    return {
      kind: 'licence',
      no: record.registerNo ?? record.appNo,
      title: record.business.nameBn,
      ownerName: record.owner.name,
      ward: String(record.business.ward),
      validUntil: expiryOf(record).slice(0, 10),
      cancelled,
      fromRecord: true,
    }
  }

  const config = getRegister(record.registerKey)
  return {
    kind: 'cert',
    no: record.certificateNo ?? record.serialNo,
    title: config?.certificate?.docTitle ?? config?.title ?? 'সনদ',
    ownerName: record.applicantName,
    ward: String(record.ward),
    issuedOn: (record.closedAt ?? record.createdAt).slice(0, 10),
    cancelled,
    fromRecord: true,
  }
}
