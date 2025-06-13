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
      console.log('Verifying Supabase connection...');
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
          console.log('Supabase connection successful:', data);
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
        console.log('No user found, skipping onboarding check');
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

      console.log('Onboarding status:', data);
      if (data?.has_completed_onboarding) {
        console.log('User has completed onboarding, closing wizard');
        onClose();
      }
    };

    checkOnboardingStatus();
  }, [user, onClose]);

  // Mutation to save initial balance sheet
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user');
      }

      try {
        console.log('Starting save mutation with data:', data);
        console.log('Current user:', user);
        
        // Create cashbook entry with proper type checking
        const cashbookEntry = {
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          opening_balance: {
            cash: Number(data.cash) || 0,
            liabilities: Number(data.liabilities) || 0,
            capital: Number(data.capital) || 0,
            inventory: Number(data.inventory) || 0
          },
          closing_balance: {
            cash: Number(data.cash) || 0,
            liabilities: Number(data.liabilities) || 0,
            capital: Number(data.capital) || 0,
            inventory: Number(data.inventory) || 0,
            retainedEarnings: (Number(data.cash) || 0) - (Number(data.liabilities) || 0),
            equity: (Number(data.capital) || 0) + ((Number(data.cash) || 0) - (Number(data.liabilities) || 0))
          },
          transactions: []
        };

        console.log('Prepared cashbook entry:', cashbookEntry);

        // First, check if the user already has a cashbook entry
        console.log('Checking for existing cashbook entry...');
        const { data: existingEntry, error: checkError } = await supabase
          .from('cashbook')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing entry:', checkError);
          throw new Error(`Failed to check existing entry: ${checkError.message}`);
        }

        console.log('Existing entry check result:', existingEntry);

        let result;
        if (existingEntry) {
          console.log('Found existing entry, updating...');
          const { data: updatedData, error: updateError } = await supabase
            .from('cashbook')
            .update({
              opening_balance: cashbookEntry.opening_balance,
              closing_balance: cashbookEntry.closing_balance,
              transactions: cashbookEntry.transactions,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (updateError) {
            console.error('Update error:', updateError);
            throw new Error(`Failed to update cashbook: ${updateError.message}`);
          }

          console.log('Successfully updated cashbook:', updatedData);
          result = updatedData;
        } else {
          console.log('No existing entry, creating new...');
          const { data: newData, error: insertError } = await supabase
            .from('cashbook')
            .insert([{
              user_id: cashbookEntry.user_id,
              date: cashbookEntry.date,
              opening_balance: cashbookEntry.opening_balance,
              closing_balance: cashbookEntry.closing_balance,
              transactions: cashbookEntry.transactions
            }])
            .select()
            .single();

          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Failed to insert into cashbook: ${insertError.message}`);
          }

          console.log('Successfully created cashbook entry:', newData);
          result = newData;
        }

        // Update onboarding status
        console.log('Updating user onboarding status...');
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ 
            has_completed_onboarding: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (userUpdateError) {
          console.error('User update error:', userUpdateError);
          throw new Error(`Failed to update user status: ${userUpdateError.message}`);
        }

        console.log('Successfully updated user status');
        return result;
      } catch (error) {
        console.error('Failed to save initial balance:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Save mutation succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ['cashbook', user?.id] });
      toast({
        title: "Setup complete",
        description: "Your business is now ready to track transactions!",
        variant: "default"
      });
      onClose();
    },
    onError: (error) => {
      console.error('Save mutation failed:', error);
      toast({
        title: "Setup failed",
        description: error instanceof Error ? error.message : "Failed to save initial balance. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log(`Updating ${field} to:`, e.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleNext = () => {
    console.log('Moving to next step. Current step:', step);
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      console.log('Final step reached, saving data:', formData);
      saveMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    console.log('Moving to previous step. Current step:', step);
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