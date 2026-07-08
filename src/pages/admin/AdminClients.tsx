import { useEffect, useMemo, useState } from 'react'
import { Users, Search, Mail, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Order } from '@/lib/types'
import { formatBRL, formatDate, initials } from '@/lib/utils'
import { Card, EmptyState, Input, PageLoader } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

interface ClientStat extends Profile {
  orders: number
  spent: number
  events: number
}

export default function AdminClients() {
  const [clients, setClients] = useState<ClientStat[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    ;(async () => {
      const [{ data: profs }, { data: orders }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*'),
      ])
      const ordList = (orders as Order[]) ?? []
      const stats = ((profs as Profile[]) ?? []).map((p) => {
        const mine = ordList.filter((o) => o.user_id === p.id && o.status === 'confirmed')
        return {
          ...p,
          orders: mine.length,
          spent: mine.reduce((s, o) => s + Number(o.final_amount), 0),
          events: new Set(mine.map((o) => o.event_id)).size,
        }
      })
      setClients(stats)
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(
    () => clients.filter((c) => !q || (c.name ?? '').toLowerCase().includes(q.toLowerCase()) || (c.email ?? '').toLowerCase().includes(q.toLowerCase())),
    [clients, q],
  )

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <PageHeader title="Clientes" subtitle={`${clients.length} clientes cadastrados`} />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail…" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="Nenhum cliente encontrado" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/20 text-sm font-bold text-brand-200">
                  {initials(c.name ?? c.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">{c.name ?? '—'}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500"><Mail className="h-3 w-3" /> {c.email}</p>
                  {c.phone && <p className="flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3 w-3" /> {c.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div><p className="text-lg font-bold text-slate-100">{c.orders}</p><p className="text-[10px] text-slate-500">Pedidos</p></div>
                <div><p className="text-lg font-bold text-slate-100">{c.events}</p><p className="text-[10px] text-slate-500">Eventos</p></div>
                <div><p className="text-lg font-bold text-success">{formatBRL(c.spent)}</p><p className="text-[10px] text-slate-500">Gasto</p></div>
              </div>
              <p className="text-[11px] text-slate-600">Cadastrado em {formatDate(c.created_at)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
