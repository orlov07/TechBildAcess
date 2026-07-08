import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CalendarDays, MapPin, Share2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Ticket, EventRow, Batch } from '@/lib/types'
import { TICKET_TYPE_LABEL } from '@/lib/types'
import { formatDate, formatDateTime, formatTime, appUrl } from '@/lib/utils'
import { QRCode } from '@/components/QRCode'
import { PageLoader, EmptyState, Button } from '@/components/ui'
import { TicketStatusBadge } from '@/components/StatusBadge'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [event, setEvent] = useState<EventRow | null>(null)
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data: t } = await supabase.from('tickets').select('*').eq('id', id).maybeSingle()
      if (t) {
        const tk = t as Ticket
        const [{ data: ev }, { data: b }] = await Promise.all([
          supabase.from('events').select('*').eq('id', tk.event_id).maybeSingle(),
          tk.batch_id ? supabase.from('ticket_batches').select('*').eq('id', tk.batch_id).maybeSingle() : Promise.resolve({ data: null }),
        ])
        setEvent((ev as EventRow) ?? null)
        setBatch((b as Batch) ?? null)
      }
      setTicket((t as Ticket) ?? null)
      setLoading(false)
    })()
  }, [id])

  async function share() {
    const url = `${appUrl()}/app/ingresso/${id}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Meu ingresso · TechBildAcess', text: event?.title, url }) } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado!')
    }
  }

  if (loading) return <PageLoader />
  if (!ticket) return <EmptyState title="Ingresso não encontrado" />

  return (
    <div className="mx-auto max-w-md space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="card overflow-hidden p-0">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-brand-600/30 to-accent/15 p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-brand-200">TechBildAcess</p>
          <h1 className="mt-1 text-xl font-bold text-slate-50">{event?.title ?? 'Evento'}</h1>
          <div className="mt-2 flex justify-center"><TicketStatusBadge status={ticket.status} /></div>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center gap-3 border-y border-dashed border-border p-6">
          {ticket.status === 'active' ? (
            <QRCode value={ticket.qr_code} size={220} />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-2xl bg-bg-elevated text-center text-sm text-slate-500">
              QR indisponível<br />(ingresso {ticket.status})
            </div>
          )}
          <p className="font-mono text-sm font-semibold tracking-wider text-slate-200">{ticket.unique_code}</p>
        </div>

        {/* Detalhes */}
        <div className="space-y-2.5 p-6 text-sm">
          <Row icon={<CalendarDays className="h-4 w-4" />} label="Data" value={`${formatDate(event?.date)} ${formatTime(event?.time)}`} />
          <Row icon={<MapPin className="h-4 w-4" />} label="Local" value={`${event?.location_name ?? '—'}${event?.city ? ` · ${event.city}` : ''}`} />
          <Row label="Tipo" value={TICKET_TYPE_LABEL[ticket.ticket_type]} />
          <Row label="Lote" value={batch?.name ?? '—'} />
          <Row icon={<Clock className="h-4 w-4" />} label="Comprado em" value={formatDateTime(ticket.created_at)} />
          {ticket.checked_in_at && <Row label="Check-in" value={formatDateTime(ticket.checked_in_at)} />}
        </div>
      </div>

      <Button variant="ghost" onClick={share} className="w-full">
        <Share2 className="h-4 w-4" /> Compartilhar ingresso
      </Button>
    </div>
  )
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-slate-500">{icon}{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}
