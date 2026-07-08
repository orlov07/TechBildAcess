import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Ticket, Clock, User, LogIn, LogOut, LayoutDashboard, ScanLine } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Logo } from '@/components/Brand'
import { initials } from '@/lib/utils'
import { cn } from '@/lib/utils'

const clientNav = [
  { to: '/app', label: 'Eventos', icon: Home, end: true },
  { to: '/app/meus-ingressos', label: 'Ingressos', icon: Ticket },
  { to: '/app/historico', label: 'Histórico', icon: Clock },
  { to: '/app/perfil', label: 'Perfil', icon: User },
]

export function PublicLayout() {
  const { session, email, isAdmin, isFiscal, profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link to={session ? '/app' : '/'}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/eventos" className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
              Eventos
            </NavLink>
            {session && (
              <NavLink to="/app/meus-ingressos" className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
                Meus ingressos
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className="nav-link">
                <LayoutDashboard className="h-4 w-4" /> Admin
              </NavLink>
            )}
            {(isFiscal || isAdmin) && (
              <NavLink to="/fiscal" className="nav-link">
                <ScanLine className="h-4 w-4" /> Fiscal
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <div className="flex items-center gap-2">
                <Link to="/app/perfil" className="flex items-center gap-2 rounded-full border border-border bg-bg-soft py-1 pl-1 pr-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-200">
                    {initials(profile?.name ?? email)}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs text-slate-300 sm:block">
                    {profile?.name ?? email}
                  </span>
                </Link>
                <button
                  onClick={async () => {
                    await signOut()
                    navigate('/')
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-bg-elevated hover:text-slate-100"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                <LogIn className="h-4 w-4" /> Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:pb-12">
        <Outlet />
      </main>

      {/* Bottom nav mobile (cliente logado) */}
      {session && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-bg/90 backdrop-blur-xl md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4">
            {clientNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-slate-500 transition',
                    isActive && 'text-brand-300',
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
