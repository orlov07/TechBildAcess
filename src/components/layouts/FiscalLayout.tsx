import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ScanLine, History, LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Logo } from '@/components/Brand'
import { cn } from '@/lib/utils'

export function FiscalLayout() {
  const { signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <Link to="/fiscal"><Logo /></Link>
          <span className="chip bg-accent/15 text-accent">Modo Fiscal</span>
          <button
            onClick={async () => { await signOut(); navigate('/') }}
            className="rounded-xl p-2 text-slate-400 hover:bg-bg-elevated hover:text-slate-100"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto flex w-full max-w-3xl gap-1 px-3 pb-2">
          <NavLink to="/fiscal/checkin" className={({ isActive }) => cn('nav-link flex-1 justify-center', isActive && 'nav-link-active')}>
            <ScanLine className="h-4 w-4" /> Check-in
          </NavLink>
          <NavLink to="/fiscal/historico" className={({ isActive }) => cn('nav-link flex-1 justify-center', isActive && 'nav-link-active')}>
            <History className="h-4 w-4" /> Histórico
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className="nav-link flex-1 justify-center">
              <ArrowLeft className="h-4 w-4" /> Admin
            </NavLink>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
