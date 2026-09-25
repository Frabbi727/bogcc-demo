import { ArrowRight } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'

import { ROLE_ORDER, USERS } from '@/data/users'
import { useStore } from '@/store/useStore'


export function Login() {
  const navigate = useNavigate()
  const session = useStore((s) => s.session)
  const login = useStore((s) => s.login)

  if (session) return <Navigate to="/office" replace />

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="flex items-center justify-center gap-2 bg-amber/12 px-4 py-1.5 text-[13px] font-medium text-amber">
        ডেমো সংস্করণ: সকল তথ্য কাল্পনিক
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10">
        <header className="mb-7 text-center">
          <p className="font-display text-[15px] text-muted">বগুড়া সিটি কর্পোরেশন</p>
          <h1 className="mt-1 text-[30px] leading-tight">ডিজিটাল রেজিস্টার ব্যবস্থা</h1>
          <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
            হাতে লেখা রেজিস্টার খাতার পরিবর্তে প্রতিটি সেবার হিসাব ডিজিটালভাবে রাখার একটি
            প্রদর্শনী। কোনো পাসওয়ার্ড নেই — যে ভূমিকায় কাজ দেখতে চান, সেটি বেছে নিন।
          </p>
        </header>

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {ROLE_ORDER.map((role) => {
            const user = USERS[role]
            return (
              <li key={role}>
                <button
                  type="button"
                  onClick={() => {
                    login(role)
                    navigate('/office')
                  }}
                  className="group flex w-full items-center justify-between gap-3 rounded-md border border-rule bg-white px-4 py-3 text-left transition-colors hover:border-forest-700/45 hover:bg-forest-50"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium">{user.title}</span>
                    <span className="block text-[13px] text-muted">{user.name}</span>
                    <span className="mt-0.5 block text-[12.5px] text-muted">{user.hint}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-muted transition-colors group-hover:text-forest-700"
                  />
                </button>
              </li>
            )
          })}
        </ul>

        <p className="mt-6 text-center text-[12.5px] text-muted">
          যেকোনো সময় উপরের ভূমিকা পরিবর্তনের তালিকা থেকে অন্য ভূমিকায় যাওয়া যাবে।
        </p>
      </div>
    </div>
  )
}
