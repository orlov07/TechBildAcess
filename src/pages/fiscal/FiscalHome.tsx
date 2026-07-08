import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, CalendarDays, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EventRow } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { EmptyState, PageLoader } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

const SELECTED_KEY = 'tba_fiscal_event'

export default function FiscalHome() {
  const { isAdmin, staffEvents } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      let query = supabase.from('events').select('*').in('status', ['published', 'finished']).order('date')
      const { data } = await query
      let list = (data as EventRow[]) ?? []

      if (!isAdmin) {
        const global = staffEvents.some((s) => s.event_id === null)
        if (!global) {
          const allowed = new Set(staffEvents.map((s) => s.event_id))
          list = list.filter((e) => allowed.has(e.id))
        }
      }
      setEvents(list)
      setLoading(false)
    })()
  }, [isAdmin, staffEvents])

  function select(ev: EventRow) {
    localStorage.setItem(SELECTED_KEY, JSON.stringify({ id: ev.id, title: ev.title }))
    navigate('/fiscal/checkin')
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <ScanLine className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Selecione o evento</h1>
        <p className="text-slate-400">Escolha o evento para iniciar o check-in.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState title="Nenhum evento disponível" description="Você não está autorizado a validar nenhum evento no momento." />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => select(ev)}
              className="card flex w-full items-center justify-between gap-3 p-4 text-left transition hover:border-accent/50"
            >
              <div>
                <p className="font-semibold text-slate-100">{ev.title}</p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays className="h-3 w-3" /> {formatDate(ev.date)} · {ev.city ?? '—'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
