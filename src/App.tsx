import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { Layout } from '@/components/Layout'
import { AuditLog } from '@/pages/AuditLog'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { Phase2 } from '@/pages/Phase2'
import { SearchPage } from '@/pages/Search'
import { Verify } from '@/pages/Verify'
import { PrintReceipt } from '@/pages/receipts/PrintReceipt'
import { ReceiptList } from '@/pages/receipts/List'
import { RegisterBook } from '@/pages/registers/RegisterBook'
import { RegisterDetail } from '@/pages/registers/RegisterDetail'
import { RegisterNew } from '@/pages/registers/RegisterNew'
import { LicenceDetail } from '@/pages/trade-licence/Detail'
import { LicenceList } from '@/pages/trade-licence/List'
import { LicenceNew } from '@/pages/trade-licence/New'
import { PrintLicence } from '@/pages/trade-licence/PrintLicence'
import { TradeLicenceRegister } from '@/pages/trade-licence/Register'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Openable without a session: public verification and print views. */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/trade-licence/:id/print" element={<PrintLicence />} />
        <Route path="/receipts/:id/print" element={<PrintReceipt />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trade-licence" element={<LicenceList />} />
          <Route path="/trade-licence/new" element={<LicenceNew />} />
          <Route path="/trade-licence/:id" element={<LicenceDetail />} />
          <Route path="/register" element={<TradeLicenceRegister />} />
          <Route path="/receipts" element={<ReceiptList />} />
          <Route path="/registers/:key" element={<RegisterBook />} />
          <Route path="/registers/:key/new" element={<RegisterNew />} />
          <Route path="/registers/:key/:id" element={<RegisterDetail />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/phase-2/:key" element={<Phase2 />} />
        </Route>

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
