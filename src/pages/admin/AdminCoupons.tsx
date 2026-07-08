import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Tag, Power } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Coupon, EventRow } from '@/lib/types'
import { formatBRL, formatDate } from '@/lib/utils'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageLoader, Select } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

const empty = {
  code: '', discount_type: 'percent' as 'percent' | 'fixed', discount_value: 10,
  event_id: '', max_uses: 0, expires_at: '', is_active: true,
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: cs }, { data: evs }] = await Promise.all([
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*'),
    ])
    setCoupons((cs as Coupon[]) ?? [])
    setEvents((evs as EventRow[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!form.code.trim()) return toast.error('Informe o código')
    setSaving(true)
    const { error } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      event_id: form.event_id || null,
      max_uses: Number(form.max_uses),
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Cupom criado')
    setForm(empty); setModal(false); load()
  }

  async function toggle(c: Coupon) {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    load()
  }
  async function remove(c: Coupon) {
    if (!confirm(`Excluir cupom ${c.code}?`)) return
    await supabase.from('coupons').delete().eq('id', c.id)
    toast.success('Cupom excluído'); load()
  }

  const eventTitle = (id: string | null) => (id ? events.find((e) => e.id === id)?.title ?? '—' : 'Todos os eventos')

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <PageHeader title="Cupons" subtitle="Descontos promocionais." action={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Novo cupom</Button>} />

      {coupons.length === 0 ? (
        <EmptyState icon={<Tag className="h-8 w-8" />} title="Nenhum cupom criado" action={<Button onClick={() => setModal(true)}>Criar cupom</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {coupons.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-brand-300">{c.code}</span>
                  {c.is_active ? <Badge tone="green">Ativo</Badge> : <Badge tone="slate">Inativo</Badge>}
                </div>
                <p className="text-sm text-slate-300">
                  {c.discount_type === 'percent' ? `${c.discount_value}% off` : `${formatBRL(c.discount_value)} off`}
                </p>
                <p className="text-xs text-slate-500">
                  {eventTitle(c.event_id)} · Usos {c.used_count}{c.max_uses > 0 ? `/${c.max_uses}` : ''}
                  {c.expires_at && ` · expira ${formatDate(c.expires_at)}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" onClick={() => toggle(c)} className="px-2.5"><Power className="h-4 w-4" /></Button>
                <Button variant="ghost" onClick={() => remove(c)} className="px-2.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo cupom">
        <div className="space-y-3">
          <Field label="Código"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PROMO10" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'fixed' })}>
                <option value="percent">Porcentagem (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </Select>
            </Field>
            <Field label="Valor"><Input type="number" min={0} step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Evento">
            <Select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}>
              <option value="">Todos os eventos</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Máx. usos (0 = ilimitado)"><Input type="number" min={0} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} /></Field>
            <Field label="Validade"><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></Field>
          </div>
          <Button onClick={save} loading={saving} className="w-full">Criar cupom</Button>
        </div>
      </Modal>
    </div>
  )
}
