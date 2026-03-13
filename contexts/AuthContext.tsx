'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, ROLE_PERMISSIONS } from '@/lib/supabase'
import type { Profile, Tenant, Permissions } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  tenant: Tenant | null
  loading: boolean
  signUp: (args: { email: string; password: string; fullName: string; companyName: string }) => Promise<ReturnType<typeof supabase.auth.signUp>>
  signUpWithInvite: (args: { email: string; password: string; fullName: string; inviteToken: string }) => Promise<ReturnType<typeof supabase.auth.signUp>>
  signIn: (args: { email: string; password: string }) => Promise<ReturnType<typeof supabase.auth.signInWithPassword>>
  signOut: () => Promise<void>
  can: (permission: keyof Permissions) => boolean
  permissions: Permissions | null
  isOwner: boolean
  isManager: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (authUser: User) => {
    setUser(authUser)
    const { data: prof } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('id', authUser.id)
      .single()

    if (prof) {
      setProfile(prof as Profile)
      setTenant((prof as Profile).tenants ?? null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setTenant(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  async function signUp({ email, password, fullName, companyName }: {
    email: string; password: string; fullName: string; companyName: string
  }) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company_name: companyName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  async function signUpWithInvite({ email, password, fullName, inviteToken }: {
    email: string; password: string; fullName: string; inviteToken: string
  }) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, invite_token: inviteToken },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  async function signIn({ email, password }: { email: string; password: string }) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const permissions = profile ? ROLE_PERMISSIONS[profile.role] : null
  const can = (permission: keyof Permissions) => permissions?.[permission] ?? false

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      tenant,
      loading,
      signUp,
      signUpWithInvite,
      signIn,
      signOut,
      can,
      permissions,
      isOwner: profile?.role === 'owner',
      isManager: profile?.role === 'manager',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
