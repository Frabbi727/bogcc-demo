import type { RegisterConfig } from './types'

export const garbageTrips: RegisterConfig = {
  key: 'garbage-trips',
  title: 'বর্জ্য পরিবহন গাড়ির ট্রিপ রেজিস্টার',
  section: 'পরিচ্ছন্নতা শাখা',
  serialPrefix: 'GT',
  description: 'প্রতিদিনের বর্জ্য পরিবহন, ট্রিপ সংখ্যা ও জ্বালানির হিসাব',
  dateField: 'date',
  statuses: ['এন্ট্রি', 'সুপারভাইজার যাচাইকৃত'],
  roles: {
    create: ['operator', 'conservancy'],
    advance: ['conservancy'],
    cancel: ['conservancy'],
  },
  totals: ['trips', 'fuel'],
  fields: [
    { key: 'date', label: 'তারিখ', type: 'date', required: true, showInBook: true },
    { key: 'vehicleNo', label: 'গাড়ি নং', type: 'text', required: true, showInBook: true },
    { key: 'driver', label: 'চালকের নাম', type: 'text', required: true, showInBook: true },
    { key: 'ward', label: 'ওয়ার্ড/রুট', type: 'ward', required: true, showInBook: true },
    { key: 'trips', label: 'ট্রিপ সংখ্যা', type: 'number', required: true, showInBook: true },
    {
      key: 'dumpingSite',
      label: 'ডাম্পিং স্থান',
      type: 'select',
      options: ['ফুলবাড়ি ডাম্পিং স্টেশন', 'নামাজগড় ট্রান্সফার পয়েন্ট', 'কামারগাড়ি ল্যান্ডফিল'],
      required: true,
      showInBook: true,
    },
    { key: 'fuel', label: 'জ্বালানি (লিটার)', type: 'number', required: true, showInBook: true },
    { key: 'supervisor', label: 'সুপারভাইজার', type: 'text', required: true, showInBook: true },
  ],
}
