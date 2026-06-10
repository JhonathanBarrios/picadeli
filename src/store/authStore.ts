import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../api/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'vendedor'
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null

  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
  isAdmin: () => boolean
  isVendedor: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      loading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error

          // Fetch user profile
          if (data.user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (profileError) throw profileError
            set({ user: data.user, session: data.session, profile, loading: false })
          }
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
            },
          })
          if (error) throw error
          set({ user: data.user, session: data.session, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      signOut: async () => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          set({ user: null, session: null, profile: null, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      updatePassword: async (newPassword: string) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          })
          if (error) throw error
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      initialize: async () => {
        set({ loading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            set({ user: session.user, session })

            // Fetch profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (!profileError) {
              set({ profile })
            }
          }

          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
              set({ user: session.user, session })

              // Fetch profile on auth state change
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

              set({ profile })
            } else {
              set({ user: null, session: null, profile: null })
            }
          })
        } catch (error: any) {
          set({ error: error.message })
        } finally {
          set({ loading: false })
        }
      },

      isAdmin: () => {
        const { profile } = get()
        return profile?.role === 'admin'
      },

      isVendedor: () => {
        const { profile } = get()
        return profile?.role === 'vendedor'
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'picadeli-auth',
      partialize: (state) => ({ user: state.user, session: state.session, profile: state.profile }),
    }
  )
)
