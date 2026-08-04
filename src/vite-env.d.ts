/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_ADMIN_EMAILS: string
  readonly VITE_STORAGE_MODE?: 'local' | 'supabase'
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
