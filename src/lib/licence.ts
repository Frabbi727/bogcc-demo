/**
 * Trade licence domain rules that more than one screen needs.
 *
 * A licence is valid to 30 June of its fiscal year and must be renewed every
 * year, so "is this one still live?" is a question the list, the detail page
 * and the renewal screen all ask. Keeping the answer here stops the three from
 * drifting apart.
 */

import { bnToEnDigits } from '@/lib/bn'
import { validUntil } from '@/lib/fiscal'
import type { Licence } from '@/types'

/** How many days before 30 June a licence starts reading as "due soon". */
const DUE_SOON_DAYS = 60

export type RenewalState = 'pending' | 'active' | 'due-soon' | 'expired' | 'renewed' | 'cancelled'

export const RENEWAL_LABEL: Record<RenewalState, string> = {
  pending: 'ইস্যুর অপেক্ষায়',
  active: 'মেয়াদ চলমান',
  'due-soon': 'নবায়নের সময় হয়েছে',
  expired: 'মেয়াদোত্তীর্ণ',
  renewed: 'নবায়িত',
  cancelled: 'বাতিল',
}

export const RENEWAL_TONE = {
  pending: 'neutral',
  active: 'success',
  'due-soon': 'pending',
  expired: 'danger',
  renewed: 'info',
  cancelled: 'danger',
} as const

/** 30 June of the licence's own fiscal year. */
export function expiryOf(licence: Licence): string {
  return validUntil(licence.fiscalYear)
}

/** The renewal filed against this licence, if somebody filed one. */
export function renewalFor(licences: readonly Licence[], licence: Licence): Licence | undefined {
  return licences.find((l) => l.renewalOf === licence.id && l.status !== 'cancelled')
}

/** The licence this one renews, when it is a renewal. */
export function renewedFrom(licences: readonly Licence[], licence: Licence): Licence | undefined {
  return licence.renewalOf ? licences.find((l) => l.id === licence.renewalOf) : undefined
}

/**
 * Where a licence stands on the renewal calendar. Only an issued licence has a
 * validity to run out; anything still in the workflow reads as `pending`.
 */
export function renewalState(
  licences: readonly Licence[],
  licence: Licence,
  today: Date = new Date(),
): RenewalState {
  if (licence.status === 'cancelled') return 'cancelled'
  if (licence.status !== 'issued') return 'pending'
  if (renewalFor(licences, licence)) return 'renewed'

  const expiry = new Date(expiryOf(licence))
  if (today > expiry) return 'expired'
  const days = (expiry.getTime() - today.getTime()) / 86_400_000
  return days <= DUE_SOON_DAYS ? 'due-soon' : 'active'
}

/** Licences an operator may file a renewal against, newest first. */
export function renewableLicences(licences: readonly Licence[], today: Date = new Date()): Licence[] {
  return licences.filter((l) => {
    const state = renewalState(licences, l, today)
    return state === 'active' || state === 'due-soon' || state === 'expired'
  })
}

/** Normalises a term so Bangla and English digits both match. */
export function normalizeTerm(s: string): string {
  return bnToEnDigits(s).toLowerCase().trim()
}

/** Every field a licence is searchable by, joined and normalised once. */
export function licenceHaystack(l: Licence): string {
  return normalizeTerm(
    [
      l.business.nameBn,
      l.business.nameEn,
      l.business.area,
      l.business.holdingNo,
      l.owner.name,
      l.owner.fatherName,
      l.owner.nid,
      l.owner.mobile,
      l.appNo,
      l.registerNo ?? '',
      l.trackingNo,
    ].join(' '),
  )
}

/** True when the licence matches an already normalised query. */
export function matchesLicence(l: Licence, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true
  return licenceHaystack(l).includes(normalizedQuery)
}

/**
 * An application that looks like one already on file: the same owner NID and
 * the same business name in the same fiscal year. The counter should see this
 * before it writes a second line in the book for one shop.
 */
export function findDuplicate(
  licences: readonly Licence[],
  candidate: { nid: string; nameBn: string; fiscalYear: string },
): Licence | undefined {
  const nid = normalizeTerm(candidate.nid)
  const name = normalizeTerm(candidate.nameBn)
  return licences.find(
    (l) =>
      l.status !== 'cancelled' &&
      l.fiscalYear === candidate.fiscalYear &&
      normalizeTerm(l.owner.nid) === nid &&
      normalizeTerm(l.business.nameBn) === name,
  )
}
