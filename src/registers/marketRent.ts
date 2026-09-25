import type { RegisterConfig } from './types'

/**
 * C7 — market shop rent collection.
 *
 * A shop pays every month, so the real ledger is a demand-and-collection book like
 * holding tax. This engine holds one workflow per record, so the book is kept the
 * simple way the counter already writes it: **one line = one shop, one month**.
 * The line is raised with the month's rent, closed when accounts collects it, and
 * the outstanding column carries whatever was not paid.
 */
export const marketRent: RegisterConfig = {
  key: 'market-rent',
  title: 'মার্কেট দোকান ভাড়া রেজিস্টার',
  section: 'রাজস্ব শাখা',
  serialPrefix: 'MR',
  description: 'প্রতি মাসে প্রতি দোকানের ভাড়ার দাবি, আদায় ও বকেয়ার হিসাব — এক লাইনে এক মাস',
  citizenFacing: false,
  dateField: 'createdAt',
  applicantFields: { name: 'allottee', mobile: 'allotteeMobile' },
  createRoles: ['operator', 'accounts', 'revenueOfficer'],
  cancelRoles: ['revenueOfficer', 'ceo'],
  totals: ['monthlyRent', 'collected', 'due'],
  steps: [
    { key: 'raised', label: 'ভাড়ার দাবি উত্থাপিত', citizenLabel: 'দাবি উত্থাপিত', actors: [] },
    {
      key: 'collected',
      label: 'আদায় সম্পন্ন',
      citizenLabel: 'আদায় সম্পন্ন',
      actors: ['accounts'],
      requiredFields: ['collected', 'collectedDate', 'receiptNo'],
    },
    {
      key: 'verified',
      label: 'রাজস্ব কর্মকর্তা যাচাইকৃত',
      citizenLabel: 'যাচাইকৃত',
      actors: ['revenueOfficer'],
    },
  ],
  fields: [
    {
      key: 'market',
      label: 'মার্কেটের নাম',
      type: 'select',
      options: [
        'ফতেহ আলী বাজার মার্কেট',
        'সাতমাথা সুপার মার্কেট',
        'নিউ মার্কেট',
        'ঠনঠনিয়া হকার্স মার্কেট',
        'বড়গোলা মার্কেট',
      ],
      required: true,
      showInBook: true,
    },
    { key: 'shopNo', label: 'দোকান নং', type: 'text', required: true, showInBook: true },
    { key: 'allottee', label: 'বরাদ্দগ্রহীতার নাম', type: 'text', required: true, showInBook: true },
    { key: 'allotteeMobile', label: 'বরাদ্দগ্রহীতার মোবাইল', type: 'phone', required: true },
    { key: 'businessType', label: 'ব্যবসার ধরন', type: 'text', showInBook: true },
    {
      key: 'month',
      label: 'মাস',
      type: 'select',
      options: [
        'জুলাই',
        'আগস্ট',
        'সেপ্টেম্বর',
        'অক্টোবর',
        'নভেম্বর',
        'ডিসেম্বর',
        'জানুয়ারি',
        'ফেব্রুয়ারি',
        'মার্চ',
        'এপ্রিল',
        'মে',
        'জুন',
      ],
      required: true,
      showInBook: true,
    },
    { key: 'monthlyRent', label: 'মাসিক ভাড়া (টাকা)', type: 'number', required: true, showInBook: true },
    { key: 'ward', label: 'ওয়ার্ড', type: 'ward', required: true, showInBook: true },
    {
      key: 'due',
      label: 'পূর্বের বকেয়া (টাকা)',
      type: 'number',
      showInBook: true,
      hint: 'আগের মাস পর্যন্ত যা বাকি আছে',
    },
    { key: 'collected', label: 'আদায়কৃত (টাকা)', type: 'number', showInBook: true, staffOnly: true },
    { key: 'collectedDate', label: 'আদায়ের তারিখ', type: 'date', showInBook: true, staffOnly: true },
    { key: 'receiptNo', label: 'রসিদ নং', type: 'text', showInBook: true, staffOnly: true },
  ],
}
