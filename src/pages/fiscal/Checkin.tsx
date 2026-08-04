import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, XCircle, AlertTriangle, Camera, CameraOff, Keyboard, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Card, Input } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { getFiscalEvent } from '@/lib/fiscalEvent'

interface Result {
  status: string
  message: string
  ticket?: {
    unique_code: string
    ticket_type: string
    buyer: string
    batch: string
    purchased_at: string
    checked_in_at: string | null
  }
}

const RESULT_UI: Record<string, { color: string; bg: string; icon: typeof CheckCircle2; label: string }> = {
  valid: { color: 'text-success', bg: 'bg-success/15 border-success/40', icon: CheckCircle2, label: 'INGRESSO VÁLIDO' },
  already_used: { color: 'text-warn', bg: 'bg-warn/15 border-warn/40', icon: AlertTriangle, label: 'JÁ UTILIZADO' },
  cancelled: { color: 'text-danger', bg: 'bg-danger/15 border-danger/40', icon: XCircle, label: 'CANCELADO' },
  expired: { color: 'text-warn', bg: 'bg-warn/15 border-warn/40', icon: AlertTriangle, label: 'EXPIRADO' },
  wrong_event: { color: 'text-danger', bg: 'bg-danger/15 border-danger/40', icon: XCircle, label: 'EVENTO INCORRETO' },
  invalid: { color: 'text-danger', bg: 'bg-danger/15 border-danger/40', icon: XCircle, label: 'INGRESSO INVÁLIDO' },
  unauthorized: { color: 'text-danger', bg: 'bg-danger/15 border-danger/40', icon: XCircle, label: 'SEM PERMISSÃO' },
}

export default function Checkin() {
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(null)
  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [processing, setProcessing] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })

  useEffect(() => {
    setSelected(getFiscalEvent())
  }, [])

  useEffect(() => {
    return () => { stopScanner() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function validate(code: string) {
    if (!selected) return
    const now = Date.now()
    if (lastScanRef.current.code === code && now - lastScanRef.current.at < 3000) return
    lastScanRef.current = { code, at: now }

    setProcessing(true)
    const { data, error } = await supabase.rpc('check_in_ticket', { p_qr: code, p_event_id: selected.id })
    setProcessing(false)
    if (error) {
      setResult({ status: 'invalid', message: error.message })
      return
    }
    setResult(data as Result)
    if (navigator.vibrate) navigator.vibrate((data as Result).status === 'valid' ? 120 : [80, 60, 80])
  }

  async function startScanner() {
    setResult(null)
    setScanning(true)
    try {
      const scanner = new Html5Qrcode('qr-reader', { verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => { validate(decoded) },
        () => {},
      )
    } catch {
      setScanning(false)
    }
  }

  async function stopScanner() {
    const s = scannerRef.current
    if (s) {
      try { if (s.isScanning) await s.stop(); await s.clear() } catch { /* noop */ }
      scannerRef.current = null
    }
    setScanning(false)
  }

  if (!selected) {
    return (
      <Card className="text-center">
        <p className="text-slate-300">Nenhum evento selecionado.</p>
        <Link to="/fiscal" className="btn-primary mt-3 inline-flex">Selecionar evento</Link>
      </Card>
    )
  }

  const ui = result ? RESULT_UI[result.status] ?? RESULT_UI.invalid : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Validando</p>
          <h1 className="text-lg font-bold text-slate-100">{selected.title}</h1>
        </div>
        <Link to="/fiscal" className="text-xs text-brand-300">Trocar</Link>
      </div>

      {/* Resultado */}
      {result && ui && (
        <div className={`rounded-2xl border p-5 text-center ${ui.bg}`}>
          <ui.icon className={`mx-auto h-14 w-14 ${ui.color}`} />
          <p className={`mt-2 text-xl font-black tracking-wide ${ui.color}`}>{ui.label}</p>
          <p className="text-sm text-slate-300">{result.message}</p>
          {result.ticket && (
            <div className="mt-4 space-y-1.5 rounded-xl bg-black/20 p-4 text-left text-sm">
              <Row label="Comprador" value={result.ticket.buyer} />
              <Row label="Tipo" value={result.ticket.ticket_type} />
              <Row label="Lote" value={result.ticket.batch} />
              <Row label="Código" value={result.ticket.unique_code} />
              <Row label="Comprado em" value={formatDateTime(result.ticket.purchased_at)} />
              {result.ticket.checked_in_at && <Row label="Check-in" value={formatDateTime(result.ticket.checked_in_at)} />}
            </div>
          )}
          <Button variant="ghost" onClick={() => setResult(null)} className="mt-4 w-full">
            <RotateCcw className="h-4 w-4" /> Próximo ingresso
          </Button>
        </div>
      )}

      {/* Scanner */}
      {!result && (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-black">
            <div id="qr-reader" className="mx-auto aspect-square w-full max-w-sm [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
            {!scanning && (
              <div className="flex aspect-square w-full max-w-sm mx-auto flex-col items-center justify-center gap-3 text-slate-500">
                <Camera className="h-12 w-12" />
                <p className="text-sm">Câmera desligada</p>
              </div>
            )}
          </div>

          {scanning ? (
            <Button variant="danger" onClick={stopScanner} className="w-full"><CameraOff className="h-4 w-4" /> Parar câmera</Button>
          ) : (
            <Button onClick={startScanner} loading={processing} className="w-full py-3 text-base"><Camera className="h-5 w-5" /> Abrir câmera</Button>
          )}

          {/* Manual */}
          <Card className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Keyboard className="h-4 w-4" /> Validação manual</p>
            <div className="flex gap-2">
              <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Cole o código do QR" />
              <Button onClick={() => manual && validate(manual.trim())} loading={processing}>Validar</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-100">{value}</span>
    </div>
  )
}
