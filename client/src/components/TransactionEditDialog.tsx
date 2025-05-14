import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editTransaction } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// List of common categories for both sales and expenses
const SALES_CATEGORIES = [
  'Sales', 'Produce', 'Services', 'Clothing', 'Electronics', 'Other Sales'
];

const EXPENSE_CATEGORIES = [
  'Transport', 'Food', 'Rent', 'Utilities', 'Inventory', 'Salaries', 
  'Communication', 'Miscellaneous'
];

type TransactionEditDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: number;
    type: 'sale' | 'expense';
    amount: number;
    category: string;
  };
};

export default function TransactionEditDialog({
  isOpen,
  onClose,
  transaction
}: TransactionEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state for the form
  const [type, setType] = useState<'sale' | 'expense'>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount);
  const [category, setCategory] = useState(transaction.category);
  
  // Get the appropriate categories based on transaction type
  const categories = type === 'sale' ? SALES_CATEGORIES : EXPENSE_CATEGORIES;
  
  // Edit transaction mutation
  const editMutation = useMutation({
    mutationFn: (data: any) => editTransaction(transaction.id, data),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/today-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/history'] });
      
      // Show success message
      toast({
        title: 'Transaction updated',
        description: 'Your transaction has been successfully updated.',
      });
      
      // Close the dialog
      onClose();
    },
    onError: (error) => {
      // Show error message
      toast({
        title: 'Failed to update transaction',
        description: error instanceof Error ? error.message : 'An error occurred while updating the transaction.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Submit the data
    editMutation.mutate({
      type,
      amount,
      category
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select 
              value={type} 
              onValueChange={(value) => setType(value as 'sale' | 'expense')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              required
            />
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={category} 
              onValueChange={setCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={onClose}
              disabled={editMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}