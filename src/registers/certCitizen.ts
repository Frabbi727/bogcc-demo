import type { RegisterConfig } from './types'

/** C4 — citizenship certificate. Ward-scoped: only that ward's councillor approves. */
export const certCitizen: RegisterConfig = {
  key: 'cert-citizen',
  serviceKey: 'cert-citizen',
  title: 'নাগরিকত্ব সনদ রেজিস্টার',
  section: 'সাধারণ শাখা',
  serialPrefix: 'CC',
  description: 'নাগরিকত্ব সনদের আবেদন, ফি, কাউন্সিলর অনুমোদন ও ইস্যুর হিসাব',
  citizenFacing: true,
  wardScoped: true,
  printable: 'certificate',
  dateField: 'createdAt',
  applicantFields: { name: 'name', mobile: 'mobile' },
  createRoles: ['operator'],
  cancelRoles: ['licenceOfficer', 'ceo'],
  steps: [
    { key: 'received', label: 'আবেদন গৃহীত', citizenLabel: 'আবেদন গৃহীত', actors: [] },
    {
      key: 'paid',
      label: 'ফি পরিশোধিত',
      citizenLabel: 'ফি পরিশোধিত',
      actors: ['accounts'],
      payment: true,
    },
    {
      key: 'approved',
      label: 'কাউন্সিলর অনুমোদিত',
      citizenLabel: 'কাউন্সিলর অনুমোদিত',
      actors: ['councillor'],
    },
    {
      key: 'issued',
      label: 'সনদ ইস্যুকৃত',
      citizenLabel: 'সনদ প্রস্তুত',
      actors: ['operator', 'licenceOfficer'],
    },
  ],
  fields: [
    { key: 'name', label: 'নাম', type: 'text', required: true, showInBook: true, citizenInput: true },
    {
      key: 'fatherName',
      label: 'পিতার নাম',
      type: 'text',
      required: true,
      showInBook: true,
      citizenInput: true,
    },
    { key: 'motherName', label: 'মাতার নাম', type: 'text', required: true, citizenInput: true },
    { key: 'dob', label: 'জন্ম তারিখ', type: 'date', required: true, citizenInput: true },
    {
      key: 'nid',
      label: 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন নং',
      type: 'nid',
      required: true,
      showInBook: true,
      citizenInput: true,
    },
    {
      key: 'address',
      label: 'ঠিকানা',
      type: 'text',
      required: true,
      showInBook: true,
      citizenInput: true,
    },
    { key: 'ward', label: 'ওয়ার্ড', type: 'ward', required: true, showInBook: true, citizenInput: true },
    { key: 'mobile', label: 'মোবাইল', type: 'phone', required: true, citizenInput: true },
  ],
  certificate: {
    docTitle: 'নাগরিকত্ব সনদপত্র',
    body:
      'এই মর্মে প্রত্যয়ন করা হইতেছে যে, {{name}}, পিতা/স্বামী: {{fatherName}}, মাতা: {{motherName}}, ' +
      'ঠিকানা: {{address}}, ওয়ার্ড নং {{ward}}, বগুড়া সিটি কর্পোরেশন — তিনি বগুড়া সিটি কর্পোরেশনের ' +
      'একজন স্থায়ী বাসিন্দা এবং বাংলাদেশের নাগরিক। আমার জানামতে তিনি রাষ্ট্রবিরোধী কোনো কর্মকাণ্ডে জড়িত নহেন।',
    sections: [
      { label: 'আবেদনকারীর তথ্য', fields: ['name', 'fatherName', 'motherName', 'dob', 'nid'] },
      { label: 'ঠিকানা', fields: ['address', 'ward'] },
    ],
    signatories: ['ওয়ার্ড কাউন্সিলর', 'প্রধান নির্বাহী কর্মকর্তা'],
  },
}
