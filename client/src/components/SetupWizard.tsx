import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

const isDev = import.meta.env.DEV;

// Helper function for development-only logging
const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CashbookEntry {
  userId: string;
  date: string;
  opening_balance: {
    cash: number;
    liabilities: number;
    capital: number;
    inventory: number;
  };
  closing_balance: {
    cash: number;
    liabilities: number;
    capital: number;
    inventory: number;
    retainedEarnings: number;
    equity: number;
  };
  transactions: any[];
}

export default function SetupWizard({ isOpen, onClose }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cash: '',
    liabilities: '',
    capital: '',
    inventory: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Verify Supabase connection
  useEffect(() => {
    const verifyConnection = async () => {
      devLog('Verifying Supabase connection...');
      try {
        const { data, error } = await supabase.from('cashbook').select('count').limit(1);
        if (error) {
          console.error('Supabase connection error:', error);
          toast({
            title: "Connection Error",
            description: "Unable to connect to the database. Please try again later.",
            variant: "destructive"
          });
        } else {
          devLog('Supabase connection successful:', data);
        }
      } catch (err) {
        console.error('Failed to verify Supabase connection:', err);
      }
    };

    verifyConnection();
  }, [toast]);

  // Check if setup is already complete
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        devLog('No user found, skipping onboarding check');
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
        devLog('User has completed onboarding, closing wizard');
        onClose();
      }
    };

    checkOnboardingStatus();
  }, [user, onClose]);

  // Mutation to save initial balance sheet
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      devLog('Starting save mutation with data:', data);
      devLog('Current user:', user);

      if (!user) {
        throw new Error('No user found');
      }

      // Prepare cashbook entry
      const cashbookEntry = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        opening_balance: {
          cash: parseFloat(data.cash),
          liabilities: parseFloat(data.liabilities),
          capital: parseFloat(data.capital),
          inventory: parseFloat(data.inventory)
        },
        closing_balance: {
          cash: parseFloat(data.cash),
          liabilities: parseFloat(data.liabilities),
          capital: parseFloat(data.capital),
          inventory: parseFloat(data.inventory)
        },
        transactions: []
      };

      devLog('Prepared cashbook entry:', cashbookEntry);

      // Send request to server endpoint
      const response = await fetch('/api/cashbook/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cashbookEntry)
      });

      if (!response.ok) {
        const errorText = await response.text();
        devLog('Error response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || 'Failed to update cashbook');
        } catch (e) {
          throw new Error(`Failed to update cashbook: ${errorText}`);
        }
      }

      const result = await response.json();

      // Update onboarding status
      devLog('Updating user onboarding status...');
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ 
          has_completed_onboarding: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('Error updating user status:', userUpdateError);
        throw new Error(`Failed to update user status: ${userUpdateError.message}`);
      }

      devLog('Successfully updated user onboarding status');
      return result.data;
    },
    onSuccess: () => {
      devLog('Setup completed successfully');
      toast({
        title: "Setup Complete",
        description: "Your initial balance sheet has been saved.",
      });
      // Close the wizard and navigate to home
      onClose();
      // Force a page reload to ensure all data is fresh
      window.location.href = '/home';
    },
    onError: (error) => {
      console.error('Setup failed:', error);
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    devLog(`Updating ${field} to:`, e.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleNext = () => {
    devLog('Moving to next step. Current step:', step);
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      devLog('Final step reached, saving data:', formData);
      saveMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    devLog('Moving to previous step. Current step:', step);
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "How much cash do you have now?";
      case 2: return "Any loans or debts?";
      case 3: return "How much capital did you invest?";
      case 4: return "Do you have any inventory or equipment?";
      default: return "Setup Your Business";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter the amount of cash you currently have in your business."}
            {step === 2 && "Enter the total amount of any loans or debts your business has."}
            {step === 3 && "Enter the amount of capital you initially invested in your business."}
            {step === 4 && "Enter the total value of your inventory and equipment."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cash">Cash Amount</Label>
                <Input
                  id="cash"
                  type="number"
                  value={formData.cash}
                  onChange={handleInputChange('cash')}
                  placeholder="Enter amount"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="liabilities">Total Liabilities</Label>
                <Input
                  id="liabilities"
                  type="number"
                  value={formData.liabilities}
                  onChange={handleInputChange('liabilities')}
                  placeholder="Enter amount"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capital">Initial Capital</Label>
                <Input
                  id="capital"
                  type="number"
                  value={formData.capital}
                  onChange={handleInputChange('capital')}
                  placeholder="Enter amount"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory/Equipment Value</Label>
                <Input
                  id="inventory"
                  type="number"
                  value={formData.inventory}
                  onChange={handleInputChange('inventory')}
                  placeholder="Enter amount"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          {step > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={saveMutation.isPending}
            className="ml-auto"
          >
            {saveMutation.isPending ? 'Saving...' : step === 4 ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 