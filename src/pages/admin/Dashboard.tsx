import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Ticket, DollarSign, Users, CheckCircle2, TrendingUp, Activity,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '@/lib/supabase'
import type { Order, Ticket as TicketRow, EventRow } from '@/lib/types'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { StatCard, PageLoader } from '@/components/ui'

interface Data {
  events: EventRow[]
  orders: Order[]
  tickets: TicketRow[]
  clients: number
}

export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [{ data: events }, { data: orders }, { data: tickets }, { count: clients }] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('tickets').select('*'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])
      setData({
        events: (events as EventRow[]) ?? [],
        orders: (orders as Order[]) ?? [],
        tickets: (tickets as TicketRow[]) ?? [],
        clients: clients ?? 0,
      })
      setLoading(false)
    })()
  }, [])

  if (loading || !data) return <PageLoader />

  const revenue = data.orders.filter((o) => o.status === 'confirmed').reduce((s, o) => s + Number(o.final_amount), 0)
  const usedTickets = data.tickets.filter((t) => t.status === 'used').length
  const activeTickets = data.tickets.filter((t) => t.status === 'active').length
  const activeEvents = data.events.filter((e) => e.status === 'published').length

  // Receita por evento (top 6)
  const revByEvent = new Map<string, number>()
  for (const o of data.orders) {
    if (o.status !== 'confirmed') continue
    revByEvent.set(o.event_id, (revByEvent.get(o.event_id) ?? 0) + Number(o.final_amount))
  }
  const chartData = [...revByEvent.entries()]
    .map(([eid, value]) => ({
      name: (data.events.find((e) => e.id === eid)?.title ?? '—').slice(0, 14),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400">Visão geral da plataforma.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Receita total" value={formatBRL(revenue)} icon={<DollarSign className="h-5 w-5" />} tone="green" />
        <StatCard label="Ingressos vendidos" value={data.tickets.length} icon={<Ticket className="h-5 w-5" />} tone="brand" />
        <StatCard label="Check-ins" value={usedTickets} icon={<CheckCircle2 className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Clientes" value={data.clients} icon={<Users className="h-5 w-5" />} tone="slate" />
        <StatCard label="Eventos ativos" value={activeEvents} icon={<CalendarDays className="h-5 w-5" />} tone="brand" />
        <StatCard label="Total de eventos" value={data.events.length} icon={<Activity className="h-5 w-5" />} tone="slate" />
        <StatCard label="Ingressos ativos" value={activeTickets} icon={<Ticket className="h-5 w-5" />} tone="yellow" />
        <StatCard label="Pedidos" value={data.orders.length} icon={<TrendingUp className="h-5 w-5" />} tone="cyan" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Gráfico */}
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-100">Receita por evento</h3>
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sem dados de receita ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262636" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(124,92,252,0.08)' }}
                  contentStyle={{ background: '#16161f', border: '1px solid #262636', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(v: number) => [formatBRL(v), 'Receita']}
                />
                <Bar dataKey="value" fill="#7c5cfc" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Últimas vendas */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-100">Últimas vendas</h3>
          {data.orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Nenhuma venda ainda.</p>
          ) : (
            <div className="space-y-3">
              {data.orders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{o.buyer_name ?? 'Cliente'}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(o.created_at)}</p>
                  </div>
                  <span className="text-sm font-semibold text-success">{formatBRL(o.final_amount)}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin/financeiro" className="mt-3 block text-center text-xs text-brand-300">Ver financeiro →</Link>
        </div>
      </div>
    </div>
  )
}
