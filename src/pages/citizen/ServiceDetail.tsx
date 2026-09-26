import { Banknote, Building2, CheckCircle2, Clock, ExternalLink, Store } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LinkButton } from '@/components/ui/LinkButton'
import { serviceOf } from '@/data/services'
import { toBnDigits } from '@/lib/bn'
import { registerForService } from '@/registers'

import { charterLabel } from './charter'

/**
 * One service's charter entry: what it costs, how long it takes, what to bring,
 * and the steps it passes through — the citizen labels from the register config,
 * so this page and the tracking page can never promise different things.
 */
export function CitizenServiceDetail() {
  const { serviceKey } = useParams()
  const service = serviceOf(serviceKey)
  const register = registerForService(serviceKey)

  // Two citizen-facing services do not run on the register engine, so they have no
  // config to read steps or an apply form from: trade licence has its own
  // workflow, and holding tax is a payment rather than an application.
  const ownWorkflow = serviceKey === 'tl-new' || serviceKey === 'tl-renew'
  const isHoldingTax = serviceKey === 'holding-pay'
  const canApplyOnline = !!service?.citizenFacing && (!!register || ownWorkflow || isHoldingTax)
  const applyTo = isHoldingTax ? '/nagorik/holding' : `/nagorik/apply/${serviceKey}`
  const applyLabel = isHoldingTax ? 'কর পরিশোধ করুন' : 'আবেদন করুন'
  const steps = register
    ? register.steps.map((step) => ({ key: step.key, label: step.citizenLabel }))
    : (service?.statuses ?? [])
        .map((key) => ({ key, label: service?.citizenLabels[key] ?? '' }))
        .filter((step) => step.label)

  if (!service) {
    return (
      <>
        <PageHeader title="সেবা" />
        <EmptyState
          title="সেবাটি পাওয়া যায়নি"
          hint="ঠিকানাটি সম্ভবত ভুল। নাগরিক সনদ থেকে সেবা বেছে নিন।"
        />
        <div className="mt-3">
          <LinkButton to="/nagorik/services">নাগরিক সনদে ফিরুন</LinkButton>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={service.name} />

      <div className="flex flex-col gap-4">
        <p className="text-[13.5px] leading-relaxed text-ink/85">{service.description}</p>

        <Card bodyClassName="px-0 py-0">
          <dl className="divide-y divide-rule/70">
            <Row icon={Clock} label="নির্ধারিত সময়" value={charterLabel(service)} />
            <Row icon={Banknote} label="ফি" value={service.fee.label} />
            <Row icon={Building2} label="দায়িত্বপ্রাপ্ত শাখা" value={service.section} />
          </dl>
        </Card>

        <Card title="প্রয়োজনীয় কাগজপত্র">
          <ul className="flex flex-col gap-1.5">
            {service.requiredDocs.map((doc) => (
              <li key={doc} className="flex gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-forest-700" />
                <span className="text-[13px] leading-relaxed">{doc}</span>
              </li>
            ))}
          </ul>
        </Card>

        {steps.length > 0 && (
          <Card title="আবেদনের ধাপ">
            <ol className="flex flex-col gap-2.5">
              {steps.map((step, i) => (
                <li key={step.key} className="flex gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-forest-700/10 text-[12px] font-medium text-forest-700">
                    {toBnDigits(i + 1)}
                  </span>
                  <span className="pt-0.5 text-[13px] leading-snug">{step.label}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {service.infoOnly ? (
          <ExternalNotice url={service.externalUrl} section={service.section} />
        ) : canApplyOnline ? (
          <LinkButton to={applyTo} variant="primary" className="self-start">
            {applyLabel}
          </LinkButton>
        ) : (
          <Notice icon={Store}>এই সেবার আবেদন {service.section}-এ সরাসরি জমা দিতে হয়।</Notice>
        )}
      </div>
    </>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted" />
      <dt className="w-32 shrink-0 text-[12.5px] text-muted">{label}</dt>
      <dd className="text-[13px] leading-snug">{value}</dd>
    </div>
  )
}

/** A service the corporation does not deliver itself. */
function ExternalNotice({ url, section }: { url?: string; section: string }) {
  return (
    <div className="rounded-md border border-sky/30 bg-sky/8 px-4 py-3">
      <p className="text-[13px] leading-relaxed">
        এই সেবাটি সিটি কর্পোরেশন থেকে দেওয়া হয় না। {section} থেকে জেনে নিন, অথবা সরকারি ওয়েবসাইটে
        আবেদন করুন।
      </p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-forest-700 hover:underline"
        >
          {url.replace(/^https?:\/\//, '')}
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}

function Notice({ icon: Icon, children }: { icon: typeof Store; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-md bg-forest-50 px-4 py-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-forest-700" />
      <p className="text-[13px] leading-relaxed">{children}</p>
    </div>
  )
}
