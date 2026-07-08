import { useEffect, useMemo, useState } from 'react'
import { Search, PartyPopper } from 'lucide-react'
import { fetchPublishedEvents, type EventWithPrice } from '@/lib/queries'
import { EventCard } from '@/components/EventCard'
import { EmptyState, PageLoader, Input } from '@/components/ui'
import { CATEGORY_LABEL, type EventCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

const categories: Array<'all' | EventCategory> = ['all', 'show', 'festa', 'teatro', 'esporte', 'palestra', 'festival', 'outro']

export default function Events() {
  const [events, setEvents] = useState<EventWithPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<'all' | EventCategory>('all')

  useEffect(() => {
    fetchPublishedEvents().then(setEvents).catch(() => setEvents([])).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesCat = cat === 'all' || e.category === cat
      const matchesQ =
        !q ||
        e.title.toLowerCase().includes(q.toLowerCase()) ||
        (e.city ?? '').toLowerCase().includes(q.toLowerCase())
      return matchesCat && matchesQ
    })
  }, [events, q, cat])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Eventos disponíveis</h1>
        <p className="text-slate-400">Encontre e garanta seu ingresso.</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por evento ou cidade…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'chip whitespace-nowrap border border-border px-3 py-1.5 transition',
                cat === c ? 'bg-brand-500/20 text-brand-200' : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {c === 'all' ? 'Todos' : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<PartyPopper className="h-8 w-8" />} title="Nenhum evento encontrado" description="Ajuste os filtros ou volte mais tarde." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} minPrice={e.minPrice} />
          ))}
        </div>
      )}
    </div>
  )
}
