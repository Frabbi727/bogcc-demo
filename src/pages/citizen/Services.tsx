import { Banknote, Building2, ChevronRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { SERVICES, type ServiceDef } from '@/data/services'

import { charterLabel } from './charter'

/**
 * The citizen charter (নাগরিক সনদ): every service with its promised time and fee.
 *
 * Read-only. The charter is what the corporation commits to publicly, so it lists
 * every service — including the ones a citizen cannot start online and the ones
 * that are not ours to deliver — rather than only the ones with an apply button.
 */
export function CitizenServices() {
  return (
    <>
      <PageHeader
        title="নাগরিক সনদ"
        subtitle="প্রতিটি সেবার নির্ধারিত সময় ও ফি নিচে দেওয়া আছে। সব হার ডেমো।"
      />

      <ul className="flex flex-col gap-3">
        {SERVICES.map((service) => (
          <li key={service.key}>
            <ServiceRow service={service} />
          </li>
        ))}
      </ul>
    </>
  )
}

function ServiceRow({ service }: { service: ServiceDef }) {
  return (
    <Link
      to={`/nagorik/services/${service.key}`}
      className="block rounded-md border border-rule/70 bg-white px-4 py-3 transition-colors hover:border-forest-700/40 hover:bg-forest-50"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[15px] font-medium leading-snug">{service.name}</h2>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" />
      </div>

      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
        {service.description}
      </p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted">
        <Chip icon={Clock} label={charterLabel(service)} />
        <Chip icon={Banknote} label={service.fee.label} />
        <Chip icon={Building2} label={service.section} />
      </div>
    </Link>
  )
}

function Chip({
  icon: Icon,
  label,
}: {
  icon: typeof Clock
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={13} className="shrink-0" />
      {label}
    </span>
  )
}
