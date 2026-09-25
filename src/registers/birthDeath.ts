import type { RegisterConfig } from './types'

/**
 * C6 — birth and death reference register.
 *
 * Registration itself happens in the national BDRIS system, not here. The
 * corporation keeps this book so that a 17-digit registration number quoted on a
 * trade licence or certificate application can be checked and the check recorded.
 * Office-only: a citizen never files one of these lines.
 */
export const birthDeath: RegisterConfig = {
  key: 'birth-death',
  title: 'জন্ম-মৃত্যু রেফারেন্স রেজিস্টার',
  section: 'জন্ম ও মৃত্যু নিবন্ধন শাখা',
  serialPrefix: 'BD',
  description: 'BDRIS নিবন্ধন নম্বর যাচাইয়ের দৈনিক হিসাব — কোন কাজে কার নিবন্ধন দেখা হয়েছে',
  citizenFacing: false,
  dateField: 'verifyDate',
  createRoles: ['operator', 'licenceOfficer'],
  cancelRoles: ['licenceOfficer', 'ceo'],
  steps: [
    { key: 'entry', label: 'এন্ট্রি', citizenLabel: 'এন্ট্রি', actors: [] },
    {
      key: 'verified',
      label: 'BDRIS-এ যাচাইকৃত',
      citizenLabel: 'যাচাইকৃত',
      actors: ['operator', 'licenceOfficer'],
      requiredFields: ['matchResult'],
    },
  ],
  fields: [
    { key: 'verifyDate', label: 'যাচাইয়ের তারিখ', type: 'date', required: true, showInBook: true },
    {
      key: 'regNo',
      label: 'নিবন্ধন নং (১৭ ডিজিট)',
      type: 'text',
      required: true,
      showInBook: true,
      hint: 'BDRIS সনদে ছাপানো ১৭ সংখ্যার নম্বর',
    },
    {
      key: 'eventType',
      label: 'ধরন',
      type: 'select',
      options: ['জন্ম', 'মৃত্যু'],
      required: true,
      showInBook: true,
    },
    { key: 'name', label: 'নাম', type: 'text', required: true, showInBook: true },
    { key: 'fatherName', label: 'পিতার নাম', type: 'text', showInBook: true },
    { key: 'motherName', label: 'মাতার নাম', type: 'text' },
    { key: 'eventDate', label: 'জন্ম / মৃত্যুর তারিখ', type: 'date', required: true, showInBook: true },
    { key: 'ward', label: 'ওয়ার্ড', type: 'ward', required: true, showInBook: true },
    {
      key: 'usedFor',
      label: 'যে কাজে ব্যবহৃত',
      type: 'select',
      options: ['ট্রেড লাইসেন্স', 'নাগরিকত্ব সনদ', 'ওয়ারিশ সনদ', 'হোল্ডিং কর', 'অন্যান্য'],
      required: true,
      showInBook: true,
    },
    {
      key: 'matchResult',
      label: 'যাচাইয়ের ফল',
      type: 'select',
      options: ['তথ্য মিলেছে', 'তথ্য মেলেনি', 'নিবন্ধন পাওয়া যায়নি'],
      showInBook: true,
      staffOnly: true,
    },
    { key: 'remarks', label: 'মন্তব্য', type: 'textarea', staffOnly: true },
  ],
}
