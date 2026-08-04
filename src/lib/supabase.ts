import { localClient } from '@/lib/localClient'

// Implementação em memória: não usa rede, banco ou armazenamento do navegador.
// Um reload reinicia completamente o estado da aplicação.
export const supabase: any = localClient
export const isSupabaseConfigured = false
