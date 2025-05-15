import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SetupData } from '@/hooks/use-snapshot';
import { useSnapshotContext } from '@/contexts/snapshot-context';

type SetupStep = 'cash' | 'inventory' | 'loans' | 'capital' | 'complete';

export default function SetupWizard() {
  const { completeSetup } = useSnapshotContext();
  const [currentStep, setCurrentStep] = useState<SetupStep>('cash');
  const [setupData, setSetupData] = useState<SetupData>({
    cash: 0,
    inventory: 0,
    capital: 0,
    liabilities: 0,
    date: new Date().toISOString().split('T')[0]
  });
  
  const [inputValue, setInputValue] = useState<string>('');
  
  const handleNextStep = () => {
    const numValue = parseFloat(inputValue);
    
    // Update the appropriate field based on the current step
    switch (currentStep) {
      case 'cash':
        setSetupData({ ...setupData, cash: isNaN(numValue) ? 0 : numValue });
        setCurrentStep('inventory');
        break;
      case 'inventory':
        setSetupData({ ...setupData, inventory: isNaN(numValue) ? 0 : numValue });
        setCurrentStep('loans');
        break;
      case 'loans':
        setSetupData({ ...setupData, liabilities: isNaN(numValue) ? 0 : numValue });
        setCurrentStep('capital');
        break;
      case 'capital':
        setSetupData({ ...setupData, capital: isNaN(numValue) ? 0 : numValue });
        setCurrentStep('complete');
        break;
      case 'complete':
        // Save all the data and complete setup
        completeSetup(setupData);
        break;
    }
    
    // Clear input field for next step
    setInputValue('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNextStep();
    }
  };
  
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md p-6 bg-white border border-gray-200">
        <h2 className="text-xl font-medium mb-6 text-center">Business Setup</h2>
        
        {currentStep === 'cash' && (
          <div className="space-y-4">
            <p className="text-sm">What's your starting cash balance? How much money do you have in your business right now?</p>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter amount"
                className="flex-1 rounded-none border-gray-300"
              />
              <Button 
                onClick={handleNextStep}
                className="bg-black hover:bg-gray-800 text-white rounded-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {currentStep === 'inventory' && (
          <div className="space-y-4">
            <p className="text-sm">Do you have any inventory or equipment? Enter the total value.</p>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter amount"
                className="flex-1 rounded-none border-gray-300"
              />
              <Button 
                onClick={handleNextStep}
                className="bg-black hover:bg-gray-800 text-white rounded-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {currentStep === 'loans' && (
          <div className="space-y-4">
            <p className="text-sm">Do you have any loans? Enter the total amount you need to repay.</p>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter amount"
                className="flex-1 rounded-none border-gray-300"
              />
              <Button 
                onClick={handleNextStep}
                className="bg-black hover:bg-gray-800 text-white rounded-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {currentStep === 'capital' && (
          <div className="space-y-4">
            <p className="text-sm">How much capital did you invest in your business initially?</p>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter amount"
                className="flex-1 rounded-none border-gray-300"
              />
              <Button 
                onClick={handleNextStep}
                className="bg-black hover:bg-gray-800 text-white rounded-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {currentStep === 'complete' && (
          <div className="space-y-4">
            <p className="text-sm">Setup complete! Here's your starting balance:</p>
            
            <div className="space-y-2 border border-gray-200 p-4">
              <div className="flex justify-between">
                <span>Cash:</span>
                <span>${setupData.cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Inventory:</span>
                <span>${setupData.inventory.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Loans/Liabilities:</span>
                <span>${setupData.liabilities.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Capital:</span>
                <span>${setupData.capital.toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleNextStep}
              className="w-full bg-black hover:bg-gray-800 text-white rounded-none"
            >
              Start Using Your Bookkeeper
            </Button>
          </div>
        )}
        
        <div className="mt-6 flex justify-between text-xs text-gray-500">
          <div>Step {
            currentStep === 'cash' ? '1/4' :
            currentStep === 'inventory' ? '2/4' :
            currentStep === 'loans' ? '3/4' :
            currentStep === 'capital' ? '4/4' :
            'Complete'
          }</div>
          <div>All data is stored locally in your browser</div>
        </div>
      </Card>
    </div>
  );
}