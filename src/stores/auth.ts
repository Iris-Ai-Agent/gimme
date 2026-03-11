import { create } from 'zustand'
import { supabase, db } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isDemo: boolean
  initialize: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signInAsDemo: () => void
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

let authSubscription: { unsubscribe: () => void } | null = null
let initialized = false

const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000'

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (data) return data

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return null
  const meta = user.user_metadata || {}
  const { data: created } = await db
    .from('profiles')
    .upsert({
      id: userId,
      display_name: meta.full_name || meta.name || user.email || 'Golfer',
      avatar_url: meta.avatar_url || meta.picture || null,
    })
    .select()
    .single()
  return created
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isDemo: false,

  initialize: async () => {
    if (initialized) return
    initialized = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
      window.history.replaceState({}, '', window.location.pathname)
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user, session, loading: false })
      loadProfile(session.user.id).then((profile) => {
        if (profile) set({ profile })
      })
    } else {
      set({ loading: false })
    }

    if (authSubscription) {
      authSubscription.unsubscribe()
      authSubscription = null
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (session?.user) {
        const profile = await loadProfile(session.user.id)
        set({ user: session.user, session, profile, loading: false })
      } else {
        set({ user: null, session: null, profile: null, loading: false })
      }
    })
    authSubscription = subscription
  },

  signInWithEmail: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error ? new Error(error.message) : null }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return { error: error ? new Error(error.message) : null }
  },

  signInAsDemo: () => {
    const fakeUser = {
      id: DEMO_USER_ID,
      email: 'demo@bogeybookie.app',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: { display_name: 'Demo Player' },
    } as User
    const fakeProfile: Profile = {
      id: DEMO_USER_ID,
      display_name: 'Demo Player',
      avatar_url: null,
      handicap_index: null,
      venmo_handle: null,
      cashapp_handle: null,
      created_at: new Date().toISOString(),
    }
    set({ user: fakeUser, session: null, profile: fakeProfile, loading: false, isDemo: true })
  },

  signOut: async () => {
    if (!get().isDemo) await supabase.auth.signOut()
    initialized = false
    set({ user: null, session: null, profile: null, isDemo: false })
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get()
    if (!user) return
    const { data } = await db
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (data) set({ profile: data })
  },
}))
