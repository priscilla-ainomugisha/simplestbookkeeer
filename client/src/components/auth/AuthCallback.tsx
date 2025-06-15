import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (loading || isProcessing) return;

      try {
        setIsProcessing(true);
        const code = searchParams.get('code');
        console.log('Auth callback received with code:', code ? 'present' : 'missing');

        if (!code) {
          console.error('No code parameter found in URL');
          setError('Authentication failed: No code parameter found');
          return;
        }

        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        if (sessionError) {
          console.error('Error exchanging code for session:', sessionError);
          setError('Authentication failed: ' + sessionError.message);
          return;
        }

        console.log('Successfully exchanged code for session');
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError('Authentication failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuth();
  }, [searchParams, loading, isProcessing]);

  // Handle navigation after auth state is ready
  useEffect(() => {
    if (!loading && user) {
      console.log('Auth state ready, user:', user.id);
      console.log('Onboarding status:', user.has_completed_onboarding ? 'complete' : 'incomplete');
      
      if (user.has_completed_onboarding) {
        console.log('Navigating to home');
        navigate('/home', { replace: true });
      } else {
        console.log('Navigating to onboarding');
        navigate('/onboarding', { replace: true });
      }
    }
  }, [loading, user, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600">Authentication Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Processing Authentication</h2>
          <p className="mt-2 text-gray-600">Please wait while we complete your sign in...</p>
        </div>
      </div>
    </div>
  );
} 