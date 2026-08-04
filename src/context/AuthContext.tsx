import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Role, Staff } from '@/lib/types'
import { isAdminEmail } from '@/lib/utils'

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
  email: string | null
  role: Role
  isAdmin: boolean
  isFiscal: boolean
  staffEvents: Staff[]
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthCtx = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [staffEvents, setStaffEvents] = useState<Staff[]>([])

  const email = session?.user?.email?.toLowerCase() ?? null
  const isAdmin = isAdminEmail(email)

  async function loadProfile(currentSession: Session | null) {
    if (!currentSession?.user) {
      setProfile(null)
      setStaffEvents([])
      return
    }
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', currentSession.user.id)
      .maybeSingle()
    setProfile((prof as Profile) ?? null)

    const userEmail = currentSession.user.email?.toLowerCase()
    if (userEmail) {
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .ilike('email', userEmail)
      setStaffEvents((staff as Staff[]) ?? [])
    }
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return
      setSession(data.session)
      await loadProfile(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event: string, newSession: Session | null) => {
      setSession(newSession)
      await loadProfile(newSession)
      setLoading(false)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const isFiscal = staffEvents.length > 0
  const role: Role = isAdmin ? 'admin' : isFiscal ? 'fiscal' : 'client'

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setStaffEvents([])
  }

  async function refreshProfile() {
    await loadProfile(session)
  }

  return (
    <AuthCtx.Provider
      value={{
        loading,
        session,
        profile,
        email,
        role,
        isAdmin,
        isFiscal,
        staffEvents,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
