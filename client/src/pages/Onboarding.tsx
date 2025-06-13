import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import SetupWizard from '@/components/SetupWizard';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(true);

  console.log('Onboarding component rendered', { user, isWizardOpen });

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        console.log('No user found in Onboarding, redirecting to signin');
        navigate('/signin');
        return;
      }
      
      console.log('Checking onboarding status for user:', user.id);
      const { data, error } = await supabase
        .from('users')
        .select('has_completed_onboarding')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return;
      }

      console.log('Onboarding status check result:', data);
      if (data?.has_completed_onboarding) {
        console.log('User has completed onboarding, redirecting to home');
        navigate('/home');
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const handleWizardClose = () => {
    console.log('Wizard close handler called');
    setIsWizardOpen(false);
    navigate('/home');
  };

  console.log('Rendering Onboarding page with SetupWizard', { isWizardOpen });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#007556] px-4">
      <SetupWizard isOpen={isWizardOpen} onClose={handleWizardClose} />
    </div>
  );
} 