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
  const [hasSaved, setHasSaved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  // Reset state when wizard opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        cash: '',
        liabilities: '',
        capital: '',
        inventory: ''
      });
      setHasSaved(false);
    }
  }, [isOpen]);

  // Clean up when wizard closes
  useEffect(() => {
    if (!isOpen) {
      setHasSaved(false);
    }
  }, [isOpen]);

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
      if (hasSaved) {
        devLog('Already saved, skipping save mutation');
        return;
      }

      devLog('Starting save mutation with data:', data);
      devLog('Current user:', user);

      if (!user) {
        throw new Error('No user found');
      }

      setHasSaved(true);

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
      devLog('Cashbook update result:', result);

      // The server will handle updating the user's onboarding status
      devLog('Successfully completed onboarding');
      return result;
    },
    onSuccess: async () => {
      devLog('Setup completed successfully');
      toast({
        title: "Setup Complete",
        description: "Your initial balance sheet has been saved.",
      });
      
      // Update the user's onboarding status in the auth context
      if (user) {
        setUser({
          ...user,
          has_completed_onboarding: true
        });
      }
      
      // Close the wizard
      onClose();
    },
    onError: (error) => {
      devLog('Save mutation failed:', error);
      setHasSaved(false); // Reset the flag on error
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save initial balance",
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
      if (!hasSaved) {
        devLog('Final step reached, saving data:', formData);
        saveMutation.mutate(formData);
      } else {
        devLog('Already saved, skipping save');
        onClose();
      }
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