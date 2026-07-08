import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, CalendarDays, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EventRow, EventStatus } from '@/lib/types'
import { CATEGORY_LABEL } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Button, EmptyState, PageLoader } from '@/components/ui'
import { EventStatusBadge } from '@/components/StatusBadge'
import { PageHeader } from '@/components/PageHeader'

export default function AdminEvents() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    setEvents((data as EventRow[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function togglePublish(ev: EventRow) {
    const next: EventStatus = ev.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase.from('events').update({ status: next }).eq('id', ev.id)
    if (error) return toast.error('Erro ao atualizar')
    toast.success(next === 'published' ? 'Evento publicado' : 'Evento despublicado')
    load()
  }

  async function remove(ev: EventRow) {
    if (!confirm(`Excluir "${ev.title}"? Isso remove lotes, ingressos e pedidos vinculados.`)) return
    const { error } = await supabase.from('events').delete().eq('id', ev.id)
    if (error) return toast.error('Erro ao excluir')
    toast.success('Evento excluído')
    load()
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Eventos"
        subtitle="Gerencie seus eventos."
        action={<Link to="/admin/eventos/novo" className="btn-primary"><Plus className="h-4 w-4" /> Novo evento</Link>}
      />

      {events.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="Nenhum evento criado" action={<Link to="/admin/eventos/novo" className="btn-primary">Criar evento</Link>} />
      ) : (
        <div className="grid gap-3">
          {events.map((ev) => (
            <div key={ev.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-bg-elevated">
                  {ev.banner_url ? <img src={ev.banner_url} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-100">{ev.title}</p>
                    <EventStatusBadge status={ev.status} />
                  </div>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(ev.date)}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.city ?? '—'}</span>
                    <span>· {CATEGORY_LABEL[ev.category]}</span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" onClick={() => togglePublish(ev)} className="px-3">
                  {ev.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="hidden sm:inline">{ev.status === 'published' ? 'Despublicar' : 'Publicar'}</span>
                </Button>
                <Link to={`/admin/eventos/${ev.id}`} className="btn-ghost px-3"><Pencil className="h-4 w-4" /></Link>
                <Button variant="ghost" onClick={() => remove(ev)} className="px-3 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
