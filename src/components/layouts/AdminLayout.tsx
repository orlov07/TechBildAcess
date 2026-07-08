import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Layers, Ticket, Users, Tag, UserPlus,
  ShieldCheck, DollarSign, BarChart3, Settings, Menu, X, LogOut, ScanLine, ArrowLeft,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Logo } from '@/components/Brand'
import { cn, initials } from '@/lib/utils'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/admin/lotes', label: 'Lotes', icon: Layers },
  { to: '/admin/ingressos', label: 'Ingressos', icon: Ticket },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/cupons', label: 'Cupons', icon: Tag },
  { to: '/admin/convidados', label: 'Convidados', icon: UserPlus },
  { to: '/admin/fiscais', label: 'Fiscais', icon: ShieldCheck },
  { to: '/admin/financeiro', label: 'Financeiro', icon: DollarSign },
  { to: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export function AdminLayout() {
  const { profile, email, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-5">
        <Link to="/admin" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-bg-elevated lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mb-2 px-4">
        <span className="chip bg-brand-500/15 text-brand-200">Painel Administrativo</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 no-scrollbar">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-border p-3">
        <NavLink to="/fiscal" className="nav-link">
          <ScanLine className="h-4 w-4" /> Área do Fiscal
        </NavLink>
        <NavLink to="/app" className="nav-link">
          <ArrowLeft className="h-4 w-4" /> Voltar ao app
        </NavLink>
        <button
          onClick={async () => { await signOut(); navigate('/') }}
          className="nav-link w-full text-left"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-bg-soft/60 lg:block">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-bg-soft">{SidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-xl lg:px-6">
          <button className="rounded-lg p-2 text-slate-300 hover:bg-bg-elevated lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden"><Logo showText={false} /></div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-bg-soft py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-200">
                {initials(profile?.name ?? email)}
              </span>
              <span className="hidden max-w-[160px] truncate text-xs text-slate-300 sm:block">{email}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
