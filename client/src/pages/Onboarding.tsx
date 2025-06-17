import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import SetupWizard from '@/components/SetupWizard';
import { supabase } from '@/lib/supabase';

const isDev = import.meta.env.DEV;

// Helper function for development-only logging
const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(true);
  const [isPolling, setIsPolling] = useState(true);
  const [hasStartedPolling, setHasStartedPolling] = useState(false);

  devLog('Onboarding component rendered', { user, isWizardOpen, isPolling, hasStartedPolling });

  // Poll for onboarding status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollOnboardingStatus = async () => {
      if (!user || !isPolling) {
        devLog('Skipping poll - no user or polling disabled', { hasUser: !!user, isPolling });
        return;
      }

      try {
        devLog('Polling onboarding status for user:', user.id);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error polling onboarding status:', error);
          devLog('Poll error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          return;
        }

        devLog('Poll result:', data);
        if (data?.has_completed_onboarding) {
          devLog('Onboarding confirmed complete, redirecting to home');
          setIsPolling(false);
          clearInterval(pollInterval);
          navigate('/home?tab=chat', { replace: true });
        } else {
          devLog('Onboarding not complete yet:', {
            hasData: !!data,
            hasCompletedOnboarding: data?.has_completed_onboarding,
            userId: user.id
          });
        }
      } catch (err) {
        console.error('Error in polling:', err);
        devLog('Poll error:', err);
      }
    };

    if (isPolling && !hasStartedPolling) {
      devLog('Starting polling interval');
      setHasStartedPolling(true);
      // Poll every 500ms
      pollInterval = setInterval(pollOnboardingStatus, 500);
      // Initial check
      pollOnboardingStatus();
    }

    return () => {
      if (pollInterval) {
        devLog('Cleaning up polling interval');
        clearInterval(pollInterval);
      }
    };
  }, [user, isPolling, hasStartedPolling, navigate]);

  // Check initial onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        devLog('No user found, redirecting to sign in');
        navigate('/signin', { replace: true });
        return;
      }

      devLog('Checking onboarding status for user:', user.id);
      
      // First, verify the user record exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error checking user record:', userError);
        devLog('User record check error:', {
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint
        });
        return;
      }

      devLog('User record found:', userData);

      if (userData?.has_completed_onboarding) {
        devLog('User has completed onboarding, redirecting to home');
        navigate('/home?tab=chat', { replace: true });
      } else {
        devLog('User has not completed onboarding:', {
          hasData: !!userData,
          hasCompletedOnboarding: userData?.has_completed_onboarding,
          userId: user.id
        });
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const handleWizardClose = () => {
    devLog('Wizard close handler called');
    setIsWizardOpen(false);
  };

  devLog('Rendering Onboarding page with SetupWizard', { isWizardOpen, isPolling, hasStartedPolling });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#007556] px-4">
      {isWizardOpen && <SetupWizard isOpen={isWizardOpen} onClose={handleWizardClose} />}
    </div>
  );
} 