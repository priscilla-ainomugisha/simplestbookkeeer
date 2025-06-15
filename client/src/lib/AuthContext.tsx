import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from './supabase'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { AppUser } from './supabase'

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

const isDev = import.meta.env.DEV;

// Helper function for development-only logging
const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isInitialized = useRef(false)
  const hasHandledInitialSession = useRef(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) {
      devLog('AuthProvider: Already initialized, skipping...');
      return;
    }
    isInitialized.current = true;

    devLog('AuthProvider: Initializing auth state');
    setLoading(true);

    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        devLog('AuthProvider: Fetching initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        devLog('AuthProvider: Initial session response:', { 
          hasSession: !!session,
          hasUser: !!session?.user,
          error: sessionError 
        });
        
        if (sessionError) {
          console.error('AuthProvider: Error getting session:', sessionError);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (!session?.user) {
          devLog('AuthProvider: No session or user found');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        await fetchAndSetUser(session.user);
      } catch (error) {
        console.error('AuthProvider: Error in initialization:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Helper function to fetch and set user data
    const fetchAndSetUser = async (supabaseUser: SupabaseUser) => {
      if (!mounted) return;

      try {
        devLog('AuthProvider: Fetching user data for:', supabaseUser.id);
        
        // Add timeout to the fetch operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('User data fetch timeout')), 5000); // 5 second timeout
        });

        const fetchPromise = supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        const result = await Promise.race([fetchPromise, timeoutPromise])
          .catch(error => {
            console.error('AuthProvider: Fetch operation failed:', error);
            return { data: null, error };
          }) as { data: any, error: any };

        const { data: userData, error } = result;

        if (error) {
          console.error('AuthProvider: Error fetching user data:', error);
          if (mounted) {
            // If we can't get user data, still set the basic user info
            setUser(supabaseUser);
            setLoading(false);
          }
        } else {
          devLog('AuthProvider: User data fetched successfully:', userData);
          if (mounted) {
            // Ensure we have a valid userData object
            const hasCompletedOnboarding = userData?.has_completed_onboarding ?? false;
            const mergedUser = { 
              ...supabaseUser, 
              has_completed_onboarding: hasCompletedOnboarding
            };
            devLog('AuthProvider: Setting merged user:', mergedUser);
            setUser(mergedUser);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error in fetchAndSetUser:', error);
        if (mounted) {
          // On any error, still set the basic user info
          setUser(supabaseUser);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      devLog('AuthProvider: Auth state changed', { 
        event, 
        hasSession: !!session,
        hasUser: !!session?.user,
        hasHandledInitialSession: hasHandledInitialSession.current
      });
      
      if (!mounted) return;

      // Skip INITIAL_SESSION if we've already handled it
      if (event === 'INITIAL_SESSION' && hasHandledInitialSession.current) {
        devLog('AuthProvider: Skipping INITIAL_SESSION as it was already handled');
        return;
      }

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          devLog('AuthProvider: User signed in, fetching user data...');
          await fetchAndSetUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          devLog('AuthProvider: User signed out');
          setUser(null);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          devLog('AuthProvider: Handling INITIAL_SESSION');
          hasHandledInitialSession.current = true;
          await fetchAndSetUser(session.user);
        } else {
          devLog('AuthProvider: Other auth event:', event);
          setUser(session?.user || null);
          setLoading(false);
        }
      } catch (err) {
        console.error('AuthProvider: Error in user data fetch on auth change:', err);
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    return () => {
      devLog('AuthProvider: Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
      isInitialized.current = false;
      hasHandledInitialSession.current = false;
    };
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    devLog('AuthProvider: State updated', { 
      user: user ? {
        id: user.id,
        email: user.email,
        has_completed_onboarding: user.has_completed_onboarding
      } : null, 
      loading,
      pathname: window.location.pathname
    });
  }, [user, loading]);

  const signInWithGoogle = async () => {
    try {
      devLog('Starting Google sign in process...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        throw error;
      }

      // If we have a URL, we need to redirect
      if (data?.url) {
        devLog('Redirecting to OAuth provider...');
        window.location.href = data.url;
        return;
      }

      devLog('OAuth response:', data);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
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