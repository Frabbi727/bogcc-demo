/**
 * The trade licence application form's shape, checks and clean-up.
 *
 * A renewal is the same paper form with last year's answers already written in,
 * so the new-application screen and the renewal screen share all of this.
 */

import { AREAS, BUSINESS_TYPES } from '@/data/seed'
import { bnToEnDigits } from '@/lib/bn'
import type { BusinessNature, Licence } from '@/types'

export interface FormState {
  nameBn: string
  nameEn: string
  typeKey: string
  nature: BusinessNature
  street: string
  area: string
  ward: string
  holdingNo: string
  ownerName: string
  fatherName: string
  motherName: string
  nid: string
  mobile: string
}

export type Errors = Partial<Record<keyof FormState, string>>

export const EMPTY_FORM: FormState = {
  nameBn: '',
  nameEn: '',
  typeKey: BUSINESS_TYPES[0].key,
  nature: 'একক',
  street: '',
  area: AREAS[0],
  ward: '',
  holdingNo: '',
  ownerName: '',
  fatherName: '',
  motherName: '',
  nid: '',
  mobile: '',
}

/**
 * Last year's line, read back into the form. The address is stored as one
 * composed string, so the street is whatever came before the first comma.
 */
export function formFromLicence(licence: Licence): FormState {
  return {
    nameBn: licence.business.nameBn,
    nameEn: licence.business.nameEn,
    typeKey: licence.business.typeKey,
    nature: licence.business.nature,
    street: licence.business.address.split(',')[0]?.trim() ?? '',
    area: licence.business.area,
    ward: String(licence.business.ward),
    holdingNo: licence.business.holdingNo,
    ownerName: licence.owner.name,
    fatherName: licence.owner.fatherName,
    motherName: licence.owner.motherName,
    nid: licence.owner.nid,
    mobile: licence.owner.mobile,
  }
}

export function validateForm(form: FormState): Errors {
  const e: Errors = {}
  if (!form.nameBn.trim()) e.nameBn = 'প্রতিষ্ঠানের বাংলা নাম লিখুন।'
  if (!form.nameEn.trim()) e.nameEn = 'প্রতিষ্ঠানের ইংরেজি নাম লিখুন।'
  else if (!/^[A-Za-z0-9\s.,&()'/-]+$/.test(form.nameEn.trim()))
    e.nameEn = 'ইংরেজি নাম কেবল ইংরেজি অক্ষরে লিখুন।'
  if (!form.street.trim()) e.street = 'রাস্তা বা মহল্লার নাম লিখুন।'
  if (!form.holdingNo.trim()) e.holdingNo = 'হোল্ডিং নম্বর লিখুন।'

  const ward = Number(bnToEnDigits(form.ward))
  if (!form.ward.trim()) e.ward = 'ওয়ার্ড নির্বাচন করুন।'
  else if (!Number.isInteger(ward) || ward < 1 || ward > 21) e.ward = 'ওয়ার্ড ১ থেকে ২১ এর মধ্যে হতে হবে।'

  if (!form.ownerName.trim()) e.ownerName = 'মালিকের নাম লিখুন।'
  if (!form.fatherName.trim()) e.fatherName = 'পিতার নাম লিখুন।'
  if (!form.motherName.trim()) e.motherName = 'মাতার নাম লিখুন।'

  const nid = bnToEnDigits(form.nid).replace(/\s/g, '')
  if (!nid) e.nid = 'জাতীয় পরিচয়পত্র নম্বর লিখুন।'
  else if (!/^\d+$/.test(nid)) e.nid = 'এনআইডি নম্বরে কেবল সংখ্যা থাকবে।'
  else if (![10, 13, 17].includes(nid.length))
    e.nid = 'এনআইডি নম্বর ১০, ১৩ অথবা ১৭ সংখ্যার হতে হবে।'

  const mobile = bnToEnDigits(form.mobile).replace(/\s|-/g, '')
  if (!mobile) e.mobile = 'মোবাইল নম্বর লিখুন।'
  else if (!/^01\d{9}$/.test(mobile)) e.mobile = 'মোবাইল নম্বর ০১ দিয়ে শুরু হয়ে ১১ সংখ্যার হতে হবে।'

  return e
}

/** The form's answers, cleaned up the way the store wants them. */
export function licenceInputFrom(form: FormState) {
  const ward = Number(bnToEnDigits(form.ward))
  return {
    business: {
      nameBn: form.nameBn.trim(),
      nameEn: form.nameEn.trim(),
      typeKey: form.typeKey,
      nature: form.nature,
      address: `${form.street.trim()}, ${form.area}, হোল্ডিং ${form.holdingNo.trim()}, ওয়ার্ড ${ward}, বগুড়া`,
      area: form.area,
      ward,
      holdingNo: form.holdingNo.trim(),
    },
    owner: {
      name: form.ownerName.trim(),
      fatherName: form.fatherName.trim(),
      motherName: form.motherName.trim(),
      nid: bnToEnDigits(form.nid).replace(/\s/g, ''),
      mobile: bnToEnDigits(form.mobile).replace(/\s|-/g, ''),
    },
  }
}
