import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Ticket as TicketIcon, Download, Search, Ban, RotateCcw, Check, QrCode } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Ticket, EventRow, TicketStatus } from '@/lib/types'
import { TICKET_TYPE_LABEL } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import { Button, Card, EmptyState, Field, Input, Modal, PageLoader, Select } from '@/components/ui'
import { TicketStatusBadge } from '@/components/StatusBadge'
import { PageHeader } from '@/components/PageHeader'
import { QRCode } from '@/components/QRCode'

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all')
  const [q, setQ] = useState('')
  const [qrTicket, setQrTicket] = useState<Ticket | null>(null)

  async function load() {
    const [{ data: tks }, { data: evs }] = await Promise.all([
      supabase.from('tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*'),
    ])
    setTickets((tks as Ticket[]) ?? [])
    setEvents((evs as EventRow[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const eventTitle = (id: string) => events.find((e) => e.id === id)?.title ?? '—'

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (eventFilter !== 'all' && t.event_id !== eventFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (q) {
        const s = q.toLowerCase()
        return (t.unique_code.toLowerCase().includes(s) || (t.holder_name ?? '').toLowerCase().includes(s))
      }
      return true
    })
  }, [tickets, eventFilter, statusFilter, q])

  async function setStatus(t: Ticket, status: TicketStatus) {
    const update: Partial<Ticket> = { status }
    if (status === 'used') update.checked_in_at = new Date().toISOString()
    const { error } = await supabase.from('tickets').update(update).eq('id', t.id)
    if (error) return toast.error('Erro ao atualizar')
    toast.success('Ingresso atualizado')
    load()
  }

  function exportCsv() {
    const rows = [['codigo', 'evento', 'tipo', 'titular', 'status', 'criado_em', 'checkin']]
    filtered.forEach((t) => rows.push([
      t.unique_code, eventTitle(t.event_id), t.ticket_type, t.holder_name ?? '', t.status,
      t.created_at, t.checked_in_at ?? '',
    ]))
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'ingressos.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ingressos"
        subtitle={`${filtered.length} de ${tickets.length} ingressos`}
        action={<Button variant="ghost" onClick={exportCsv}><Download className="h-4 w-4" /> Exportar</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código ou titular…" className="pl-9" />
        </div>
        <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
          <option value="all">Todos os eventos</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | TicketStatus)}>
          <option value="all">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="used">Usado</option>
          <option value="cancelled">Cancelado</option>
          <option value="expired">Expirado</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<TicketIcon className="h-8 w-8" />} title="Nenhum ingresso encontrado" />
      ) : (
        <div className="grid gap-2">
          {filtered.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-100">{t.unique_code}</span>
                  <TicketStatusBadge status={t.status} />
                </div>
                <p className="truncate text-xs text-slate-500">
                  {eventTitle(t.event_id)} · {TICKET_TYPE_LABEL[t.ticket_type]} · {t.holder_name ?? '—'}
                </p>
                <p className="text-[11px] text-slate-600">Criado {formatDateTime(t.created_at)}{t.checked_in_at && ` · Check-in ${formatDateTime(t.checked_in_at)}`}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setQrTicket(t)} className="px-2.5"><QrCode className="h-4 w-4" /></Button>
                {t.status !== 'used' && <Button variant="ghost" onClick={() => setStatus(t, 'used')} className="px-2.5 text-accent"><Check className="h-4 w-4" /></Button>}
                {t.status !== 'cancelled' ? (
                  <Button variant="ghost" onClick={() => setStatus(t, 'cancelled')} className="px-2.5 text-danger hover:bg-danger/10"><Ban className="h-4 w-4" /></Button>
                ) : (
                  <Button variant="ghost" onClick={() => setStatus(t, 'active')} className="px-2.5 text-success"><RotateCcw className="h-4 w-4" /></Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(qrTicket)} onClose={() => setQrTicket(null)} title="QR Code do ingresso">
        {qrTicket && (
          <div className="flex flex-col items-center gap-3">
            <QRCode value={qrTicket.qr_code} size={220} />
            <p className="font-mono text-sm font-semibold text-slate-200">{qrTicket.unique_code}</p>
            <p className="text-xs text-slate-500">{eventTitle(qrTicket.event_id)}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
