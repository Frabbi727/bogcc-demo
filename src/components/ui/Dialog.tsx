import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  footer?: ReactNode
  children?: ReactNode
}

export function Dialog({ open, title, description, onClose, footer, children }: Props) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Move focus into the dialog so keyboard users land in the right place.
    panel.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="বন্ধ করুন"
        className="absolute inset-0 cursor-default bg-ink/35"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg rounded-md border border-rule bg-white shadow-lg"
      >
        <header className="flex items-start justify-between gap-3 border-b border-rule/70 px-4 py-3">
          <div>
            <h2 className="text-[17px] leading-tight">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="rounded-sm p-1 text-muted hover:bg-paper hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>
        <div className="px-4 py-3.5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-rule/70 px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
