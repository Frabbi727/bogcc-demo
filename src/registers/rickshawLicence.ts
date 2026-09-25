import type { RegisterConfig } from './types'

/**
 * C8 — rickshaw, van and easy-bike licences.
 *
 * Same shape as a trade licence, with a number plate allotted at approval and a
 * yearly renewal date carried on the line. Office-only for now: the counter takes
 * the application, the licence officer allots the plate.
 */
export const rickshawLicence: RegisterConfig = {
  key: 'rickshaw-licence',
  title: 'রিকশা / ভ্যান লাইসেন্স রেজিস্টার',
  section: 'লাইসেন্স শাখা',
  serialPrefix: 'RL',
  description: 'রিকশা, ভ্যান ও ইজিবাইকের লাইসেন্স, প্লেট বরাদ্দ ও বার্ষিক নবায়নের হিসাব',
  citizenFacing: false,
  printable: 'certificate',
  dateField: 'createdAt',
  applicantFields: { name: 'ownerName', mobile: 'ownerMobile' },
  createRoles: ['operator', 'licenceOfficer'],
  cancelRoles: ['licenceOfficer', 'ceo'],
  totals: ['fee'],
  steps: [
    { key: 'received', label: 'আবেদন গৃহীত', citizenLabel: 'আবেদন গৃহীত', actors: [] },
    {
      key: 'feePaid',
      label: 'ফি জমা',
      citizenLabel: 'ফি জমা',
      actors: ['accounts'],
      requiredFields: ['moneyReceiptNo'],
    },
    {
      key: 'approved',
      label: 'প্লেট বরাদ্দ ও অনুমোদন',
      citizenLabel: 'অনুমোদিত',
      actors: ['licenceOfficer'],
      requiredFields: ['plateNo'],
    },
    {
      key: 'issued',
      label: 'লাইসেন্স ইস্যুকৃত',
      citizenLabel: 'লাইসেন্স প্রস্তুত',
      actors: ['operator', 'licenceOfficer'],
      requiredFields: ['issueDate', 'renewDate'],
    },
  ],
  fields: [
    {
      key: 'vehicleType',
      label: 'যানবাহনের ধরন',
      type: 'select',
      options: ['রিকশা', 'ভ্যান', 'ইজিবাইক', 'ঠেলাগাড়ি'],
      required: true,
      showInBook: true,
    },
    { key: 'ownerName', label: 'মালিকের নাম', type: 'text', required: true, showInBook: true },
    { key: 'ownerMobile', label: 'মালিকের মোবাইল', type: 'phone', required: true },
    { key: 'ownerNid', label: 'মালিকের জাতীয় পরিচয়পত্র নং', type: 'nid' },
    { key: 'driverName', label: 'চালকের নাম', type: 'text', showInBook: true },
    { key: 'address', label: 'ঠিকানা', type: 'text', required: true, showInBook: true },
    { key: 'ward', label: 'ওয়ার্ড', type: 'ward', required: true, showInBook: true },
    { key: 'fee', label: 'ফি (টাকা)', type: 'number', required: true, showInBook: true },
    {
      key: 'applicationKind',
      label: 'আবেদনের ধরন',
      type: 'select',
      options: ['নতুন', 'নবায়ন'],
      required: true,
      showInBook: true,
    },
    { key: 'moneyReceiptNo', label: 'রসিদ নং', type: 'text', staffOnly: true },
    { key: 'plateNo', label: 'প্লেট নং', type: 'text', showInBook: true, staffOnly: true },
    { key: 'issueDate', label: 'ইস্যুর তারিখ', type: 'date', showInBook: true, staffOnly: true },
    { key: 'renewDate', label: 'নবায়নের তারিখ', type: 'date', showInBook: true, staffOnly: true },
  ],
  certificate: {
    docTitle: 'রিকশা / ভ্যান লাইসেন্স',
    body:
      'এই মর্মে জানানো যাইতেছে যে, {{ownerName}}, ঠিকানা: {{address}}, ওয়ার্ড নং {{ward}}, ' +
      'বগুড়া সিটি কর্পোরেশন — তাঁহার {{vehicleType}} যানবাহনটি প্লেট নং {{plateNo}} সহ বগুড়া সিটি ' +
      'কর্পোরেশন এলাকায় চলাচলের জন্য লাইসেন্সপ্রাপ্ত হইল। এই লাইসেন্স {{renewDate}} তারিখ পর্যন্ত বলবৎ ' +
      'থাকিবে এবং প্রতি বৎসর নবায়ন করিতে হইবে।',
    sections: [
      { label: 'যানবাহনের তথ্য', fields: ['vehicleType', 'plateNo', 'driverName'] },
      { label: 'মালিকের তথ্য', fields: ['ownerName', 'ownerNid', 'address', 'ward'] },
      { label: 'লাইসেন্স', fields: ['fee', 'issueDate', 'renewDate'] },
    ],
    signatories: ['লাইসেন্স কর্মকর্তা', 'প্রধান নির্বাহী কর্মকর্তা'],
  },
}
