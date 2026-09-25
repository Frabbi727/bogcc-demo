import { TriangleAlert } from 'lucide-react'

/** Shown on every page except print views, so nobody mistakes this for live data. */
export function DemoBanner() {
  return (
    <div className="no-print flex items-center justify-center gap-2 bg-amber/12 px-4 py-1.5 text-[13px] text-amber">
      <TriangleAlert size={14} strokeWidth={2} />
      <span className="font-medium">ডেমো সংস্করণ: সকল তথ্য কাল্পনিক</span>
    </div>
  )
}
