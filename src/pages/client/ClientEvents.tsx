import { useEffect, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { fetchPublishedEvents, type EventWithPrice } from '@/lib/queries'
import { EventCard } from '@/components/EventCard'
import { EmptyState, PageLoader } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

export default function ClientEvents() {
  const { profile, email } = useAuth()
  const [events, setEvents] = useState<EventWithPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublishedEvents().then(setEvents).catch(() => setEvents([])).finally(() => setLoading(false))
  }, [])

  const name = profile?.name?.split(' ')[0] ?? email?.split('@')[0]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-brand-300">Olá, {name} 👋</p>
        <h1 className="text-2xl font-bold text-slate-100">Descubra eventos</h1>
      </div>
      {loading ? (
        <PageLoader />
      ) : events.length === 0 ? (
        <EmptyState icon={<PartyPopper className="h-8 w-8" />} title="Nenhum evento disponível" description="Novos eventos aparecerão aqui." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} minPrice={e.minPrice} to={`/evento/${e.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
