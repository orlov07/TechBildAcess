import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin } = useAuth()
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/app" replace />
  return <>{children}</>
}

export function RequireFiscal({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin, isFiscal } = useAuth()
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin && !isFiscal) return <Navigate to="/app" replace />
  return <>{children}</>
}
