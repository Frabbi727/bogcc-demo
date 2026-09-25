import type { LicenceStatus } from '@/types'

export type Tone = 'neutral' | 'info' | 'pending' | 'success' | 'danger'

export const LICENCE_STATUS_LABEL: Record<LicenceStatus, string> = {
  submitted: 'আবেদন জমা',
  verified: 'যাচাইকৃত',
  approved: 'অনুমোদিত',
  issued: 'ইস্যুকৃত',
  cancelled: 'বাতিল',
}

export const LICENCE_STATUS_TONE: Record<LicenceStatus, Tone> = {
  submitted: 'pending',
  verified: 'info',
  approved: 'info',
  issued: 'success',
  cancelled: 'danger',
}

export const LICENCE_STATUS_ORDER: LicenceStatus[] = [
  'submitted',
  'verified',
  'approved',
  'issued',
  'cancelled',
]

/** Which role acts next on a licence, and what that action is called. */
export function nextActionFor(status: LicenceStatus):
  | { role: 'inspector' | 'licenceOfficer' | 'accounts'; action: string }
  | undefined {
  switch (status) {
    case 'submitted':
      return { role: 'inspector', action: 'মাঠ যাচাই' }
    case 'verified':
      return { role: 'licenceOfficer', action: 'অনুমোদন ও রেজিস্টার নম্বর' }
    case 'approved':
      return { role: 'accounts', action: 'ফি আদায় ও ইস্যু' }
    default:
      return undefined
  }
}

/** Tone for a generic register status: last status in the list reads as done. */
export function entryStatusTone(statuses: string[], status: string, cancelled?: boolean): Tone {
  if (cancelled) return 'danger'
  const i = statuses.indexOf(status)
  if (i < 0) return 'neutral'
  if (i === statuses.length - 1) return 'success'
  if (i === 0) return 'pending'
  return 'info'
}
