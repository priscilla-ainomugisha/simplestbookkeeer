export interface CashbookEntry {
  user_id: string;
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
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
  }>;
} 