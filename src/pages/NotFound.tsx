import { Link } from 'react-router-dom'
import { Ghost } from 'lucide-react'
import { Logo } from '@/components/Brand'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <Ghost className="h-16 w-16 text-brand-400" />
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Página não encontrada</h1>
        <p className="mt-1 text-slate-400">A página que você procura não existe ou foi movida.</p>
      </div>
      <Link to="/" className="btn-primary">Voltar ao início</Link>
    </div>
  )
}
