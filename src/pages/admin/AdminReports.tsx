import { useEffect, useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import type { Order, Ticket, EventRow, CheckinLog } from '@/lib/types'
import { formatBRL } from '@/lib/utils'
import { Card, PageLoader, StatCard } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { format, parseISO, subDays, startOfDay } from 'date-fns'

const COLORS = ['#7c5cfc', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#a5a8ff']

export default function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [logs, setLogs] = useState<CheckinLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [{ data: o }, { data: t }, { data: e }, { data: l }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('events').select('*'),
        supabase.from('checkin_logs').select('*'),
      ])
      setOrders((o as Order[]) ?? [])
      setTickets((t as Ticket[]) ?? [])
      setEvents((e as EventRow[]) ?? [])
      setLogs((l as CheckinLog[]) ?? [])
      setLoading(false)
    })()
  }, [])

  // Vendas nos últimos 14 dias
  const salesSeries = useMemo(() => {
    const days: { date: string; label: string; value: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i))
      days.push({ date: d.toISOString().slice(0, 10), label: format(d, 'dd/MM'), value: 0 })
    }
    const map = new Map(days.map((d) => [d.date, d]))
    for (const o of orders) {
      if (o.status !== 'confirmed') continue
      const key = o.created_at.slice(0, 10)
      const day = map.get(key)
      if (day) day.value += Number(o.final_amount)
    }
    return days
  }, [orders])

  // Ingressos vendidos vs usados
  const usageData = useMemo(() => {
    const used = tickets.filter((t) => t.status === 'used').length
    const active = tickets.filter((t) => t.status === 'active').length
    const cancelled = tickets.filter((t) => t.status === 'cancelled').length
    return [
      { name: 'Usados', value: used },
      { name: 'Ativos', value: active },
      { name: 'Cancelados', value: cancelled },
    ].filter((d) => d.value > 0)
  }, [tickets])

  // Eventos mais vendidos
  const topEvents = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tickets) map.set(t.event_id, (map.get(t.event_id) ?? 0) + 1)
    return [...map.entries()]
      .map(([id, v]) => ({ name: (events.find((e) => e.id === id)?.title ?? '—').slice(0, 16), value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [tickets, events])

  // Check-ins por horário
  const checkinByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, value: 0 }))
    for (const l of logs) {
      if (l.status !== 'valid') continue
      const h = parseISO(l.created_at).getHours()
      hours[h].value += 1
    }
    return hours.filter((h) => h.value > 0)
  }, [logs])

  if (loading) return <PageLoader />

  const totalSold = tickets.length
  const totalUsed = tickets.filter((t) => t.status === 'used').length
  const attendance = totalSold ? Math.round((totalUsed / totalSold) * 100) : 0

  return (
    <div className="space-y-5">
      <PageHeader title="Relatórios" subtitle="Análises e indicadores." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ingressos vendidos" value={totalSold} tone="brand" />
        <StatCard label="Ingressos usados" value={totalUsed} tone="green" />
        <StatCard label="Taxa de comparecimento" value={`${attendance}%`} tone="cyan" />
        <StatCard label="Eventos" value={events.length} tone="slate" />
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-slate-100">Vendas (últimos 14 dias)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={salesSeries}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262636" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip
              contentStyle={{ background: '#16161f', border: '1px solid #262636', borderRadius: 12, color: '#e2e8f0' }}
              formatter={(v: number) => [formatBRL(v), 'Receita']}
            />
            <Area type="monotone" dataKey="value" stroke="#7c5cfc" strokeWidth={2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-slate-100">Ingressos vendidos vs usados</h3>
          {usageData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={usageData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {usageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #262636', borderRadius: 12, color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-slate-100">Eventos mais vendidos</h3>
          {topEvents.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {topEvents.map((e, i) => {
                const max = topEvents[0].value || 1
                return (
                  <div key={i}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-300">{e.name}</span>
                      <span className="font-semibold text-slate-100">{e.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(e.value / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-slate-100">Check-ins por horário</h3>
        {checkinByHour.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Nenhum check-in registrado ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={checkinByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262636" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #262636', borderRadius: 12, color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="#22d3ee33" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
