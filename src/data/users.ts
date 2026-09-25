/**
 * Office staff, one fictional person per role.
 *
 * Office login is a role picker with no passwords — the point of the demo is
 * which desk does which step, not authentication. The real system replaces this
 * with proper accounts and per-section permissions.
 */

import type { Role, User } from '@/types'
import { COUNCILLOR_WARD } from './wards'

export const USERS: Record<Role, User> = {
  operator: {
    role: 'operator',
    name: 'মোঃ রফিকুল ইসলাম',
    title: 'ডাটা এন্ট্রি অপারেটর',
    designation: 'রাজস্ব শাখা',
    hint: 'কাউন্টারে আবেদন ও রেজিস্টার এন্ট্রি করেন',
  },
  inspector: {
    role: 'inspector',
    name: 'শাহানা পারভীন',
    title: 'লাইসেন্স পরিদর্শক',
    designation: 'রাজস্ব শাখা',
    hint: 'সরেজমিনে প্রতিষ্ঠান যাচাই করেন',
  },
  licenceOfficer: {
    role: 'licenceOfficer',
    name: 'মোঃ আনিসুর রহমান',
    title: 'লাইসেন্স অফিসার',
    designation: 'রাজস্ব শাখা',
    hint: 'লাইসেন্স অনুমোদন দেন ও রেজিস্টার নম্বর বসান',
  },
  accounts: {
    role: 'accounts',
    name: 'সুমন কুমার দাস',
    title: 'হিসাবরক্ষক / ক্যাশিয়ার',
    designation: 'হিসাব শাখা',
    hint: 'ফি আদায় করেন ও রসিদ দেন',
  },
  revenueOfficer: {
    role: 'revenueOfficer',
    name: 'মোঃ তৌহিদুল ইসলাম',
    title: 'রাজস্ব কর্মকর্তা',
    designation: 'রাজস্ব শাখা',
    hint: 'হোল্ডিং করের দাবি ও আদায় দেখেন',
  },
  electrician: {
    role: 'electrician',
    name: 'মোঃ জাহিদ হাসান',
    title: 'ইলেকট্রিশিয়ান',
    designation: 'বিদ্যুৎ শাখা',
    hint: 'সড়কবাতি মেরামত করেন',
  },
  conservancy: {
    role: 'conservancy',
    name: 'নাজমা বেগম',
    title: 'পরিচ্ছন্নতা পরিদর্শক',
    designation: 'পরিচ্ছন্নতা শাখা',
    hint: 'বর্জ্য অভিযোগ ও গাড়ির ট্রিপ দেখেন',
  },
  councillor: {
    role: 'councillor',
    name: 'মোঃ দেলোয়ার হোসেন',
    title: 'ওয়ার্ড কাউন্সিলর',
    designation: `ওয়ার্ড ${COUNCILLOR_WARD}`,
    hint: 'নিজ ওয়ার্ডের সনদ অনুমোদন করেন',
    ward: COUNCILLOR_WARD,
  },
  ceo: {
    role: 'ceo',
    name: 'ড. মোস্তাফিজুর রহমান',
    title: 'প্রধান নির্বাহী কর্মকর্তা',
    designation: 'প্রধান কার্যালয়',
    hint: 'সার্বিক তত্ত্বাবধান, রিপোর্ট ও নোটিশ',
  },
  mayor: {
    role: 'mayor',
    name: 'ইঞ্জিনিয়ার আব্দুল মোমেন',
    title: 'মেয়র / প্রশাসক',
    designation: 'বগুড়া সিটি কর্পোরেশন',
    hint: 'পুরো শহরের সেবা ও রাজস্বের চিত্র দেখেন',
  },
}

/** Order of the role picker and the role switcher: the workflow, then oversight. */
export const ROLE_ORDER: Role[] = [
  'operator',
  'inspector',
  'licenceOfficer',
  'accounts',
  'revenueOfficer',
  'electrician',
  'conservancy',
  'councillor',
  'ceo',
  'mayor',
]

export function userFor(role: Role): User {
  return USERS[role]
}

/** Short Bangla title for a role, used in timelines and handoff buttons. */
export function roleTitle(role: Role): string {
  return USERS[role].title
}
