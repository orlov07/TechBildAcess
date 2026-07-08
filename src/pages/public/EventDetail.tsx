import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CalendarDays, MapPin, Clock, Minus, Plus, Ticket, ArrowLeft, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Batch, EventRow } from '@/lib/types'
import { CATEGORY_LABEL, TICKET_TYPE_LABEL } from '@/lib/types'
import { formatBRL, formatDate, formatTime } from '@/lib/utils'
import { Badge, Button, PageLoader, EmptyState } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const cart = useCart()

  const [event, setEvent] = useState<EventRow | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!id) return
    ;(async () => {
      setLoading(true)
      const { data: ev } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
      const { data: bs } = await supabase
        .from('ticket_batches')
        .select('*')
        .eq('event_id', id)
        .eq('is_active', true)
        .order('price', { ascending: true })
      setEvent((ev as EventRow) ?? null)
      setBatches((bs as Batch[]) ?? [])
      setLoading(false)
    })()
  }, [id])

  function available(b: Batch) {
    return Math.max(0, b.quantity_total - b.quantity_sold)
  }
  function change(b: Batch, delta: number) {
    setQty((prev) => {
      const max = Math.min(available(b), b.limit_per_user > 0 ? b.limit_per_user : available(b))
      const next = Math.min(max, Math.max(0, (prev[b.id] ?? 0) + delta))
      return { ...prev, [b.id]: next }
    })
  }

  const total = batches.reduce((sum, b) => sum + (qty[b.id] ?? 0) * b.price, 0)
  const totalItems = Object.values(qty).reduce((a, b) => a + b, 0)

  function goToCheckout() {
    if (!event) return
    cart.setEvent(event.id)
    Object.entries(qty).forEach(([bid, q]) => cart.setQty(bid, q))
    if (!session) {
      navigate('/login', { state: { from: `/evento/${event.id}` } })
      return
    }
    navigate(`/app/checkout/${event.id}`)
  }

  if (loading) return <PageLoader />
  if (!event) return <EmptyState title="Evento não encontrado" action={<Link to="/eventos" className="btn-ghost">Ver eventos</Link>} />

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="relative aspect-[21/9] w-full bg-bg-elevated">
          {event.banner_url ? (
            <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600/30 to-accent/20">
              <Ticket className="h-14 w-14 text-brand-300/60" />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <div className="space-y-5 lg:col-span-2">
          <div className="space-y-3">
            <Badge tone="brand">{CATEGORY_LABEL[event.category]}</Badge>
            <h1 className="text-3xl font-bold text-slate-50">{event.title}</h1>
            <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-400" /> {formatDate(event.date, "EEEE, dd 'de' MMMM 'de' yyyy")}</p>
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-400" /> {formatTime(event.time) || 'A definir'}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-400" /> {event.location_name ?? 'A definir'}{event.city ? ` · ${event.city}` : ''}</p>
              {event.max_capacity ? <p className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-400" /> Capacidade: {event.max_capacity}</p> : null}
            </div>
            {event.address && <p className="text-sm text-slate-500">{event.address}</p>}
          </div>
          {event.description && (
            <div className="card">
              <h3 className="mb-2 font-semibold text-slate-100">Sobre o evento</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400">{event.description}</p>
            </div>
          )}
        </div>

        {/* Lotes / compra */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20 space-y-4">
            <h3 className="font-semibold text-slate-100">Ingressos</h3>
            {batches.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum lote disponível no momento.</p>
            ) : (
              <div className="space-y-3">
                {batches.map((b) => {
                  const avail = available(b)
                  return (
                    <div key={b.id} className="rounded-xl border border-border bg-bg-soft p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{b.name}</p>
                          <p className="text-xs text-slate-500">{TICKET_TYPE_LABEL[b.ticket_type]}</p>
                        </div>
                        <p className="font-bold text-brand-300">{formatBRL(b.price)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          {avail > 0 ? `${avail} disponíveis` : 'Esgotado'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => change(b, -1)}
                            disabled={(qty[b.id] ?? 0) === 0}
                            className="btn-ghost h-8 w-8 rounded-lg p-0 disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-slate-100">{qty[b.id] ?? 0}</span>
                          <button
                            onClick={() => change(b, 1)}
                            disabled={avail === 0}
                            className="btn-ghost h-8 w-8 rounded-lg p-0 disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {batches.length > 0 && (
              <>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-slate-400">Total ({totalItems})</span>
                  <span className="text-lg font-bold text-slate-100">{formatBRL(total)}</span>
                </div>
                <Button onClick={goToCheckout} disabled={totalItems === 0} className="w-full">
                  <Ticket className="h-4 w-4" /> {session ? 'Continuar' : 'Entrar e comprar'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
