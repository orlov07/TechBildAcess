import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Save, Upload, ImageIcon, Loader2, Plus, Pencil, Trash2, Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EventRow, EventCategory, EventStatus, Batch, TicketType } from '@/lib/types'
import { CATEGORY_LABEL, EVENT_STATUS_LABEL, TICKET_TYPE_LABEL } from '@/lib/types'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageLoader, Select, Textarea } from '@/components/ui'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

const empty = {
  title: '', description: '', banner_url: '', category: 'show' as EventCategory,
  date: '', time: '', location_name: '', address: '', city: '', max_capacity: 0,
  status: 'draft' as EventStatus,
}

const emptyBatch = {
  name: '', ticket_type: 'pista' as TicketType, price: 0, quantity_total: 100,
  limit_per_user: 0, starts_at: '', ends_at: '', is_active: true,
}

export default function EventForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Lotes de ingresso (somente quando o evento já foi salvo)
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchModal, setBatchModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [batchForm, setBatchForm] = useState(emptyBatch)
  const [savingBatch, setSavingBatch] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
      if (data) {
        const e = data as EventRow
        setForm({
          title: e.title, description: e.description ?? '', banner_url: e.banner_url ?? '',
          category: e.category, date: e.date ?? '', time: e.time ?? '',
          location_name: e.location_name ?? '', address: e.address ?? '', city: e.city ?? '',
          max_capacity: e.max_capacity ?? 0, status: e.status,
        })
      }
      setLoading(false)
    })()
  }, [id, isEdit])

  async function loadBatches() {
    if (!id) return
    const { data } = await supabase.from('ticket_batches').select('*').eq('event_id', id).order('created_at')
    setBatches((data as Batch[]) ?? [])
  }
  useEffect(() => { if (isEdit) loadBatches() }, [id, isEdit])

  function openNewBatch() {
    setEditingBatch(null); setBatchForm(emptyBatch); setBatchModal(true)
  }
  function openEditBatch(b: Batch) {
    setEditingBatch(b)
    setBatchForm({
      name: b.name, ticket_type: b.ticket_type, price: b.price, quantity_total: b.quantity_total,
      limit_per_user: b.limit_per_user, starts_at: b.starts_at?.slice(0, 16) ?? '', ends_at: b.ends_at?.slice(0, 16) ?? '', is_active: b.is_active,
    })
    setBatchModal(true)
  }

  async function saveBatch() {
    if (!batchForm.name.trim()) return toast.error('Informe o nome do lote')
    setSavingBatch(true)
    const payload = {
      event_id: id, name: batchForm.name, ticket_type: batchForm.ticket_type,
      price: Number(batchForm.price), quantity_total: Number(batchForm.quantity_total),
      limit_per_user: Number(batchForm.limit_per_user),
      starts_at: batchForm.starts_at || null, ends_at: batchForm.ends_at || null, is_active: batchForm.is_active,
    }
    let error
    if (editingBatch) ({ error } = await supabase.from('ticket_batches').update(payload).eq('id', editingBatch.id))
    else ({ error } = await supabase.from('ticket_batches').insert(payload))
    setSavingBatch(false)
    if (error) return toast.error(error.message)
    toast.success(editingBatch ? 'Lote atualizado' : 'Lote criado')
    setBatchModal(false)
    loadBatches()
  }

  async function removeBatch(b: Batch) {
    if (!confirm('Excluir o lote "' + b.name + '"?')) return
    const { error } = await supabase.from('ticket_batches').delete().eq('id', b.id)
    if (error) return toast.error('Erro ao excluir')
    toast.success('Lote excluído')
    loadBatches()
  }

  async function uploadBanner(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('event-banners').upload(path, file, { upsert: true })
    if (error) {
      toast.error('Falha no upload. Verifique o bucket "event-banners" ou cole uma URL.')
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('event-banners').getPublicUrl(path)
    setForm((f) => ({ ...f, banner_url: data.publicUrl }))
    setUploading(false)
    toast.success('Imagem enviada')
  }

  async function save() {
    if (!form.title.trim()) return toast.error('Informe o título do evento')
    setSaving(true)
    const payload = {
      ...form,
      time: form.time || null,
      date: form.date || null,
      max_capacity: Number(form.max_capacity) || 0,
    }
    if (isEdit) {
      const { error } = await supabase.from('events').update(payload).eq('id', id)
      setSaving(false)
      if (error) return toast.error(error.message)
      toast.success('Evento atualizado')
      navigate('/admin/eventos')
    } else {
      const { data, error } = await supabase.from('events').insert({ ...payload, created_by: profile?.id }).select().single()
      setSaving(false)
      if (error) return toast.error(error.message)
      toast.success('Evento criado. Agora adicione os lotes de ingresso.')
      navigate(`/admin/eventos/${data.id}`)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button onClick={() => navigate('/admin/eventos')} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Eventos
      </button>
      <h1 className="text-2xl font-bold text-slate-100">{isEdit ? 'Editar evento' : 'Novo evento'}</h1>

      <Card className="space-y-4">
        {/* Banner */}
        <Field label="Banner do evento">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-elevated sm:w-48">
              {form.banner_url ? (
                <img src={form.banner_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-600" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="btn-ghost inline-flex cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Enviar imagem
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
              </label>
              <Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} placeholder="ou cole uma URL de imagem" />
            </div>
          </div>
        </Field>

        <Field label="Título *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nome do evento" /></Field>
        <Field label="Descrição"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do evento…" /></Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}>
              {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}>
              {(Object.keys(EVENT_STATUS_LABEL) as EventStatus[]).map((s) => <option key={s} value={s}>{EVENT_STATUS_LABEL[s]}</option>)}
            </Select>
          </Field>
          <Field label="Data"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Horário"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Local"><Input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} placeholder="Nome do local" /></Field>
          <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Endereço"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Capacidade máxima"><Input type="number" min={0} value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: Number(e.target.value) })} /></Field>
        </div>

        <Button onClick={save} loading={saving} className="w-full"><Save className="h-4 w-4" /> {isEdit ? 'Salvar alterações' : 'Criar evento'}</Button>
      </Card>

      {isEdit && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Lotes de ingresso</h2>
              <p className="text-xs text-slate-500">Cada evento pode ter vários lotes (pista, VIP, camarote…). Crie quantos precisar.</p>
            </div>
            <Button onClick={openNewBatch}><Plus className="h-4 w-4" /> Novo lote</Button>
          </div>

          {batches.length === 0 ? (
            <EmptyState icon={<Layers className="h-8 w-8" />} title="Nenhum lote neste evento" action={<Button onClick={openNewBatch}>Criar lote</Button>} />
          ) : (
            <div className="grid gap-3">
              {batches.map((b) => {
                const avail = b.quantity_total - b.quantity_sold
                return (
                  <div key={b.id} className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
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
                      <Button variant="ghost" onClick={() => openEditBatch(b)} className="px-3"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" onClick={() => removeBatch(b)} className="px-3 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <Modal open={batchModal} onClose={() => setBatchModal(false)} title={editingBatch ? 'Editar lote' : 'Novo lote'}>
        <div className="space-y-3">
          <Field label="Nome do lote"><Input value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} placeholder="1º lote, VIP, Camarote…" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={batchForm.ticket_type} onChange={(e) => setBatchForm({ ...batchForm, ticket_type: e.target.value as TicketType })}>
                {(Object.keys(TICKET_TYPE_LABEL) as TicketType[]).map((t) => <option key={t} value={t}>{TICKET_TYPE_LABEL[t]}</option>)}
              </Select>
            </Field>
            <Field label="Preço (R$)"><Input type="number" min={0} step="0.01" value={batchForm.price} onChange={(e) => setBatchForm({ ...batchForm, price: Number(e.target.value) })} /></Field>
            <Field label="Quantidade total"><Input type="number" min={0} value={batchForm.quantity_total} onChange={(e) => setBatchForm({ ...batchForm, quantity_total: Number(e.target.value) })} /></Field>
            <Field label="Limite por pessoa (0 = sem)"><Input type="number" min={0} value={batchForm.limit_per_user} onChange={(e) => setBatchForm({ ...batchForm, limit_per_user: Number(e.target.value) })} /></Field>
            <Field label="Início das vendas"><Input type="datetime-local" value={batchForm.starts_at} onChange={(e) => setBatchForm({ ...batchForm, starts_at: e.target.value })} /></Field>
            <Field label="Fim das vendas"><Input type="datetime-local" value={batchForm.ends_at} onChange={(e) => setBatchForm({ ...batchForm, ends_at: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={batchForm.is_active} onChange={(e) => setBatchForm({ ...batchForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-border bg-bg-soft" />
            Lote ativo (disponível para venda)
          </label>
          <Button onClick={saveBatch} loading={savingBatch} className="w-full">Salvar lote</Button>
        </div>
      </Modal>
    </div>
  )
}
