import { supabase } from '@/lib/supabase'
import type { EventRow } from '@/lib/types'

export interface EventWithPrice extends EventRow {
  minPrice: number | null
}

/** Busca eventos publicados com o menor preço de lote ativo. */
export async function fetchPublishedEvents(): Promise<EventWithPrice[]> {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('date', { ascending: true })
  if (error) throw error

  const list = (events as EventRow[]) ?? []
  if (list.length === 0) return []

  const { data: batches } = await supabase
    .from('ticket_batches')
    .select('event_id, price, is_active')
    .in(
      'event_id',
      list.map((e) => e.id),
    )
    .eq('is_active', true)

  const minByEvent = new Map<string, number>()
  for (const b of batches ?? []) {
    const cur = minByEvent.get(b.event_id)
    if (cur == null || b.price < cur) minByEvent.set(b.event_id, b.price)
  }

  return list.map((e) => ({ ...e, minPrice: minByEvent.get(e.id) ?? null }))
}
