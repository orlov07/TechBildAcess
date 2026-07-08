import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import type { EventRow } from '@/lib/types'
import { CATEGORY_LABEL } from '@/lib/types'
import { formatBRL, formatDate, formatTime } from '@/lib/utils'
import { Badge } from '@/components/ui'

export function EventCard({ event, minPrice, to }: { event: EventRow; minPrice?: number | null; to?: string }) {
  const href = to ?? `/evento/${event.id}`
  return (
    <Link
      to={href}
      className="group card overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-glow"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-elevated">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600/30 to-accent/20">
            <Ticket className="h-10 w-10 text-brand-300/60" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge tone="brand">{CATEGORY_LABEL[event.category]}</Badge>
        </div>
      </div>
      <div className="space-y-2.5 p-4">
        <h3 className="line-clamp-1 font-semibold text-slate-100">{event.title}</h3>
        <div className="space-y-1.5 text-xs text-slate-400">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(event.date)} {event.time && `· ${formatTime(event.time)}`}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">
              {event.location_name ?? 'Local a definir'} {event.city && `· ${event.city}`}
            </span>
          </p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">A partir de</span>
          <span className="font-bold text-brand-300">
            {minPrice != null ? formatBRL(minPrice) : '—'}
          </span>
        </div>
      </div>
    </Link>
  )
}
