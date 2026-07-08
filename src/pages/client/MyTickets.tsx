import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ticket as TicketIcon, CalendarDays, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Ticket, EventRow } from '@/lib/types'
import { TICKET_TYPE_LABEL } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { EmptyState, PageLoader } from '@/components/ui'
import { TicketStatusBadge } from '@/components/StatusBadge'
import { useAuth } from '@/context/AuthContext'

type TicketWithEvent = Ticket & { event?: EventRow }

export default function MyTickets() {
  const { profile } = useAuth()
  const [tickets, setTickets] = useState<TicketWithEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data: tks } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      const list = (tks as Ticket[]) ?? []
      const eventIds = [...new Set(list.map((t) => t.event_id))]
      const { data: evs } = await supabase.from('events').select('*').in('id', eventIds.length ? eventIds : ['00000000-0000-0000-0000-000000000000'])
      const map = new Map((evs as EventRow[] ?? []).map((e) => [e.id, e]))
      setTickets(list.map((t) => ({ ...t, event: map.get(t.event_id) })))
      setLoading(false)
    })()
  }, [profile])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Meus ingressos</h1>
        <p className="text-slate-400">Sua carteira digital de ingressos.</p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="h-8 w-8" />}
          title="Você ainda não tem ingressos"
          description="Compre em um evento para vê-los aqui."
          action={<Link to="/app" className="btn-primary">Ver eventos</Link>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/app/ingresso/${t.id}`}
              className="card flex items-center justify-between gap-3 p-4 transition hover:border-brand-500/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                  <TicketIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">{t.event?.title ?? 'Evento'}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="h-3 w-3" /> {formatDate(t.event?.date)} · {TICKET_TYPE_LABEL[t.ticket_type]}
                  </p>
                  <div className="mt-1.5"><TicketStatusBadge status={t.status} /></div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
