import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ShieldCheck, Power, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Staff, EventRow } from '@/lib/types'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageLoader, Select } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

const empty = { name: '', email: '', event_id: '' }

export default function AdminFiscals() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: st }, { data: evs }] = await Promise.all([
      supabase.from('staff').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*'),
    ])
    setStaff((st as Staff[]) ?? [])
    setEvents((evs as EventRow[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Informe nome e e-mail')
    setSaving(true)
    const { error } = await supabase.from('staff').insert({
      name: form.name, email: form.email.trim().toLowerCase(), event_id: form.event_id || null, is_active: true,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Fiscal cadastrado')
    setForm(empty); setModal(false); load()
  }

  async function toggle(s: Staff) {
    await supabase.from('staff').update({ is_active: !s.is_active }).eq('id', s.id)
    load()
  }
  async function remove(s: Staff) {
    if (!confirm(`Remover fiscal ${s.name}?`)) return
    await supabase.from('staff').delete().eq('id', s.id)
    toast.success('Removido'); load()
  }

  const eventTitle = (id: string | null) => (id ? events.find((e) => e.id === id)?.title ?? '—' : 'Todos os eventos')

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <PageHeader title="Fiscais" subtitle="Equipe autorizada a validar ingressos." action={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Novo fiscal</Button>} />

      <p className="rounded-xl border border-border bg-bg-soft p-3 text-xs text-slate-400">
        O fiscal acessa a plataforma com o e-mail cadastrado (login Google) e só pode validar os eventos vinculados.
      </p>

      {staff.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-8 w-8" />} title="Nenhum fiscal cadastrado" action={<Button onClick={() => setModal(true)}>Cadastrar fiscal</Button>} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {staff.map((s) => (
            <Card key={s.id} className="flex items-center justify-between p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-100">{s.name}</p>
                  {s.is_active ? <Badge tone="green">Ativo</Badge> : <Badge tone="slate">Inativo</Badge>}
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" /> {s.email}</p>
                <p className="text-xs text-slate-600">{eventTitle(s.event_id)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => toggle(s)} className="px-2.5"><Power className="h-4 w-4" /></Button>
                <Button variant="ghost" onClick={() => remove(s)} className="px-2.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo fiscal">
        <div className="space-y-3">
          <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="E-mail (Google)"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="fiscal@email.com" /></Field>
          <Field label="Evento permitido">
            <Select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}>
              <option value="">Todos os eventos</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
          </Field>
          <Button onClick={save} loading={saving} className="w-full">Cadastrar</Button>
        </div>
      </Modal>
    </div>
  )
}
