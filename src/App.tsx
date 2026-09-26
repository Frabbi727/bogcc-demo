import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { CitizenLayout } from '@/components/CitizenLayout'
import { Layout } from '@/components/Layout'
import { AuditLog } from '@/pages/AuditLog'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { Phase2 } from '@/pages/Phase2'
import { SearchPage } from '@/pages/Search'
import { Verify } from '@/pages/Verify'
import { CitizenHome } from '@/pages/citizen/Home'
import { ComingSoon } from '@/pages/citizen/ComingSoon'
import { PrintCertificate } from '@/pages/print/Certificate'
import { Mayor } from '@/pages/mayor/Mayor'
import { Present } from '@/pages/mayor/Present'
import { WardDrill } from '@/pages/mayor/WardDrill'
import { Pay } from '@/pages/payments/Pay'
import { Landing } from '@/pages/public/Landing'
import { PrintReceipt } from '@/pages/receipts/PrintReceipt'
import { ReceiptList } from '@/pages/receipts/List'
import { RegisterBook } from '@/pages/registers/RegisterBook'
import { RegisterDetail } from '@/pages/registers/RegisterDetail'
import { RegisterNew } from '@/pages/registers/RegisterNew'
import { LicenceDetail } from '@/pages/trade-licence/Detail'
import { LicenceList } from '@/pages/trade-licence/List'
import { LicenceNew } from '@/pages/trade-licence/New'
import { LicenceRenew } from '@/pages/trade-licence/Renew'
import { PrintLicence } from '@/pages/trade-licence/PrintLicence'
import { TradeLicenceRegister } from '@/pages/trade-licence/Register'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: no session of any kind needed. */}
        <Route path="/" element={<Landing />} />
        <Route path="/verify" element={<Verify />} />
        {/* The mock gateway is public: a citizen pays from a link, with no session. */}
        <Route path="/pay/:paymentId" element={<Pay />} />

        {/* Print views open directly, so a QR or a shared link always works. */}
        <Route path="/print/licence/:id" element={<PrintLicence />} />
        <Route path="/print/receipt/:id" element={<PrintReceipt />} />
        <Route path="/print/certificate/:id" element={<PrintCertificate />} />

        {/* Citizen Corner */}
        <Route path="/nagorik" element={<CitizenLayout />}>
          <Route index element={<CitizenHome />} />
          <Route
            path="services"
            element={
              <ComingSoon
                title="সেবার তালিকা"
                note="নাগরিক সনদ (সিটিজেন চার্টার) ও অনলাইন আবেদনের ফরম পরের ধাপে যুক্ত হচ্ছে। এখন অফিস থেকে আবেদন গ্রহণ করা যাচ্ছে।"
              />
            }
          />
          <Route
            path="track"
            element={
              <ComingSoon
                title="আবেদন ট্র্যাক করুন"
                note="ট্র্যাকিং নম্বর ও মোবাইল দিয়ে আবেদনের প্রতিটি ধাপ দেখার সুবিধা পরের ধাপে যুক্ত হচ্ছে।"
              />
            }
          />
          <Route
            path="messages"
            element={
              <ComingSoon
                title="বার্তা"
                note="প্রতিটি অবস্থা পরিবর্তনের এসএমএস (ডেমো) এখানে দেখা যাবে — পরের ধাপে যুক্ত হচ্ছে।"
              />
            }
          />
          <Route
            path="holding"
            element={
              <ComingSoon
                title="হোল্ডিং কর"
                note="হোল্ডিং নম্বর দিয়ে দাবি ও বকেয়া দেখে অনলাইনে পরিশোধের সুবিধা পরের ধাপে যুক্ত হচ্ছে।"
              />
            }
          />
          <Route
            path="notices"
            element={
              <ComingSoon
                title="নোটিশ বোর্ড"
                note="সব নোটিশের পূর্ণ তালিকা পরের ধাপে যুক্ত হচ্ছে। সর্বশেষ নোটিশগুলো হোম পাতায় দেখা যাচ্ছে।"
              />
            }
          />
        </Route>

        {/* Office */}
        <Route path="/office/login" element={<Login />} />
        {/* Presentation mode runs full screen, so it sits outside the office shell. */}
        <Route path="/office/mayor/present" element={<Present />} />
        <Route path="/office" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="mayor" element={<Mayor />} />
          <Route path="mayor/ward/:n" element={<WardDrill />} />
          <Route path="trade-licence" element={<LicenceList />} />
          <Route path="trade-licence/new" element={<LicenceNew />} />
          <Route path="trade-licence/renew" element={<LicenceRenew />} />
          <Route path="trade-licence/:id" element={<LicenceDetail />} />
          <Route path="register/trade-licence" element={<TradeLicenceRegister />} />
          <Route path="receipts" element={<ReceiptList />} />
          <Route path="registers/:key" element={<RegisterBook />} />
          <Route path="registers/:key/new" element={<RegisterNew />} />
          <Route path="registers/:key/:id" element={<RegisterDetail />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="phase-2/:key" element={<Phase2 />} />
        </Route>

        {/* Old v1 paths people may have bookmarked. */}
        <Route path="/login" element={<Navigate to="/office/login" replace />} />
        <Route path="/trade-licence/*" element={<Navigate to="/office/trade-licence" replace />} />
        <Route path="/registers/*" element={<Navigate to="/office" replace />} />
        <Route path="/receipts/*" element={<Navigate to="/office/receipts" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-center"
        richColors
        toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
      />
    </BrowserRouter>
  )
}
