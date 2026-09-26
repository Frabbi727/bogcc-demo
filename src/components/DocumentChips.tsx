import { Paperclip, X } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/Button'
import { toBnDigits } from '@/lib/bn'

/**
 * Simulated document attachments. The demo keeps only the file name — nothing is
 * uploaded or stored anywhere, which is what spec §13.3 asks for. It is here so
 * the application form looks like the real thing and the review step can list
 * what the citizen "attached".
 */
export function DocumentChips({
  docs,
  attached,
  onChange,
}: {
  docs: string[]
  attached: Record<string, string>
  onChange: (next: Record<string, string>) => void
}) {
  if (docs.length === 0) return null

  return (
    <ul className="flex flex-col gap-2">
      {docs.map((doc, i) => (
        <DocumentRow
          key={doc}
          index={i}
          doc={doc}
          fileName={attached[doc]}
          onPick={(fileName) => onChange({ ...attached, [doc]: fileName })}
          onClear={() => {
            const next = { ...attached }
            delete next[doc]
            onChange(next)
          }}
        />
      ))}
    </ul>
  )
}

function DocumentRow({
  index,
  doc,
  fileName,
  onPick,
  onClear,
}: {
  index: number
  doc: string
  fileName?: string
  onPick: (fileName: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = `doc-${index}`

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-rule/70 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug">
          <span className="text-muted">{toBnDigits(index + 1)}.</span> {doc}
        </p>
        {fileName && (
          <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[12px] text-forest-700">
            <Paperclip size={12} className="shrink-0" />
            {fileName}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const name = e.target.files?.[0]?.name
          if (name) onPick(name)
          // Allow re-picking the same file after removing it.
          e.target.value = ''
        }}
      />

      {fileName ? (
        <Button size="sm" variant="danger" onClick={onClear}>
          <X size={13} />
          সরান
        </Button>
      ) : (
        <Button size="sm" onClick={() => inputRef.current?.click()}>
          যুক্ত করুন
        </Button>
      )}
    </li>
  )
}
