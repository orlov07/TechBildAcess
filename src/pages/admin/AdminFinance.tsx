import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Receipt, TrendingUp, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Order, EventRow, Batch, Ticket } from '@/lib/types'
import { formatBRL } from '@/lib/utils'
import { Card, PageLoader, StatCard, Button } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

export default function AdminFinance() {
  const [orders, setOrders] = useState<Order[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [{ data: o }, { data: e }, { data: b }, { data: t }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('events').select('*'),
        supabase.from('ticket_batches').select('*'),
        supabase.from('tickets').select('*'),
      ])
      setOrders((o as Order[]) ?? [])
      setEvents((e as EventRow[]) ?? [])
      setBatches((b as Batch[]) ?? [])
      setTickets((t as Ticket[]) ?? [])
      setLoading(false)
    })()
  }, [])

  if (loading) return <PageLoader />

  const confirmed = orders.filter((o) => o.status === 'confirmed')
  const revenue = confirmed.reduce((s, o) => s + Number(o.final_amount), 0)
  const discounts = confirmed.reduce((s, o) => s + Number(o.discount_amount), 0)
  const avgTicket = confirmed.length ? revenue / confirmed.length : 0

  const byEvent = events
    .map((ev) => {
      const evOrders = confirmed.filter((o) => o.event_id === ev.id)
      return {
        event: ev,
        revenue: evOrders.reduce((s, o) => s + Number(o.final_amount), 0),
        sales: evOrders.length,
        tickets: tickets.filter((t) => t.event_id === ev.id).length,
      }
    })
    .filter((r) => r.sales > 0)
    .sort((a, b) => b.revenue - a.revenue)

  function exportCsv() {
    const rows = [['evento', 'receita', 'vendas', 'ingressos']]
    byEvent.forEach((r) => rows.push([r.event.title, String(r.revenue), String(r.sales), String(r.tickets)]))
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'financeiro.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Financeiro" subtitle="Receita e desempenho de vendas." action={<Button variant="ghost" onClick={exportCsv}><Download className="h-4 w-4" /> Exportar</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Receita total" value={formatBRL(revenue)} icon={<DollarSign className="h-5 w-5" />} tone="green" />
        <StatCard label="Vendas" value={confirmed.length} icon={<ShoppingBag className="h-5 w-5" />} tone="brand" />
        <StatCard label="Ticket médio" value={formatBRL(avgTicket)} icon={<TrendingUp className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Descontos" value={formatBRL(discounts)} icon={<Receipt className="h-5 w-5" />} tone="yellow" />
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-100">Receita por evento</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-slate-500">
                <th className="pb-2 pr-4 font-medium">Evento</th>
                <th className="pb-2 pr-4 font-medium">Vendas</th>
                <th className="pb-2 pr-4 font-medium">Ingressos</th>
                <th className="pb-2 text-right font-medium">Receita</th>
              </tr>
            </thead>
            <tbody>
              {byEvent.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">Sem vendas registradas.</td></tr>
              ) : (
                byEvent.map((r) => (
                  <tr key={r.event.id} className="border-b border-border/50">
                    <td className="py-2.5 pr-4 text-slate-200">{r.event.title}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{r.sales}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{r.tickets}</td>
                    <td className="py-2.5 text-right font-semibold text-success">{formatBRL(r.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
