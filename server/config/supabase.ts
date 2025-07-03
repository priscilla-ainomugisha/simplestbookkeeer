import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY

// Validate Supabase URL format
if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
  console.error('Invalid Supabase URL format. Expected format: https://[PROJECT-ID].supabase.co');
  throw new Error('Invalid Supabase URL format');
}

// Validate service key format (should be a JWT)
if (supabaseServiceKey && !supabaseServiceKey.match(/^ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/)) {
  console.error('Invalid Supabase service key format. Expected a JWT token.');
  throw new Error('Invalid Supabase service key format');
}

// Log configuration details (without exposing sensitive data)
console.log('Supabase configuration:', {
  url: supabaseUrl ? 'set' : 'missing',
  serviceKey: supabaseServiceKey ? 'set' : 'missing',
  envPath: path.resolve(process.cwd(), '.env')
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'set' : 'missing',
    VITE_SUPABASE_SERVICE_KEY: supabaseServiceKey ? 'set' : 'missing'
  });
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Test the connection and log the result
void (async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Failed to connect to Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Successfully connected to Supabase');
    }
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
  }
})(); 