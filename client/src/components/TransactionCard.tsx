import React from 'react';
import { format } from 'date-fns';

type TransactionCardProps = {
  transaction: {
    type: 'sale' | 'expense';
    amount: number;
    category: string;
    date: Date;
  };
  onEdit?: () => void;
};

export default function TransactionCard({ transaction, onEdit }: TransactionCardProps) {
  const { type, amount, category, date } = transaction;
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };
  
  // Format the date
  const formatDate = (date: Date | string) => {
    // Ensure we're working with a Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Now';
    }
    
    const today = new Date();
    const isToday = dateObj.getDate() === today.getDate() &&
                    dateObj.getMonth() === today.getMonth() &&
                    dateObj.getFullYear() === today.getFullYear();
                    
    if (isToday) {
      return `Today, ${format(dateObj, 'h:mm a')}`;
    }
    
    return format(dateObj, 'MMM d, h:mm a');
  };
  
  return (
    <div className="transaction-card bg-white dark:bg-card/60 rounded-lg p-3 border border-border/30">
      <div className="flex items-center mb-3">
        {type === 'sale' ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mr-3">
                <span className="material-icons text-secondary">arrow_upward</span>
              </div>
              <span className="font-semibold text-secondary">Sale Recorded</span>
            </div>
            <span className="font-mono font-bold text-secondary">+{formatNumber(amount)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center mr-3">
                <span className="material-icons text-destructive">arrow_downward</span>
              </div>
              <span className="font-semibold text-destructive">Expense Recorded</span>
            </div>
            <span className="font-mono font-bold text-destructive">-{formatNumber(amount)}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-muted/50 dark:bg-muted/20 rounded-md p-2">
          <span className="text-xs text-muted-foreground block mb-1">Category</span>
          <span className="font-medium">{category}</span>
        </div>
        <div className="bg-muted/50 dark:bg-muted/20 rounded-md p-2">
          <span className="text-xs text-muted-foreground block mb-1">Date & Time</span>
          <span className="font-medium">{formatDate(date)}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-border/20 pt-2">
        <span className="text-xs text-muted-foreground">
          Is this correct?
        </span>
        
        <button 
          onClick={onEdit}
          className="text-xs bg-muted/70 hover:bg-muted transition-colors duration-200 px-3 py-1.5 rounded-md flex items-center"
        >
          <span className="material-icons text-xs mr-1">edit</span>
          Edit
        </button>
      </div>
    </div>
  );
}
