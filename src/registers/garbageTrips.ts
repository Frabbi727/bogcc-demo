import type { RegisterConfig } from './types'

/** C3 — the daily garbage vehicle trip log. Office-only; no citizen ever files one. */
export const garbageTrips: RegisterConfig = {
  key: 'garbage-trips',
  title: 'বর্জ্য পরিবহন ট্রিপ রেজিস্টার',
  section: 'পরিচ্ছন্নতা শাখা',
  serialPrefix: 'GT',
  description: 'প্রতিদিন কোন গাড়ি কোন ওয়ার্ডে কতবার গিয়েছে তার হিসাব',
  citizenFacing: false,
  dateField: 'tripDate',
  createRoles: ['operator', 'conservancy'],
  cancelRoles: ['conservancy', 'ceo'],
  totals: ['trips', 'fuel'],
  steps: [
    { key: 'entry', label: 'এন্ট্রি', citizenLabel: 'এন্ট্রি', actors: [] },
    {
      key: 'verified',
      label: 'সুপারভাইজার যাচাইকৃত',
      citizenLabel: 'যাচাইকৃত',
      actors: ['conservancy'],
    },
  ],
  fields: [
    { key: 'tripDate', label: 'তারিখ', type: 'date', required: true, showInBook: true },
    { key: 'vehicleNo', label: 'গাড়ি নং', type: 'text', required: true, showInBook: true },
    { key: 'driver', label: 'চালকের নাম', type: 'text', required: true, showInBook: true },
    { key: 'ward', label: 'ওয়ার্ড', type: 'ward', required: true, showInBook: true },
    { key: 'route', label: 'রুট', type: 'text', showInBook: true },
    { key: 'trips', label: 'ট্রিপ সংখ্যা', type: 'number', required: true, showInBook: true },
    {
      key: 'dumpSite',
      label: 'ডাম্পিং স্থান',
      type: 'select',
      options: ['ঠনঠনিয়া ডাম্পিং', 'নামুজা ডাম্পিং', 'ফুলবাড়ি ডাম্পিং'],
      required: true,
      showInBook: true,
    },
    { key: 'fuel', label: 'জ্বালানি (লিটার)', type: 'number', showInBook: true },
    { key: 'supervisor', label: 'সুপারভাইজার', type: 'text', showInBook: true },
  ],
}
