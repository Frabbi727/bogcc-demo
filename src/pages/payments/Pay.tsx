import { BadgeCheck, CircleAlert, Loader2, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { bnToEnDigits, formatTaka, toBnDigits } from '@/lib/bn'
import { useStore } from '@/store/useStore'
import type { OnlineMethod } from '@/types'

/** Neutral labels only. Using the real wallets' logos or colours is not allowed. */
const METHODS: OnlineMethod[] = ['bKash', 'Nagad', 'কার্ড']

type Stage = 'form' | 'processing' | 'settled' | 'failed'

/**
 * The mock payment gateway (Spec v2 §11). Deliberately looks like a checkout and
 * is deliberately fake: no money moves, and the page says so twice.
 *
 * It owns no payment logic of its own. `completePayment` is the single door into
 * `settle()`, which is the one place a receipt is ever created — that is what
 * keeps the receipt book gapless no matter which channel the money came through.
 */
export function Pay() {
  const { paymentId = '' } = useParams()
  const navigate = useNavigate()

  const payment = useStore((s) => s.payments.find((p) => p.id === paymentId))
  const receipts = useStore((s) => s.receipts)
  const completePayment = useStore((s) => s.completePayment)
  const failPayment = useStore((s) => s.failPayment)

  const [method, setMethod] = useState<OnlineMethod>('bKash')
  const [mobile, setMobile] = useState(payment?.payerMobile ?? '')
  const [pin, setPin] = useState('')
  const [errors, setErrors] = useState<{ mobile?: string; pin?: string }>({})
  /** Lets the presenter show the failure path on purpose. */
  const [forceFail, setForceFail] = useState(false)
  const [stage, setStage] = useState<Stage>('form')
  const [receiptId, setReceiptId] = useState<string>()

  /* A payment settled earlier — a refresh, or a second visit to the same link. */
  const alreadyPaid = payment?.status === 'paid'
  const settledReceipt = receipts.find(
    (r) => r.id === receiptId || (alreadyPaid && r.paymentId === payment?.id),
  )

  if (!payment) {
    return (
      <Shell>
        <div className="mt-6 rounded-md border border-rule bg-white px-4 py-6 text-center">
          <CircleAlert size={26} strokeWidth={1.5} className="mx-auto text-muted" />
          <p className="mt-2 text-[14px]">এই পেমেন্টের তথ্য পাওয়া যায়নি।</p>
          <p className="mt-1 text-[13px] text-muted">
            ডেমো রিসেট করা হলে আগের পেমেন্টের লিংক আর কাজ করে না। আবার আবেদনের পাতা থেকে
            পরিশোধ শুরু করুন।
          </p>
        </div>
      </Shell>
    )
  }

  function validate(): boolean {
    const next: typeof errors = {}
    const digits = bnToEnDigits(mobile).replace(/\D/g, '')
    if (digits.length !== 11) next.mobile = '১১ সংখ্যার মোবাইল নম্বর দিন।'
    const pinDigits = bnToEnDigits(pin).replace(/\D/g, '')
    if (pinDigits.length < 4 || pinDigits.length > 5) next.pin = '৪ বা ৫ সংখ্যার পিন দিন।'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onSubmit() {
    if (!validate()) return
    setStage('processing')
    // A short pause so the demo reads like a real gateway hand-off.
    window.setTimeout(() => {
      if (forceFail) {
        failPayment(payment!.id)
        setStage('failed')
        return
      }
      const receipt = completePayment(payment!.id, { method })
      if (!receipt) {
        setStage('failed')
        return
      }
      setReceiptId(receipt.id)
      setStage('settled')
      toast.success(`পরিশোধ সম্পন্ন, রসিদ নং ${toBnDigits(receipt.receiptNo)}`)
    }, 1200)
  }

  function onRetry() {
    setForceFail(false)
    setPin('')
    setStage('form')
  }

  return (
    <Shell>
      <section className="mt-6 overflow-hidden rounded-md border border-rule bg-white">
        <header className="border-b border-rule/70 px-4 py-3">
          <p className="text-[13px] text-muted">যে কারণে পরিশোধ</p>
          <p className="mt-0.5 text-[14.5px] leading-snug">{payment.purpose}</p>
        </header>

        <dl className="divide-y divide-rule/60">
          {payment.feeLines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4 px-4 py-2">
              <dt className="text-[13px] text-muted">{line.label}</dt>
              <dd className="text-[13.5px]">{formatTaka(line.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 bg-paper px-4 py-2.5">
            <dt className="text-[13.5px] font-medium">মোট</dt>
            <dd className="text-[15px] font-medium">{formatTaka(payment.total)}</dd>
          </div>
        </dl>
      </section>

      {stage === 'settled' || alreadyPaid ? (
        <Verdict
          tone="ok"
          title="পরিশোধ সম্পন্ন হয়েছে"
          note={
            settledReceipt
              ? `রসিদ নং ${toBnDigits(settledReceipt.receiptNo)} — বই নং ${toBnDigits(settledReceipt.bookNo)}, পাতা ${toBnDigits(settledReceipt.pageNo)}`
              : undefined
          }
        >
          <div className="flex flex-wrap gap-2">
            {settledReceipt && (
              <Button variant="primary" onClick={() => navigate(`/print/receipt/${settledReceipt.id}`)}>
                রসিদ দেখুন ও প্রিন্ট করুন
              </Button>
            )}
            <Button onClick={() => navigate(-1)}>ফিরে যান</Button>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            পরিশোধের এসএমএস (ডেমো) আবেদনকারীর বার্তার তালিকায় যুক্ত হয়েছে, এবং এই আদায়
            হিসাব শাখার দৈনিক আদায়ে <span className="font-medium">অনলাইন</span> মাধ্যম হিসেবে
            দেখা যাবে।
          </p>
        </Verdict>
      ) : stage === 'failed' ? (
        <Verdict
          tone="bad"
          title="পরিশোধ ব্যর্থ হয়েছে"
          note="কোনো টাকা কাটা হয়নি এবং আবেদনের অবস্থাও বদলায়নি। আবার চেষ্টা করা যাবে।"
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={onRetry}>
              আবার চেষ্টা করুন
            </Button>
            <Button onClick={() => navigate(-1)}>ফিরে যান</Button>
          </div>
        </Verdict>
      ) : stage === 'processing' ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-md border border-rule bg-white px-4 py-8 text-[14px] text-muted">
          <Loader2 size={18} className="animate-spin" />
          অপেক্ষা করুন, পরিশোধ প্রক্রিয়া চলছে…
        </div>
      ) : (
        <section className="mt-4 rounded-md border border-rule bg-white px-4 py-3.5">
          <fieldset>
            <legend className="text-[13px] font-medium text-ink">পরিশোধের মাধ্যম বেছে নিন</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={method === m}
                  onClick={() => setMethod(m)}
                  className={
                    method === m
                      ? 'rounded-sm border border-forest-700 bg-forest-50 px-2 py-2.5 text-[13.5px] font-medium text-forest-800'
                      : 'rounded-sm border border-rule bg-white px-2 py-2.5 text-[13.5px] hover:border-forest-700/40'
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
            <Field label="মোবাইল নম্বর" htmlFor="pay-mobile" required error={errors.mobile}>
              <Input
                id="pay-mobile"
                inputMode="numeric"
                value={mobile}
                invalid={!!errors.mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </Field>
            <Field
              label="পিন"
              htmlFor="pay-pin"
              required
              error={errors.pin}
              hint="ডেমো: যেকোনো ৪–৫ সংখ্যা দিলেই হবে।"
            >
              <Input
                id="pay-pin"
                type="password"
                inputMode="numeric"
                value={pin}
                invalid={!!errors.pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </Field>
          </div>

          <label className="mt-3.5 flex items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={forceFail}
              onChange={(e) => setForceFail(e.target.checked)}
            />
            ব্যর্থ পেমেন্ট দেখান
          </label>

          <div className="mt-3.5 flex flex-wrap gap-2">
            <Button variant="primary" onClick={onSubmit}>
              <Lock size={14} />
              {formatTaka(payment.total)} পরিশোধ করুন
            </Button>
            <Button onClick={() => navigate(-1)}>বাতিল</Button>
          </div>
        </section>
      )}

      <p className="mt-4 rounded-sm border border-rule bg-white px-3 py-2.5 text-[12.5px] leading-relaxed text-muted">
        এটি একটি অনুকরণ। প্রকৃত ব্যবস্থায় এখানে অনুমোদিত পেমেন্ট গেটওয়ের পাতা আসবে, টাকা
        কর্পোরেশনের হিসাবে জমা হবে এবং গেটওয়ে থেকে ফিরে আসার পর আদায় নিশ্চিত হবে।
      </p>
    </Shell>
  )
}

/** The page frame: public, so it carries its own header rather than an office shell. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="flex items-center justify-center bg-amber/12 px-4 py-1.5 text-center text-[13px] font-medium text-amber">
        ডেমো পেমেন্ট: কোনো আসল টাকা লেনদেন হবে না
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-8">
        <header className="text-center">
          <p className="font-display text-[14px] text-muted">বগুড়া সিটি কর্পোরেশন</p>
          <h1 className="mt-0.5 text-[24px] leading-tight">অনলাইন পরিশোধ</h1>
        </header>

        {children}

        <p className="mt-4 text-center text-[13px]">
          <Link to="/" className="text-forest-700 hover:underline">
            প্রথম পাতায় যান
          </Link>
        </p>
      </div>
    </div>
  )
}

function Verdict({
  tone,
  title,
  note,
  children,
}: {
  tone: 'ok' | 'bad'
  title: string
  note?: string
  children: ReactNode
}) {
  const ok = tone === 'ok'
  return (
    <section className="mt-4 overflow-hidden rounded-md border border-rule bg-white">
      <div
        className={
          ok
            ? 'flex items-center gap-2 border-b border-forest-700/25 bg-forest-700/10 px-4 py-3 text-forest-800'
            : 'flex items-center gap-2 border-b border-stamp/30 bg-stamp/8 px-4 py-3 text-stamp'
        }
      >
        {ok ? <BadgeCheck size={20} /> : <CircleAlert size={20} />}
        <div>
          <p className="font-medium">{title}</p>
          {note && <p className="text-[12.5px] opacity-85">{note}</p>}
        </div>
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  )
}
