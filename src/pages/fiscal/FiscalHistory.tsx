import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, History as HistoryIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { CheckinLog } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import { EmptyState, PageLoader } from '@/components/ui'
import { getFiscalEvent } from '@/lib/fiscalEvent'

const iconFor = (status: string) =>
  status === 'valid' ? <CheckCircle2 className="h-5 w-5 text-success" />
  : status === 'already_used' || status === 'expired' ? <AlertTriangle className="h-5 w-5 text-warn" />
  : <XCircle className="h-5 w-5 text-danger" />

export default function FiscalHistory() {
  const [logs, setLogs] = useState<CheckinLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const event = getFiscalEvent()
      let query = supabase.from('checkin_logs').select('*').order('created_at', { ascending: false }).limit(100)
      if (event) {
        query = query.eq('event_id', event.id)
      }
      const { data } = await query
      setLogs((data as CheckinLog[]) ?? [])
      setLoading(false)
    })()
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Histórico de validações</h1>
      {logs.length === 0 ? (
        <EmptyState icon={<HistoryIcon className="h-8 w-8" />} title="Nenhuma validação ainda" description="Os check-ins realizados aparecerão aqui." />
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="card flex items-center gap-3 p-3">
              {iconFor(l.status)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{l.message ?? l.status}</p>
                <p className="text-xs text-slate-500">{formatDateTime(l.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
