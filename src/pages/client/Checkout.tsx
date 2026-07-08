import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Tag, Check, ShoppingCart, ArrowLeft, Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Batch, EventRow } from '@/lib/types'
import { TICKET_TYPE_LABEL } from '@/lib/types'
import { formatBRL } from '@/lib/utils'
import { Button, Card, Field, Input, PageLoader, EmptyState } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'

export default function Checkout() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const cart = useCart()

  const [event, setEvent] = useState<EventRow | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '', cpf: '' })
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<{ discount_type: string; discount_value: number } | null>(null)
  const [couponMsg, setCouponMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    ;(async () => {
      const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle()
      const { data: bs } = await supabase.from('ticket_batches').select('*').eq('event_id', eventId)
      setEvent((ev as EventRow) ?? null)
      setBatches((bs as Batch[]) ?? [])
      setLoading(false)
    })()
  }, [eventId])

  useEffect(() => {
    if (profile) {
      setBuyer((b) => ({
        name: b.name || profile.name || '',
        email: b.email || profile.email || '',
        phone: b.phone || profile.phone || '',
        cpf: b.cpf || profile.cpf || '',
      }))
    }
  }, [profile])

  const items = useMemo(
    () =>
      Object.entries(cart.items)
        .map(([batchId, qty]) => {
          const b = batches.find((x) => x.id === batchId)
          return b ? { batch: b, qty } : null
        })
        .filter(Boolean) as { batch: Batch; qty: number }[],
    [cart.items, batches],
  )

  const subtotal = items.reduce((s, i) => s + i.batch.price * i.qty, 0)
  const discount = !coupon
    ? 0
    : coupon.discount_type === 'percent'
      ? Math.min(subtotal, (subtotal * coupon.discount_value) / 100)
      : Math.min(subtotal, coupon.discount_value)
  const total = subtotal - discount

  async function applyCoupon() {
    if (!couponCode.trim() || !eventId) return
    const { data, error } = await supabase.rpc('validate_coupon', { p_code: couponCode.trim(), p_event_id: eventId })
    if (error) { toast.error('Erro ao validar cupom'); return }
    if (data?.valid) {
      setCoupon({ discount_type: data.discount_type, discount_value: Number(data.discount_value) })
      setCouponMsg(data.message)
      toast.success('Cupom aplicado!')
    } else {
      setCoupon(null)
      setCouponMsg(data?.message ?? 'Cupom inválido')
      toast.error(data?.message ?? 'Cupom inválido')
    }
  }

  async function confirm() {
    if (!eventId || items.length === 0) return
    if (!buyer.name.trim()) { toast.error('Informe o nome do comprador'); return }
    setSubmitting(true)
    const payload = {
      p_event_id: eventId,
      p_items: items.map((i) => ({ batch_id: i.batch.id, quantity: i.qty })),
      p_coupon_code: coupon ? couponCode.trim() : null,
      p_buyer: buyer,
    }
    const { data, error } = await supabase.rpc('create_order', payload)
    setSubmitting(false)
    if (error) {
      toast.error(error.message || 'Não foi possível concluir a compra')
      return
    }
    cart.clear()
    toast.success('Compra confirmada! 🎉')
    navigate(`/app/pedido/${data.order_id}`)
  }

  if (loading) return <PageLoader />
  if (!event) return <EmptyState title="Evento não encontrado" />
  if (items.length === 0)
    return (
      <EmptyState
        icon={<ShoppingCart className="h-8 w-8" />}
        title="Seu carrinho está vazio"
        description="Selecione ingressos no evento para continuar."
        action={<Link to={`/evento/${eventId}`} className="btn-primary">Ver ingressos</Link>}
      />
    )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Finalizar compra</h1>
        <p className="text-slate-400">{event.title}</p>
      </div>

      {/* Resumo */}
      <Card className="space-y-3">
        <h3 className="font-semibold text-slate-100">Resumo do pedido</h3>
        {items.map((i) => (
          <div key={i.batch.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-300">
              {i.qty}× {i.batch.name} <span className="text-slate-500">· {TICKET_TYPE_LABEL[i.batch.ticket_type]}</span>
            </span>
            <span className="font-medium text-slate-200">{formatBRL(i.batch.price * i.qty)}</span>
          </div>
        ))}
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-success"><span>Desconto</span><span>-{formatBRL(discount)}</span></div>}
          <div className="flex justify-between pt-1 text-base font-bold text-slate-100"><span>Total</span><span>{formatBRL(total)}</span></div>
        </div>
      </Card>

      {/* Cupom */}
      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-100"><Tag className="h-4 w-4 text-brand-400" /> Cupom de desconto</h3>
        <div className="flex gap-2">
          <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="CUPOM10" />
          <Button variant="ghost" onClick={applyCoupon}>Aplicar</Button>
        </div>
        {couponMsg && (
          <p className={`text-xs ${coupon ? 'text-success' : 'text-danger'}`}>
            {coupon && <Check className="mr-1 inline h-3 w-3" />}{couponMsg}
          </p>
        )}
      </Card>

      {/* Comprador */}
      <Card className="space-y-3">
        <h3 className="font-semibold text-slate-100">Identificação do comprador</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome completo *"><Input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} placeholder="Seu nome" /></Field>
          <Field label="E-mail"><Input type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} placeholder="voce@email.com" /></Field>
          <Field label="Telefone"><Input value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} placeholder="(00) 90000-0000" /></Field>
          <Field label="CPF (opcional)"><Input value={buyer.cpf} onChange={(e) => setBuyer({ ...buyer, cpf: e.target.value })} placeholder="000.000.000-00" /></Field>
        </div>
      </Card>

      {/* Pagamento (preparado p/ futuro) */}
      <Card className="space-y-2">
        <h3 className="font-semibold text-slate-100">Pagamento</h3>
        <p className="text-xs text-slate-500">
          Integração de pagamento online será habilitada em breve. Por ora, o pedido é confirmado e os ingressos gerados imediatamente.
        </p>
      </Card>

      <Button onClick={confirm} loading={submitting} className="w-full py-3 text-base">
        <Ticket className="h-5 w-5" /> Confirmar compra · {formatBRL(total)}
      </Button>
    </div>
  )
}
