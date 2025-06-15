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

  devLog('Onboarding component rendered', { user, isWizardOpen });

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        devLog('No user found, redirecting to sign in');
        navigate('/signin', { replace: true });
        return;
      }

      devLog('Checking onboarding status for user:', user.id);
      const { data, error } = await supabase
        .from('users')
        .select('has_completed_onboarding')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return;
      }

      devLog('Onboarding status:', data);
      if (data?.has_completed_onboarding) {
        devLog('User has completed onboarding, redirecting to home');
        navigate('/home', { replace: true });
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const handleWizardClose = () => {
    devLog('Wizard close handler called');
    setIsWizardOpen(false);
    navigate('/home', { replace: true });
  };

  devLog('Rendering Onboarding page with SetupWizard', { isWizardOpen });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#007556] px-4">
      <SetupWizard isOpen={isWizardOpen} onClose={handleWizardClose} />
    </div>
  );
} 