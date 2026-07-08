import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, UserPlus, QrCode } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Guest, EventRow, TicketType } from '@/lib/types'
import { TICKET_TYPE_LABEL } from '@/lib/types'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageLoader, Select } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { QRCode } from '@/components/QRCode'

const empty = { name: '', email: '', phone: '', ticket_type: 'pista' as TicketType }

function genCode() {
  return 'TBA-C' + Math.random().toString(36).slice(2, 9).toUpperCase()
}

export default function AdminGuests() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [eventId, setEventId] = useState('')
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [qrGuest, setQrGuest] = useState<Guest | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
      const list = (data as EventRow[]) ?? []
      setEvents(list)
      if (list[0]) setEventId(list[0].id)
      setLoading(false)
    })()
  }, [])

  async function loadGuests(eid: string) {
    if (!eid) return
    const { data } = await supabase.from('guest_list').select('*').eq('event_id', eid).order('created_at', { ascending: false })
    setGuests((data as Guest[]) ?? [])
  }
  useEffect(() => { loadGuests(eventId) }, [eventId])

  async function save() {
    if (!form.name.trim()) return toast.error('Informe o nome do convidado')
    setSaving(true)
    const { error } = await supabase.from('guest_list').insert({
      event_id: eventId, name: form.name, email: form.email || null, phone: form.phone || null,
      ticket_type: form.ticket_type,
      qr_code: crypto.randomUUID().replace(/-/g, ''),
      unique_code: genCode(),
      status: 'active',
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Convidado adicionado')
    setForm(empty); setModal(false); loadGuests(eventId)
  }

  async function remove(g: Guest) {
    if (!confirm(`Remover ${g.name} da lista?`)) return
    await supabase.from('guest_list').delete().eq('id', g.id)
    toast.success('Removido'); loadGuests(eventId)
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <PageHeader title="Lista de convidados" subtitle="Ingressos gratuitos manuais." action={<Button onClick={() => setModal(true)} disabled={!eventId}><Plus className="h-4 w-4" /> Adicionar</Button>} />

      <Field label="Evento">
        <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {events.length === 0 && <option value="">Crie um evento primeiro</option>}
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </Select>
      </Field>

      {guests.length === 0 ? (
        <EmptyState icon={<UserPlus className="h-8 w-8" />} title="Nenhum convidado" description="Adicione convidados VIP com acesso gratuito." />
      ) : (
        <div className="grid gap-2">
          {guests.map((g) => (
            <Card key={g.id} className="flex items-center justify-between p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-100">{g.name}</p>
                  <Badge tone="brand">{TICKET_TYPE_LABEL[g.ticket_type]}</Badge>
                  {g.status === 'used' ? <Badge tone="slate">Entrou</Badge> : <Badge tone="green">Aguardando</Badge>}
                </div>
                <p className="text-xs text-slate-500">{g.email ?? g.phone ?? '—'} · {g.unique_code}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setQrGuest(g)} className="px-2.5"><QrCode className="h-4 w-4" /></Button>
                <Button variant="ghost" onClick={() => remove(g)} className="px-2.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Adicionar convidado">
        <div className="space-y-3">
          <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <Field label="Tipo de acesso">
            <Select value={form.ticket_type} onChange={(e) => setForm({ ...form, ticket_type: e.target.value as TicketType })}>
              {(Object.keys(TICKET_TYPE_LABEL) as TicketType[]).map((t) => <option key={t} value={t}>{TICKET_TYPE_LABEL[t]}</option>)}
            </Select>
          </Field>
          <Button onClick={save} loading={saving} className="w-full">Gerar convite gratuito</Button>
        </div>
      </Modal>

      <Modal open={Boolean(qrGuest)} onClose={() => setQrGuest(null)} title="QR do convidado">
        {qrGuest && (
          <div className="flex flex-col items-center gap-3">
            <QRCode value={qrGuest.qr_code} size={220} />
            <p className="font-semibold text-slate-100">{qrGuest.name}</p>
            <p className="font-mono text-sm text-slate-400">{qrGuest.unique_code}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
