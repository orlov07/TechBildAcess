import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, LogOut, ShieldCheck, ScanLine } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Card, Field, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { initials } from '@/lib/utils'

export default function Profile() {
  const { profile, email, isAdmin, isFiscal, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', cpf: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) setForm({ name: profile.name ?? '', phone: profile.phone ?? '', cpf: profile.cpf ?? '' })
  }, [profile])

  async function save() {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: form.name, phone: form.phone, cpf: form.cpf })
      .eq('id', profile.id)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); return }
    await refreshProfile()
    toast.success('Perfil atualizado!')
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/20 text-xl font-bold text-brand-200">
          {initials(profile?.name ?? email)}
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-100">{profile?.name ?? 'Meu perfil'}</h1>
          <p className="text-sm text-slate-400">{email}</p>
          {isAdmin && <span className="chip mt-1 bg-brand-500/15 text-brand-200">Administrador</span>}
          {!isAdmin && isFiscal && <span className="chip mt-1 bg-accent/15 text-accent">Fiscal</span>}
        </div>
      </div>

      <Card className="space-y-3">
        <Field label="Nome completo"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="E-mail"><Input value={email ?? ''} disabled className="opacity-60" /></Field>
        <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 90000-0000" /></Field>
        <Field label="CPF (opcional)"><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></Field>
        <Button onClick={save} loading={saving} className="w-full"><Save className="h-4 w-4" /> Salvar alterações</Button>
      </Card>

      {(isAdmin || isFiscal) && (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-slate-100">Acesso rápido</p>
          <div className="flex gap-2">
            {isAdmin && <Link to="/admin" className="btn-ghost flex-1"><ShieldCheck className="h-4 w-4" /> Painel Admin</Link>}
            <Link to="/fiscal" className="btn-ghost flex-1"><ScanLine className="h-4 w-4" /> Área Fiscal</Link>
          </div>
        </Card>
      )}

      <Button variant="ghost" onClick={async () => { await signOut(); navigate('/') }} className="w-full">
        <LogOut className="h-4 w-4" /> Sair da conta
      </Button>
    </div>
  )
}
