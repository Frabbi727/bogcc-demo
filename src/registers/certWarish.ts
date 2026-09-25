import type { RegisterConfig } from './types'

/**
 * C5 — warish (inheritance) certificate. Same flow as the citizenship certificate
 * plus a staff verification step, because the heirs list has to be checked before
 * the councillor signs it.
 */
export const certWarish: RegisterConfig = {
  key: 'cert-warish',
  serviceKey: 'cert-warish',
  title: 'ওয়ারিশ সনদ রেজিস্টার',
  section: 'সাধারণ শাখা',
  serialPrefix: 'CW',
  description: 'ওয়ারিশ সনদের আবেদন, উত্তরাধিকারীর তালিকা যাচাই ও ইস্যুর হিসাব',
  citizenFacing: true,
  wardScoped: true,
  printable: 'certificate',
  dateField: 'createdAt',
  applicantFields: { name: 'applicantName', mobile: 'mobile' },
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
      key: 'verified',
      label: 'তথ্য যাচাই সম্পন্ন',
      citizenLabel: 'তথ্য যাচাই সম্পন্ন',
      actors: ['operator', 'inspector'],
      requiredFields: ['verifyNote'],
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
    {
      key: 'deceasedName',
      label: 'মৃত ব্যক্তির নাম',
      type: 'text',
      required: true,
      showInBook: true,
      citizenInput: true,
    },
    {
      key: 'deathDate',
      label: 'মৃত্যুর তারিখ',
      type: 'date',
      required: true,
      showInBook: true,
      citizenInput: true,
    },
    {
      key: 'applicantName',
      label: 'আবেদনকারীর নাম',
      type: 'text',
      required: true,
      showInBook: true,
      citizenInput: true,
    },
    {
      key: 'relation',
      label: 'মৃতের সাথে সম্পর্ক',
      type: 'text',
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
    {
      key: 'heirs',
      label: 'উত্তরাধিকারীদের তালিকা',
      type: 'heirs',
      required: true,
      citizenInput: true,
      hint: 'প্রত্যেকের নাম, সম্পর্ক ও বয়স দিন',
    },
    { key: 'verifyNote', label: 'যাচাইয়ের মন্তব্য', type: 'textarea', staffOnly: true },
  ],
  certificate: {
    docTitle: 'ওয়ারিশ সনদপত্র',
    body:
      'এই মর্মে প্রত্যয়ন করা হইতেছে যে, {{deceasedName}}, ঠিকানা: {{address}}, ওয়ার্ড নং {{ward}}, ' +
      'বগুড়া সিটি কর্পোরেশন — গত {{deathDate}} তারিখে মৃত্যুবরণ করিয়াছেন। আমার জানামতে ও স্থানীয় ' +
      'অনুসন্ধানে নিম্নলিখিত ব্যক্তিগণই তাঁহার বৈধ ওয়ারিশ হিসাবে বিদ্যমান আছেন।',
    sections: [
      { label: 'মৃত ব্যক্তির তথ্য', fields: ['deceasedName', 'deathDate', 'address', 'ward'] },
      { label: 'আবেদনকারী', fields: ['applicantName', 'relation', 'mobile'] },
    ],
    signatories: ['ওয়ার্ড কাউন্সিলর', 'প্রধান নির্বাহী কর্মকর্তা'],
  },
}
