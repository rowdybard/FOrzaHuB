import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { getProfile } from '../data/api'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: false,
  enabled: false,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseEnabled)

  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null)
      return
    }
    try {
      setProfile(await getProfile(uid))
    } catch (err) {
      console.error('[auth] failed to load profile', err)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseEnabled) return

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      loadProfile(u?.id).finally(() => setLoading(false))
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      loadProfile(u?.id)
    })

    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async () => {
    if (!isSupabaseEnabled) return
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin + window.location.pathname },
    })
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseEnabled) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(() => loadProfile(user?.id), [loadProfile, user])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        enabled: isSupabaseEnabled,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
