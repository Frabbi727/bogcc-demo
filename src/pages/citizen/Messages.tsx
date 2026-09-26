import { MessageSquare, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { LinkButton } from '@/components/ui/LinkButton'
import { bnToEnDigits, formatDateTimeBn, toBnDigits } from '@/lib/bn'
import { useStore } from '@/store/useStore'
import type { Notification } from '@/types'

/**
 * The simulated SMS inbox: every status change the office made, in the words the
 * citizen would have received them. Nothing is ever actually sent.
 */
export function CitizenMessages() {
  const citizen = useStore((s) => s.citizen)
  const notifications = useStore((s) => s.notifications)
  const markMessagesRead = useStore((s) => s.markMessagesRead)

  const mine = useMemo(
    () =>
      citizen
        ? notifications
            .filter((n) => n.mobile === citizen.mobile)
            .sort((a, b) => b.at.localeCompare(a.at))
        : [],
    [citizen, notifications],
  )

  // Opening the inbox is reading it, the same as on a phone.
  const unread = mine.some((n) => !n.read)
  useEffect(() => {
    if (citizen && unread) markMessagesRead(citizen.mobile)
  }, [citizen, unread, markMessagesRead])

  if (!citizen) return <SignIn />

  return (
    <>
      <PageHeader
        title="বার্তা"
        subtitle={`${toBnDigits(citizen.mobile)} নম্বরে পাঠানো সব বার্তা (ডেমো — আসল এসএমএস যায়নি)।`}
      />

      {mine.length === 0 ? (
        <EmptyState
          title="কোনো বার্তা নেই"
          hint="আবেদন জমা দিলে প্রতিটি ধাপে এখানে বার্তা আসবে।"
          icon={<MessageSquare size={26} strokeWidth={1.5} />}
          action={<LinkButton to="/nagorik/services">নাগরিক সনদ দেখুন</LinkButton>}
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {mine.map((sms) => (
            <li key={sms.id}>
              <SmsBubble sms={sms} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** An SMS as it would look on a phone, with a link back to the application. */
function SmsBubble({ sms }: { sms: Notification }) {
  const body = (
    <>
      <p className="text-[13.5px] leading-relaxed">{sms.text}</p>
      <p className="mt-1 text-[11.5px] text-muted">
        {formatDateTimeBn(sms.at)}
        {sms.trackingNo && <> · {sms.trackingNo}</>}
      </p>
    </>
  )

  const className =
    'block rounded-md rounded-tl-sm border border-rule/70 bg-white px-3.5 py-2.5 transition-colors'

  return sms.trackingNo ? (
    <Link
      to={`/nagorik/track/${sms.trackingNo}`}
      className={`${className} hover:border-forest-700/40 hover:bg-forest-50`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

/** The inbox belongs to a number, so it needs one before it can show anything. */
function SignIn() {
  const citizenLogin = useStore((s) => s.citizenLogin)
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const mob = bnToEnDigits(mobile.trim())
    if (mob.length !== 11) return setError('১১ সংখ্যার মোবাইল নম্বর দিন')
    setError('')
    citizenLogin(mob)
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title="বার্তা"
        subtitle="যে মোবাইল নম্বরে বার্তা এসেছে, সেটি দিয়ে ইনবক্স দেখুন।"
      />
      <Card>
        <div className="flex flex-col gap-3.5">
          <Field label="মোবাইল নম্বর" htmlFor="sms-mobile" required error={error}>
            <Input
              id="sms-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
            />
          </Field>
          <Button type="submit" variant="primary" className="self-start">
            <Smartphone size={15} />
            ইনবক্স দেখুন
          </Button>
        </div>
      </Card>
    </form>
  )
}
