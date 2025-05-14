import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTransactionHistory } from '@/lib/api';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import TransactionEditDialog from './TransactionEditDialog';

export default function TransactionTable() {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<string>('7');
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(null);
  
  // Fetch transaction history
  const { data: transactions, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/transactions/history', timeRange],
    queryFn: () => fetchTransactionHistory(Number(timeRange))
  });
  
  // Format amount with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return format(date, 'MMM d, h:mm a');
  };
  
  // Calculate totals
  const totals = React.useMemo(() => {
    if (!transactions) return { sales: 0, expenses: 0, net: 0 };
    
    const sales = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      sales,
      expenses,
      net: sales - expenses
    };
  }, [transactions]);
  
  // Handle edit transaction
  const handleEditTransaction = (id: number) => {
    setSelectedTransaction(id);
  };
  
  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setSelectedTransaction(null);
    refetch();
  };
  
  // Calculate the current transaction for the edit dialog
  const currentTransaction = React.useMemo(() => {
    if (!selectedTransaction || !transactions) return null;
    return transactions.find(t => t.id === selectedTransaction);
  }, [selectedTransaction, transactions]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center text-destructive">
        Error loading transactions. Please try again.
      </div>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
        <p className="text-muted-foreground">
          No transactions have been recorded in the selected time period.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="timeRange" className="text-sm">Time range:</Label>
          <Select 
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-secondary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-secondary">{formatNumber(totals.sales)}</p>
        </div>
        
        <div className="bg-destructive/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-destructive">{formatNumber(totals.expenses)}</p>
        </div>
        
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Net</p>
          <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {totals.net >= 0 ? '+' : ''}{formatNumber(totals.net)}
          </p>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell>
                  {transaction.type === 'sale' ? (
                    <Badge variant="secondary">Sale</Badge>
                  ) : (
                    <Badge variant="destructive">Expense</Badge>
                  )}
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className={`text-right font-mono ${
                  transaction.type === 'sale' ? 'text-secondary' : 'text-destructive'
                }`}>
                  {transaction.type === 'sale' ? '+' : '-'}{formatNumber(transaction.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <button 
                    onClick={() => handleEditTransaction(transaction.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {currentTransaction && (
        <TransactionEditDialog
          isOpen={!!selectedTransaction}
          onClose={handleCloseEditDialog}
          transaction={{
            id: currentTransaction.id,
            type: currentTransaction.type,
            amount: currentTransaction.amount,
            category: currentTransaction.category
          }}
        />
      )}
    </div>
  );
}