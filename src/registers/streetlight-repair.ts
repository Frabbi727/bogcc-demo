import type { RegisterConfig } from './types'

export const streetlightRepair: RegisterConfig = {
  key: 'streetlight-repair',
  title: 'সড়কবাতি মেরামত রেজিস্টার',
  section: 'বিদ্যুৎ শাখা',
  serialPrefix: 'SL',
  description: 'নাগরিকের অভিযোগ থেকে মেরামত সম্পন্ন পর্যন্ত প্রতিটি সড়কবাতির হিসাব',
  dateField: 'complaintDate',
  statuses: ['অভিযোগ গৃহীত', 'মিস্ত্রি নিযুক্ত', 'মেরামত সম্পন্ন'],
  roles: {
    create: ['operator'],
    advance: ['electrician', 'officer'],
    cancel: ['officer'],
  },
  advancePrompts: {
    'মিস্ত্রি নিযুক্ত': ['technician'],
    'মেরামত সম্পন্ন': ['repairDate', 'materials'],
  },
  fields: [
    { key: 'poleNo', label: 'খুঁটি নং', type: 'text', required: true, showInBook: true },
    { key: 'ward', label: 'ওয়ার্ড', type: 'ward', required: true, showInBook: true },
    { key: 'road', label: 'রাস্তার নাম', type: 'text', required: true, showInBook: true },
    {
      key: 'faultType',
      label: 'সমস্যার ধরন',
      type: 'select',
      options: ['বাতি নষ্ট', 'তার ছেঁড়া', 'খুঁটি হেলে গেছে', 'সুইচ নষ্ট'],
      required: true,
      showInBook: true,
    },
    { key: 'complaintDate', label: 'অভিযোগের তারিখ', type: 'date', required: true, showInBook: true },
    { key: 'complainant', label: 'অভিযোগকারীর নাম', type: 'text', required: true, showInBook: true },
    { key: 'complainantMobile', label: 'অভিযোগকারীর মোবাইল', type: 'phone', required: true },
    { key: 'technician', label: 'নিযুক্ত মিস্ত্রি', type: 'text', showInBook: true },
    { key: 'repairDate', label: 'মেরামতের তারিখ', type: 'date', showInBook: true },
    { key: 'materials', label: 'ব্যবহৃত মালামাল', type: 'text', showInBook: true },
    { key: 'remarks', label: 'মন্তব্য', type: 'textarea' },
  ],
}
