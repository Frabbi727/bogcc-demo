import { businessTypeOf } from '@/data/seed'
import { matchesLicence, normalizeTerm } from '@/lib/licence'
import { REGISTERS } from '@/registers'
import type { Licence, RegisterEntry } from '@/types'

export interface SearchHit {
  id: string
  /** Where to open the record. */
  to: string
  title: string
  subtitle: string
  meta: string
  cancelled?: boolean
}

export interface SearchGroup {
  key: string
  label: string
  hits: SearchHit[]
}

export function searchAll(
  raw: string,
  licences: Licence[],
  entries: RegisterEntry[],
): SearchGroup[] {
  const q = normalizeTerm(raw)
  if (!q) return []

  const licenceHits: SearchHit[] = licences
    .filter((l) => matchesLicence(l, q))
    .map((l) => ({
      id: l.id,
      to: `/office/trade-licence/${l.id}`,
      title: l.business.nameBn,
      subtitle: `${l.owner.name} · ${businessTypeOf(l.business.typeKey).label}`,
      meta: `${l.registerNo ?? l.appNo} · ওয়ার্ড ${l.business.ward}`,
      cancelled: l.status === 'cancelled',
    }))

  const groups: SearchGroup[] = []
  if (licenceHits.length > 0) {
    groups.push({ key: 'trade-licence', label: 'ট্রেড লাইসেন্স', hits: licenceHits })
  }

  for (const config of REGISTERS) {
    const hits: SearchHit[] = entries
      .filter((e) => e.registerKey === config.key)
      .filter((e) =>
        normalizeTerm([e.serialNo, ...Object.values(e.data).map(String)].join(' ')).includes(q),
      )
      .map((e) => {
        const shown = config.fields.filter((f) => f.showInBook).slice(0, 3)
        return {
          id: e.id,
          to: `/office/registers/${config.key}/${e.id}`,
          title: shown.map((f) => String(e.data[f.key] ?? '')).filter(Boolean).join(' · '),
          subtitle: e.cancelled ? 'বাতিল' : e.status,
          meta: e.serialNo,
          cancelled: !!e.cancelled,
        }
      })
    if (hits.length > 0) groups.push({ key: config.key, label: config.title, hits })
  }

  return groups
}
