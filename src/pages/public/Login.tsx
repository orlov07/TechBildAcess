import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@/components/Brand'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { ShieldCheck } from 'lucide-react'

export default function Login() {
  const { session, loading, isAdmin, isFiscal, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && session) {
      if (isAdmin) navigate('/admin', { replace: true })
      else if (isFiscal) navigate('/fiscal', { replace: true })
      else navigate('/app', { replace: true })
    }
  }, [loading, session, isAdmin, isFiscal, navigate])

  async function handleGoogle() {
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Não foi possível iniciar o login com Google.')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex justify-center"><Logo /></div>
        <div className="card space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">Bem-vindo</h1>
            <p className="text-sm text-slate-400">
              {isSupabaseConfigured ? 'Acesse com sua conta Google para comprar ingressos, gerenciar eventos ou validar entradas.' : 'Modo local ativo: os dados ficam salvos somente neste navegador.'}
            </p>
          </div>

          <Button onClick={handleGoogle} loading={busy} className="w-full">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#fff" d="M12 11v2.8h4a3.9 3.9 0 0 1-1.7 2.5v2.1h2.7A8.2 8.2 0 0 0 20 12c0-.6 0-1.2-.2-1.7H12Z" />
              <path fill="#fff" d="M12 20c2.4 0 4.4-.8 5.9-2.2l-2.9-2.2c-.8.5-1.8.9-3 .9-2.3 0-4.2-1.5-4.9-3.6H4.1v2.3A8 8 0 0 0 12 20Z" opacity=".8" />
            </svg>
            {isSupabaseConfigured ? 'Continuar com Google' : 'Entrar no modo local'}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5" /> {isSupabaseConfigured ? 'Login seguro via Supabase Auth' : 'Dados persistidos no armazenamento local'}
          </p>
        </div>
        <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-300">
          ← Voltar ao início
        </button>
      </div>
    </div>
  )
}
