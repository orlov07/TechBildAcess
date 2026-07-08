import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, QrCode, ShieldCheck, Zap, Ticket, BarChart3, Smartphone } from 'lucide-react'
import { fetchPublishedEvents, type EventWithPrice } from '@/lib/queries'
import { EventCard } from '@/components/EventCard'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

const features = [
  { icon: QrCode, title: 'QR Code único', desc: 'Cada ingresso com código exclusivo e validação anti-fraude.' },
  { icon: ShieldCheck, title: 'Check-in seguro', desc: 'Validação em tempo real na portaria, sem reutilização.' },
  { icon: Zap, title: 'Venda instantânea', desc: 'Lotes, cupons e áreas VIP configuráveis em segundos.' },
  { icon: BarChart3, title: 'Gestão completa', desc: 'Dashboard financeiro, relatórios e controle total.' },
]

export default function Landing() {
  const { session } = useAuth()
  const [events, setEvents] = useState<EventWithPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublishedEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-brand-600/15 to-transparent px-6 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl space-y-6">
          <span className="chip mx-auto bg-brand-500/15 text-brand-200">
            <Smartphone className="h-3.5 w-3.5" /> Plataforma de ingressos · PWA
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Venda e valide ingressos com{' '}
            <span className="bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">
              tecnologia de verdade
            </span>
          </h1>
          <p className="text-lg text-slate-400">
            TechBildAcess é a plataforma completa para vender ingressos online, controlar lotes,
            gerar QR Codes e fazer check-in na portaria — tudo em um só lugar.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/eventos" className="btn-primary w-full sm:w-auto">
              <Ticket className="h-4 w-4" /> Ver eventos
            </Link>
            <Link to={session ? '/app' : '/login'} className="btn-ghost w-full sm:w-auto">
              {session ? 'Meu painel' : 'Entrar'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-100">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Próximos eventos */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100">Próximos eventos</h2>
          <Link to="/eventos" className="text-sm font-medium text-brand-300 hover:text-brand-200">
            Ver todos →
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : events.length === 0 ? (
          <div className="card p-10 text-center text-slate-400">
            Nenhum evento publicado ainda. Volte em breve!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map((e) => (
              <EventCard key={e.id} event={e} minPrice={e.minPrice} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} TechBildAcess — Plataforma de ingressos online.
      </footer>
    </div>
  )
}
