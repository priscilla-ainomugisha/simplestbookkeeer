import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'

// Extend the Supabase User type with our custom fields
interface User extends SupabaseUser {
  has_completed_onboarding?: boolean;
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthProvider: Got session', { session });
      
      if (session?.user) {
        try {
          // Fetch user data from our users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('AuthProvider: Error fetching user data:', error);
            setUser(session.user);
          } else {
            console.log('AuthProvider: Got user data:', userData);
            // Merge Supabase user with our custom user data
            setUser({ ...session.user, ...userData });
          }
        } catch (err) {
          console.error('AuthProvider: Error in user data fetch:', err);
          setUser(session.user);
        }
      } else {
        console.log('AuthProvider: No session found');
        setUser(null);
      }
      setLoading(false);
    }).catch(err => {
      console.error('AuthProvider: Error getting session:', err);
      setUser(null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('AuthProvider: Auth state changed', { event: _event, session });
      
      if (session?.user) {
        try {
          // Fetch user data from our users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('AuthProvider: Error fetching user data on auth change:', error);
            setUser(session.user);
          } else {
            console.log('AuthProvider: Got user data on auth change:', userData);
            // Merge Supabase user with our custom user data
            setUser({ ...session.user, ...userData });
          }
        } catch (err) {
          console.error('AuthProvider: Error in user data fetch on auth change:', err);
          setUser(session.user);
        }
      } else {
        console.log('AuthProvider: No session on auth change');
        setUser(null);
      }
      setLoading(false);

      // If we have a session, ensure the user record exists
      if (session?.user) {
        try {
          // Try to get the user record
          const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          // If no user record exists, create one
          if (fetchError?.code === 'PGRST116') {
            console.log('AuthProvider: Creating new user record');
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  has_completed_onboarding: false
                }
              ])

            if (insertError) {
              console.error('AuthProvider: Error creating user record:', insertError)
            }
          } else if (fetchError) {
            console.error('AuthProvider: Error fetching user data:', fetchError)
          }
        } catch (error) {
          console.error('AuthProvider: Error in user record management:', error)
        }
      }
    })

    return () => {
      console.log('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with email:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signOut
  }

  console.log('AuthProvider: Rendering with state', { user, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 