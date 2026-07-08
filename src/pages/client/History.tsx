import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Order, EventRow } from '@/lib/types'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { Badge, EmptyState, PageLoader } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

type OrderWithEvent = Order & { event?: EventRow }

const statusTone: Record<string, Parameters<typeof Badge>[0]['tone']> = {
  confirmed: 'green', pending: 'yellow', cancelled: 'red', refunded: 'slate',
}
const statusLabel: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado', refunded: 'Reembolsado',
}

export default function History() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<OrderWithEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data: ords } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      const list = (ords as Order[]) ?? []
      const ids = [...new Set(list.map((o) => o.event_id))]
      const { data: evs } = await supabase.from('events').select('*').in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
      const map = new Map((evs as EventRow[] ?? []).map((e) => [e.id, e]))
      setOrders(list.map((o) => ({ ...o, event: map.get(o.event_id) })))
      setLoading(false)
    })()
  }, [profile])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Histórico de compras</h1>
        <p className="text-slate-400">Todos os seus pedidos.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<Receipt className="h-8 w-8" />} title="Nenhuma compra ainda" action={<Link to="/app" className="btn-primary">Ver eventos</Link>} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-slate-100">{o.event?.title ?? 'Evento'}</p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3 w-3" /> {formatDateTime(o.created_at)}</p>
                <div className="mt-1.5"><Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge></div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-100">{formatBRL(o.final_amount)}</p>
                {o.discount_amount > 0 && <p className="text-xs text-success">-{formatBRL(o.discount_amount)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
