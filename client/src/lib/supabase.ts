import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqeuejgvswfrkevpkfaa.supabase.co' // Your project URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client with custom fetch options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'sb-auth-token',
    storage: {
      getItem: (key) => {
        try {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      },
    },
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-Client-Info': 'supabase-js/2.0.0',
          'apikey': supabaseAnonKey
        },
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Verify connection on initialization
const verifyConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('cashbook')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Failed to connect to Supabase:', error);
      return false;
    }

    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
}

verifyConnection().catch(console.error);

export type AppUser = {
  id: string
  email?: string
  phone?: string
  has_completed_onboarding: boolean
} 