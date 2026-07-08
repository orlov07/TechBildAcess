import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Batch, EventRow, TicketType } from '@/lib/types'
import { TICKET_TYPE_LABEL } from '@/lib/types'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageLoader, Select } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

const emptyBatch = {
  name: '', ticket_type: 'pista' as TicketType, price: 0, quantity_total: 100,
  limit_per_user: 0, starts_at: '', ends_at: '', is_active: true,
}

export default function AdminBatches() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [eventId, setEventId] = useState<string>('')
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [form, setForm] = useState(emptyBatch)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
      const list = (data as EventRow[]) ?? []
      setEvents(list)
      if (list[0]) setEventId(list[0].id)
      setLoading(false)
    })()
  }, [])

  async function loadBatches(eid: string) {
    if (!eid) return
    const { data } = await supabase.from('ticket_batches').select('*').eq('event_id', eid).order('created_at')
    setBatches((data as Batch[]) ?? [])
  }
  useEffect(() => { loadBatches(eventId) }, [eventId])

  function openNew() {
    setEditing(null); setForm(emptyBatch); setModal(true)
  }
  function openEdit(b: Batch) {
    setEditing(b)
    setForm({
      name: b.name, ticket_type: b.ticket_type, price: b.price, quantity_total: b.quantity_total,
      limit_per_user: b.limit_per_user, starts_at: b.starts_at?.slice(0, 16) ?? '', ends_at: b.ends_at?.slice(0, 16) ?? '', is_active: b.is_active,
    })
    setModal(true)
  }

  async function save() {
    if (!form.name.trim()) return toast.error('Informe o nome do lote')
    setSaving(true)
    const payload = {
      event_id: eventId, name: form.name, ticket_type: form.ticket_type,
      price: Number(form.price), quantity_total: Number(form.quantity_total),
      limit_per_user: Number(form.limit_per_user),
      starts_at: form.starts_at || null, ends_at: form.ends_at || null, is_active: form.is_active,
    }
    let error
    if (editing) ({ error } = await supabase.from('ticket_batches').update(payload).eq('id', editing.id))
    else ({ error } = await supabase.from('ticket_batches').insert(payload))
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success(editing ? 'Lote atualizado' : 'Lote criado')
    setModal(false)
    loadBatches(eventId)
  }

  async function remove(b: Batch) {
    if (!confirm(`Excluir o lote "${b.name}"?`)) return
    const { error } = await supabase.from('ticket_batches').delete().eq('id', b.id)
    if (error) return toast.error('Erro ao excluir')
    toast.success('Lote excluído')
    loadBatches(eventId)
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lotes"
        subtitle="Configure os lotes de ingressos por evento."
        action={<Button onClick={openNew} disabled={!eventId}><Plus className="h-4 w-4" /> Novo lote</Button>}
      />

      <Field label="Evento">
        <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {events.length === 0 && <option value="">Crie um evento primeiro</option>}
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </Select>
      </Field>

      {batches.length === 0 ? (
        <EmptyState icon={<Layers className="h-8 w-8" />} title="Nenhum lote neste evento" action={<Button onClick={openNew} disabled={!eventId}>Criar lote</Button>} />
      ) : (
        <div className="grid gap-3">
          {batches.map((b) => {
            const avail = b.quantity_total - b.quantity_sold
            return (
              <Card key={b.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-100">{b.name}</p>
                    <Badge tone="brand">{TICKET_TYPE_LABEL[b.ticket_type]}</Badge>
                    {b.is_active ? <Badge tone="green">Ativo</Badge> : <Badge tone="slate">Inativo</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatBRL(b.price)} · Vendidos {b.quantity_sold}/{b.quantity_total} · {avail} disponíveis
                    {b.limit_per_user > 0 && ` · limite ${b.limit_per_user}/pessoa`}
                  </p>
                  {(b.starts_at || b.ends_at) && (
                    <p className="text-xs text-slate-600">
                      {b.starts_at && `de ${formatDateTime(b.starts_at)}`} {b.ends_at && `até ${formatDateTime(b.ends_at)}`}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" onClick={() => openEdit(b)} className="px-3"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" onClick={() => remove(b)} className="px-3 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar lote' : 'Novo lote'}>
        <div className="space-y-3">
          <Field label="Nome do lote"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="1º lote, VIP, Camarote…" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={form.ticket_type} onChange={(e) => setForm({ ...form, ticket_type: e.target.value as TicketType })}>
                {(Object.keys(TICKET_TYPE_LABEL) as TicketType[]).map((t) => <option key={t} value={t}>{TICKET_TYPE_LABEL[t]}</option>)}
              </Select>
            </Field>
            <Field label="Preço (R$)"><Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
            <Field label="Quantidade total"><Input type="number" min={0} value={form.quantity_total} onChange={(e) => setForm({ ...form, quantity_total: Number(e.target.value) })} /></Field>
            <Field label="Limite por pessoa (0 = sem)"><Input type="number" min={0} value={form.limit_per_user} onChange={(e) => setForm({ ...form, limit_per_user: Number(e.target.value) })} /></Field>
            <Field label="Início das vendas"><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></Field>
            <Field label="Fim das vendas"><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-border bg-bg-soft" />
            Lote ativo (disponível para venda)
          </label>
          <Button onClick={save} loading={saving} className="w-full">Salvar lote</Button>
        </div>
      </Modal>
    </div>
  )
}
