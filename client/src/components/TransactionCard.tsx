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
    <div className="transaction-card">
      <div className="flex items-center mb-2">
        {type === 'sale' ? (
          <>
            <span className="material-icons text-secondary mr-1">arrow_upward</span>
            <span className="font-medium text-secondary">Sale Recorded</span>
          </>
        ) : (
          <>
            <span className="material-icons text-error mr-1">arrow_downward</span>
            <span className="font-medium text-error">Expense Recorded</span>
          </>
        )}
      </div>
      
      <div className="flex justify-between mb-1">
        <span className="text-neutral-600 dark:text-neutral-300">Amount:</span>
        <span className="font-mono font-medium">{formatNumber(amount)}</span>
      </div>
      
      <div className="flex justify-between mb-1">
        <span className="text-neutral-600 dark:text-neutral-300">Category:</span>
        <span>{category}</span>
      </div>
      
      <div className="flex justify-between mb-2">
        <span className="text-neutral-600 dark:text-neutral-300">Date:</span>
        <span>{formatDate(date)}</span>
      </div>
      
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        Is this correct? If not, tap the button below:
      </div>
      
      <div className="mt-2 flex space-x-2">
        <button 
          onClick={onEdit} 
          className="text-xs bg-neutral-100 dark:bg-neutral-600 px-3 py-1 rounded-full"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
