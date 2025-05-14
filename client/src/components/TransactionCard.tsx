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
    <div className="transaction-card bg-white dark:bg-card border-4 border-primary shadow-md mb-3 overflow-hidden dark:crt-effect animate-in">
      {/* Retro style transaction header */}
      <div className={`py-1 px-3 flex items-center justify-between border-b-2 border-black ${
        type === 'sale' ? 'bg-secondary text-white' : 'bg-destructive text-white'
      }`}>
        {type === 'sale' ? (
          <>
            <div className="flex items-center uppercase font-bold tracking-wide">
              <span className="material-icons text-sm mr-2">arrow_upward</span>
              <span>Sale Recorded</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono font-bold">+{formatNumber(amount)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center uppercase font-bold tracking-wide">
              <span className="material-icons text-sm mr-2">arrow_downward</span>
              <span>Expense Recorded</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono font-bold">-{formatNumber(amount)}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-0 bg-dots">
        <div className="p-2 border-r-2 border-b-2 border-primary">
          <div className="bg-white dark:bg-card border-2 border-black p-2" 
              style={{ boxShadow: "2px 2px 0 #000" }}>
            <span className="text-xs text-black dark:text-white font-bold uppercase block mb-1">Category</span>
            <span className="font-medium">{category}</span>
          </div>
        </div>
        <div className="p-2 border-b-2 border-primary">
          <div className="bg-white dark:bg-card border-2 border-black p-2"
              style={{ boxShadow: "2px 2px 0 #000" }}>
            <span className="text-xs text-black dark:text-white font-bold uppercase block mb-1">Date & Time</span>
            <span className="font-medium">{formatDate(date)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center px-3 py-2 bg-accent/20">
        <span className="text-xs font-bold uppercase">
          Is this correct?
        </span>
        
        <button 
          onClick={onEdit}
          className="btn-retro text-xs px-3 py-1"
        >
          <span className="material-icons text-xs mr-1">edit</span>
          Edit
        </button>
      </div>
      
      {/* Decorative bottom bar */}
      <div className="h-2 w-full bg-accent"></div>
    </div>
  );
}
