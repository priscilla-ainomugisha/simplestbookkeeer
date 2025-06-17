import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;
const REQUEST_TIMEOUT = 15000; // Increased to 15 seconds
const CONNECTION_CHECK_TIMEOUT = 5000; // 5 seconds for connection check

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Handle pre-filled email from sign-in page
  useEffect(() => {
    const state = location.state as { email?: string };
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const createUserRecord = async (userId: string, userEmail: string) => {
    try {
      devLog('Creating user record:', { userId, userEmail });
      const { data, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: userEmail,
            has_completed_onboarding: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (userError) {
        console.error('User creation error:', userError);
        devLog('User creation error details:', {
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint
        });
        throw userError;
      }

      devLog('User record created successfully:', data);
    } catch (error) {
      console.error('Error creating user record:', error);
      devLog('User creation error:', error);
      throw error;
    }
  };

  // Add connection check
  const checkConnection = async (): Promise<boolean> => {
    try {
      const { error } = await Promise.race([
        supabase.from('users').select('count').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection check timeout')), CONNECTION_CHECK_TIMEOUT)
        )
      ]);
      return !error;
    } catch (err) {
      console.error('Connection check failed:', err);
      return false;
    }
  };

  const attemptSignUp = async (e: React.FormEvent, retryDelay: number = INITIAL_RETRY_DELAY) => {
    try {
      // First check connection
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }

      // Set a timeout for the entire operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT);
      });

      // 1. Sign up with Supabase Auth
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      const { data: authData, error: authError } = await Promise.race([signUpPromise, timeoutPromise]);

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      // 2. Create user record in the users table
      await createUserRecord(authData.user.id, authData.user.email!);

      // 3. Check if email confirmation is required
      if (authData.session) {
        // User is already confirmed, navigate to onboarding
        navigate('/onboarding');
      } else {
        // Show confirmation message
        setError('Please check your email for a confirmation link.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('rate limit')) {
          setError('Too many signup attempts. Please try again in a few minutes.');
          setLoading(false);
        } else if (err.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
          setLoading(false);
        } else if (
          err.message.includes('timeout') || 
          err.message.includes('retryable') || 
          err.message.includes('network') || 
          err.message.includes('API key') ||
          err.message.includes('connection')
        ) {
          if (retryCount < MAX_RETRIES) {
            const nextRetryCount = retryCount + 1;
            setRetryCount(nextRetryCount);
            setError(`Connection issue. Retrying (${nextRetryCount}/${MAX_RETRIES})...`);
            
            // Exponential backoff with jitter
            const jitter = Math.random() * 1000;
            const nextDelay = retryDelay * 2 + jitter;
            await sleep(retryDelay);
            return attemptSignUp(e, nextDelay);
          } else {
            setError('Unable to connect to the server. Please check your internet connection and try again.');
            setLoading(false);
          }
        } else {
          setError(err.message);
          setLoading(false);
        }
      } else {
        setError('Failed to create account. Please try again.');
        setLoading(false);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setRetryCount(0);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Add a small initial delay before first attempt
    await sleep(500);
    await attemptSignUp(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#007556] px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join The Simplest Bookkeeper
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Create a password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007556] hover:bg-[#005a42] text-white disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/signin" className="text-[#007556] hover:text-[#005a42] font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 