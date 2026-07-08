import { Badge } from '@/components/ui'
import { TICKET_STATUS_LABEL, EVENT_STATUS_LABEL, type TicketStatus, type EventStatus } from '@/lib/types'

const ticketTone: Record<TicketStatus, Parameters<typeof Badge>[0]['tone']> = {
  active: 'green',
  used: 'slate',
  cancelled: 'red',
  expired: 'yellow',
}
export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={ticketTone[status]}>{TICKET_STATUS_LABEL[status]}</Badge>
}

const eventTone: Record<EventStatus, Parameters<typeof Badge>[0]['tone']> = {
  draft: 'slate',
  published: 'green',
  finished: 'yellow',
  cancelled: 'red',
}
export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge tone={eventTone[status]}>{EVENT_STATUS_LABEL[status]}</Badge>
}
