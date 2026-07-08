import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Order, Ticket as TicketRow, EventRow } from '@/lib/types'
import { TICKET_TYPE_LABEL } from '@/lib/types'
import { formatBRL } from '@/lib/utils'
import { Card, PageLoader, Button } from '@/components/ui'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [event, setEvent] = useState<EventRow | null>(null)
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    ;(async () => {
      const { data: ord } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
      const { data: tks } = await supabase.from('tickets').select('*').eq('order_id', orderId)
      if (ord) {
        const { data: ev } = await supabase.from('events').select('*').eq('id', (ord as Order).event_id).maybeSingle()
        setEvent((ev as EventRow) ?? null)
      }
      setOrder((ord as Order) ?? null)
      setTickets((tks as TicketRow[]) ?? [])
      setLoading(false)
    })()
  }, [orderId])

  if (loading) return <PageLoader />

  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <div className="flex flex-col items-center gap-3 pt-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-9 w-9 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Pedido confirmado!</h1>
        <p className="text-slate-400">
          {tickets.length} ingresso{tickets.length !== 1 ? 's' : ''} gerado{tickets.length !== 1 ? 's' : ''} para{' '}
          <strong className="text-slate-200">{event?.title}</strong>.
        </p>
      </div>

      <Card className="space-y-3 text-left">
        <h3 className="font-semibold text-slate-100">Seus ingressos</h3>
        {tickets.map((t) => (
          <Link
            key={t.id}
            to={`/app/ingresso/${t.id}`}
            className="flex items-center justify-between rounded-xl border border-border bg-bg-soft p-3 transition hover:border-brand-500/50"
          >
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-brand-400" />
              <div>
                <p className="text-sm font-semibold text-slate-100">{TICKET_TYPE_LABEL[t.ticket_type]}</p>
                <p className="text-xs text-slate-500">{t.unique_code}</p>
              </div>
            </div>
            <span className="text-xs text-brand-300">Ver QR →</span>
          </Link>
        ))}
        {order && (
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-slate-400">Total pago</span>
            <span className="font-bold text-slate-100">{formatBRL(order.final_amount)}</span>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Link to="/app/meus-ingressos" className="btn-primary flex-1">Meus ingressos</Link>
        <Link to="/app" className="btn-ghost flex-1">Ver eventos</Link>
      </div>
    </div>
  )
}
