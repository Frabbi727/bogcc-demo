import { Check } from 'lucide-react'

import { toBnDigits } from '@/lib/bn'
import { cn } from '@/lib/cn'

export interface Step {
  label: string
  /** Sub-line, e.g. who did it and when. */
  meta?: string
}

interface Props {
  steps: Step[]
  /** Number of completed steps. */
  done: number
  /** Renders the whole strip in the cancelled tone. */
  cancelled?: boolean
}

export function WorkflowSteps({ steps, done, cancelled }: Props) {
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {steps.map((step, i) => {
        const complete = i < done
        const current = i === done && !cancelled
        return (
          <li key={step.label} className="flex flex-1 gap-2.5 sm:flex-col sm:gap-2">
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-[12px]',
                  cancelled && complete && 'border-stamp/40 bg-stamp/8 text-stamp',
                  !cancelled && complete && 'border-forest-700 bg-forest-700 text-white',
                  current && 'border-amber bg-amber/10 font-medium text-amber',
                  !complete && !current && 'border-rule bg-white text-muted',
                )}
              >
                {complete && !cancelled ? <Check size={13} strokeWidth={2.5} /> : toBnDigits(i + 1)}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    'w-px flex-1 sm:h-px sm:w-full',
                    complete && !cancelled ? 'bg-forest-700/40' : 'bg-rule',
                  )}
                />
              )}
            </div>
            <div className="pb-4 sm:pr-3 sm:pb-0">
              <p
                className={cn(
                  'text-[13.5px] leading-snug',
                  complete || current ? 'font-medium text-ink' : 'text-muted',
                )}
              >
                {step.label}
              </p>
              {step.meta && <p className="mt-0.5 text-[12px] text-muted">{step.meta}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
