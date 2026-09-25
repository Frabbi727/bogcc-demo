import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/PageHeader'

interface Props {
  title: string
  note: string
}

/**
 * Stands in for a Citizen Corner page that a later build phase fills in. It is a
 * real page rather than a dead link, so nothing in the bottom tabs ever 404s.
 */
export function ComingSoon({ title, note }: Props) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <p className="text-[13.5px] leading-relaxed text-muted">{note}</p>
      </Card>
    </>
  )
}
