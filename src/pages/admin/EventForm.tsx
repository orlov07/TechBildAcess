import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Save, Upload, ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EventRow, EventCategory, EventStatus } from '@/lib/types'
import { CATEGORY_LABEL, EVENT_STATUS_LABEL } from '@/lib/types'
import { Button, Card, Field, Input, Select, Textarea, PageLoader } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

const empty = {
  title: '', description: '', banner_url: '', category: 'show' as EventCategory,
  date: '', time: '', location_name: '', address: '', city: '', max_capacity: 0,
  status: 'draft' as EventStatus,
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
    let error
    if (isEdit) {
      ;({ error } = await supabase.from('events').update(payload).eq('id', id))
    } else {
      ;({ error } = await supabase.from('events').insert({ ...payload, created_by: profile?.id }))
    }
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success(isEdit ? 'Evento atualizado' : 'Evento criado')
    navigate('/admin/eventos')
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
    </div>
  )
}
