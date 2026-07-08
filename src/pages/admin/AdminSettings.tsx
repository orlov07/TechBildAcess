import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Settings as SettingsIcon, Palette, Building2, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Card, Field, Input, Textarea, PageLoader } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { adminEmails } from '@/lib/utils'

const KEYS = [
  'platform_name', 'primary_color', 'logo_url', 'establishment_name',
  'cancellation_policy', 'terms',
] as const

export default function AdminSettings() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('settings').select('*')
      const map: Record<string, string> = {}
      for (const row of data ?? []) map[row.key] = row.value ?? ''
      setValues(map)
      setLoading(false)
    })()
  }, [])

  function set(key: string, v: string) { setValues((prev) => ({ ...prev, [key]: v })) }

  async function save() {
    setSaving(true)
    const rows = KEYS.map((key) => ({ key, value: values[key] ?? '' }))
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Configurações salvas')
  }

  if (loading) return <PageLoader />

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Configurações" subtitle="Personalize a plataforma." />

      <Card className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-100"><SettingsIcon className="h-4 w-4 text-brand-400" /> Geral</h3>
        <Field label="Nome da plataforma"><Input value={values.platform_name ?? ''} onChange={(e) => set('platform_name', e.target.value)} /></Field>
        <Field label="URL do logo"><Input value={values.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://…" /></Field>
        <Field label="Cor principal">
          <div className="flex gap-2">
            <input type="color" value={values.primary_color || '#7c5cfc'} onChange={(e) => set('primary_color', e.target.value)} className="h-11 w-14 rounded-lg border border-border bg-bg-soft" />
            <Input value={values.primary_color ?? ''} onChange={(e) => set('primary_color', e.target.value)} placeholder="#7c5cfc" />
          </div>
        </Field>
      </Card>

      <Card className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-100"><Building2 className="h-4 w-4 text-brand-400" /> Estabelecimento</h3>
        <Field label="Nome do estabelecimento"><Input value={values.establishment_name ?? ''} onChange={(e) => set('establishment_name', e.target.value)} /></Field>
      </Card>

      <Card className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-100"><FileText className="h-4 w-4 text-brand-400" /> Políticas</h3>
        <Field label="Política de cancelamento"><Textarea value={values.cancellation_policy ?? ''} onChange={(e) => set('cancellation_policy', e.target.value)} /></Field>
        <Field label="Termos de uso"><Textarea value={values.terms ?? ''} onChange={(e) => set('terms', e.target.value)} /></Field>
      </Card>

      <Card className="space-y-2">
        <h3 className="flex items-center gap-2 font-semibold text-slate-100"><Palette className="h-4 w-4 text-brand-400" /> Administradores</h3>
        <p className="text-xs text-slate-500">Definidos por e-mail no arquivo <code className="text-brand-300">.env</code> (VITE_ADMIN_EMAILS) e nas funções do banco.</p>
        <div className="flex flex-wrap gap-2">
          {adminEmails().map((e) => <span key={e} className="chip bg-brand-500/15 text-brand-200">{e}</span>)}
        </div>
      </Card>

      <Card className="space-y-2">
        <h3 className="font-semibold text-slate-100">Pagamentos (futuro)</h3>
        <p className="text-xs text-slate-500">Integração de gateway de pagamento será configurada aqui em versões futuras.</p>
      </Card>

      <Button onClick={save} loading={saving} className="w-full"><Save className="h-4 w-4" /> Salvar configurações</Button>
    </div>
  )
}
