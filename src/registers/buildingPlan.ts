import type { RegisterConfig } from './types'

/**
 * C9 — building plan approval.
 *
 * The engineering section takes the application, an inspector visits the plot and
 * writes a report, and the chief executive approves. The plan drawing itself stays
 * on paper in this demo; the book records that it was received and inspected.
 */
export const buildingPlan: RegisterConfig = {
  key: 'building-plan',
  title: 'ইমারত নকশা অনুমোদন রেজিস্টার',
  section: 'ইঞ্জিনিয়ারিং শাখা',
  serialPrefix: 'BP',
  description: 'ইমারত নির্মাণের নকশার আবেদন, পরিদর্শন প্রতিবেদন ও অনুমোদনের ধাপ',
  citizenFacing: false,
  dateField: 'applicationDate',
  applicantFields: { name: 'applicantName', mobile: 'applicantMobile' },
  createRoles: ['operator', 'inspector'],
  cancelRoles: ['ceo'],
  totals: ['fee'],
  steps: [
    { key: 'received', label: 'আবেদন গৃহীত', citizenLabel: 'আবেদন গৃহীত', actors: [] },
    {
      key: 'inspected',
      label: 'পরিদর্শন সম্পন্ন',
      citizenLabel: 'পরিদর্শন সম্পন্ন',
      actors: ['inspector'],
      requiredFields: ['inspectionDate', 'inspectionNote'],
    },
    {
      key: 'approved',
      label: 'নকশা অনুমোদিত',
      citizenLabel: 'নকশা অনুমোদিত',
      actors: ['ceo'],
      requiredFields: ['approvalDate'],
    },
  ],
  fields: [
    { key: 'applicationDate', label: 'আবেদনের তারিখ', type: 'date', required: true, showInBook: true },
    { key: 'applicantName', label: 'আবেদনকারীর নাম', type: 'text', required: true, showInBook: true },
    { key: 'applicantMobile', label: 'আবেদনকারীর মোবাইল', type: 'phone', required: true },
    { key: 'holdingNo', label: 'হোল্ডিং নং', type: 'text', required: true, showInBook: true },
    { key: 'ward', label: 'ওয়ার্ড', type: 'ward', required: true, showInBook: true },
    {
      key: 'landArea',
      label: 'জমির পরিমাণ (শতাংশ)',
      type: 'number',
      required: true,
      showInBook: true,
    },
    { key: 'floors', label: 'তলা সংখ্যা', type: 'number', required: true, showInBook: true },
    {
      key: 'buildingUse',
      label: 'ব্যবহারের ধরন',
      type: 'select',
      options: ['আবাসিক', 'বাণিজ্যিক', 'মিশ্র', 'শিল্প'],
      required: true,
      showInBook: true,
    },
    { key: 'designerName', label: 'নকশাকারের নাম', type: 'text', required: true, showInBook: true },
    { key: 'fee', label: 'ফি (টাকা)', type: 'number', required: true, showInBook: true },
    { key: 'inspectionDate', label: 'পরিদর্শনের তারিখ', type: 'date', showInBook: true, staffOnly: true },
    { key: 'inspectionNote', label: 'পরিদর্শন প্রতিবেদন', type: 'textarea', staffOnly: true },
    { key: 'approvalDate', label: 'অনুমোদনের তারিখ', type: 'date', showInBook: true, staffOnly: true },
  ],
}
