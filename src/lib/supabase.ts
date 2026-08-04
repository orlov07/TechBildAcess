import { createClient } from '@supabase/supabase-js'
import { localClient } from '@/lib/localClient'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// O modo local é o padrão. Só use o serviço externo quando isso for solicitado.
const useLocalStorage = import.meta.env.VITE_STORAGE_MODE !== 'supabase'

if (!url || !anonKey) {
  // Aviso claro no console quando as variáveis não estão configuradas.
  // eslint-disable-next-line no-console
  console.warn(
    '[TechBildAcess] Variáveis do Supabase ausentes. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env',
  )
}

const remoteClient = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// Sem credenciais, o sistema funciona inteiramente neste navegador.
// Mantemos a mesma interface usada nas telas para que o Supabase continue opcional.
export const supabase: any = !useLocalStorage && url && anonKey ? remoteClient : localClient

export const isSupabaseConfigured = !useLocalStorage && Boolean(url && anonKey)
