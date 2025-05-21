import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DEMO_USER } from "@/App";

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Snapshot {
  date: string;
  opening: {
    cash: number;
    liabilities: number;
    capital: number;
    inventory: number;
  };
  transactions: any[];
  closing: {
    cash: number;
    liabilities: number;
    capital: number;
    inventory: number;
    retainedEarnings: number;
    equity: number;
  };
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

  // Check if setup is already complete
  useEffect(() => {
    const setupComplete = localStorage.getItem("setupComplete");
    if (setupComplete === "true") {
      onClose();
    }
  }, [onClose]);

  // Mutation to save initial balance sheet
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      try {
        // Convert string values to numbers
        const numericData = {
          userId: DEMO_USER.id,
          cash: Number(data.cash) || 0,
          inventory: Number(data.inventory) || 0,
          accountsReceivable: 0, // Default to 0 if not provided
          accountsPayable: Number(data.liabilities) || 0,
          loans: 0, // Default to 0 if not provided
          initialCapital: Number(data.capital) || 0
        };

        const response = await apiRequest("POST", "/api/transactions/initial-balance", numericData);
        // Only parse as JSON if you expect a JSON response
        if (response.headers.get("content-type")?.includes("application/json")) {
          return response.json();
        }
        return null;
      } catch (error) {
        console.error('Failed to save initial balance:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Create and store snapshot
      const snapshot: Snapshot = {
        date: new Date().toISOString().split('T')[0],
        opening: {
          cash: Number(formData.cash) || 0,
          liabilities: Number(formData.liabilities) || 0,
          capital: Number(formData.capital) || 0,
          inventory: Number(formData.inventory) || 0
        },
        transactions: [],
        closing: {
          cash: Number(formData.cash) || 0,
          liabilities: Number(formData.liabilities) || 0,
          capital: Number(formData.capital) || 0,
          inventory: Number(formData.inventory) || 0,
          retainedEarnings: (Number(formData.cash) || 0) - (Number(formData.liabilities) || 0),
          equity: (Number(formData.capital) || 0) + ((Number(formData.cash) || 0) - (Number(formData.liabilities) || 0))
        }
      };

      try {
        // Store snapshot and setup status
        localStorage.setItem("snapshots", JSON.stringify([snapshot]));
        localStorage.setItem("setupComplete", "true");
        localStorage.removeItem("messages");

        queryClient.invalidateQueries({ queryKey: [`/api/transactions/${DEMO_USER.id}`] });
        toast({
          title: "Setup complete",
          description: "Your business is now ready to track transactions!",
          variant: "default"
        });
        onClose();
      } catch (error) {
        console.error('Failed to save setup data:', error);
        toast({
          title: "Setup partially complete",
          description: "Your initial balance was saved, but there was an error saving your setup data. Please refresh the page.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Failed to save initial balance:', error);
      toast({
        title: "Setup failed",
        description: "Failed to save initial balance. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      saveMutation.mutate(formData);
    }
  };

  const handleBack = () => {
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

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={saveMutation.isPending}
            >
              {step === 4 ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 