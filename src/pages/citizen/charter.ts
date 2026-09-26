import type { ServiceDef } from '@/data/services'
import { toBnDigits } from '@/lib/bn'

/**
 * The charter time as a citizen reads it. `charterDays: 0` means the counter
 * finishes it the same day.
 *
 * Deliberately not in `src/lib/` — that directory is ported to the Flutter app
 * and every change there has to be mirrored. This is presentation only.
 */
export function charterLabel(service: ServiceDef): string {
  return service.charterDays === 0 ? 'তাৎক্ষণিক' : `${toBnDigits(service.charterDays)} কার্যদিবস`
}
