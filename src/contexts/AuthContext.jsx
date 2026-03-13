import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, ROLE_PERMISSIONS } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user)
      else {
        setUser(null); setProfile(null); setTenant(null); setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(authUser) {
    setUser(authUser)
    const { data: prof } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('id', authUser.id)
      .single()

    if (prof) {
      setProfile(prof)
      setTenant(prof.tenants)
    }
    setLoading(false)
  }

  async function signUp({ email, password, fullName, companyName }) {
    return supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, company_name: companyName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  async function signUpWithInvite({ email, password, fullName, inviteToken }) {
    return supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, invite_token: inviteToken },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  async function signIn({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const permissions = profile ? ROLE_PERMISSIONS[profile.role] : null

  const can = (permission) => permissions?.[permission] ?? false

  return (
    <AuthContext.Provider value={{
      user, profile, tenant, loading,
      signUp, signUpWithInvite, signIn, signOut,
      can, permissions,
      isOwner: profile?.role === 'owner',
      isManager: profile?.role === 'manager',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
