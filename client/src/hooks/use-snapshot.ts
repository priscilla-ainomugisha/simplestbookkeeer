import { useState, useEffect } from 'react';

// Types for our balance sheet data
export interface BalanceSnapshot {
  date: string;
  opening: {
    cash: number;
    inventory: number;
    capital: number;
    liabilities: number;
  };
  transactions: Transaction[];
  closing: {
    cash: number;
    inventory: number;
    capital: number;
    liabilities: number;
    receivables: number;
    payables: number;
    retainedEarnings: number;
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
  };
}

export interface Transaction {
  type: 'sale' | 'expense' | 'loan' | 'inventory' | 'capital';
  amount: number;
  category?: string;
  item?: string;
  description?: string;
  date: string;
}

export interface SetupData {
  cash: number;
  inventory: number;
  capital: number;
  liabilities: number;
  date: string;
}

export function useSnapshot() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<BalanceSnapshot | null>(null);
  const [allSnapshots, setAllSnapshots] = useState<BalanceSnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const setupComplete = localStorage.getItem('setupComplete') === 'true';
    setIsSetupComplete(setupComplete);

    if (setupComplete) {
      loadSnapshots();
    }
    
    setLoading(false);
  }, []);

  // Load all snapshots from localStorage
  const loadSnapshots = () => {
    try {
      const storedSnapshots = localStorage.getItem('dailySnapshots');
      if (storedSnapshots) {
        const snapshots: BalanceSnapshot[] = JSON.parse(storedSnapshots);
        setAllSnapshots(snapshots);
        
        // Get or create today's snapshot
        const today = new Date().toISOString().split('T')[0];
        let todaySnapshot = snapshots.find(s => s.date === today);
        
        if (!todaySnapshot) {
          todaySnapshot = createTodaySnapshot(snapshots, today);
          const updatedSnapshots = [...snapshots, todaySnapshot];
          setAllSnapshots(updatedSnapshots);
          localStorage.setItem('dailySnapshots', JSON.stringify(updatedSnapshots));
        }
        
        setCurrentSnapshot(todaySnapshot);
      } else {
        // No snapshots found, create from initialBalances
        createInitialSnapshot();
      }
    } catch (error) {
      console.error('Error loading snapshots:', error);
    }
  };

  // Create initial snapshot from setup data
  const createInitialSnapshot = () => {
    try {
      const initialBalancesJson = localStorage.getItem('initialBalances');
      if (initialBalancesJson) {
        const initialBalances: SetupData = JSON.parse(initialBalancesJson);
        const today = new Date().toISOString().split('T')[0];
        
        // Create closing values based on opening values
        const retainedEarnings = initialBalances.cash - initialBalances.liabilities;
        const totalAssets = initialBalances.cash + initialBalances.inventory;
        const equity = initialBalances.capital + retainedEarnings;
        
        const initialSnapshot: BalanceSnapshot = {
          date: today,
          opening: {
            cash: initialBalances.cash,
            inventory: initialBalances.inventory,
            capital: initialBalances.capital,
            liabilities: initialBalances.liabilities,
          },
          transactions: [],
          closing: {
            cash: initialBalances.cash,
            inventory: initialBalances.inventory,
            capital: initialBalances.capital,
            liabilities: initialBalances.liabilities,
            receivables: 0,
            payables: 0,
            retainedEarnings,
            totalAssets,
            totalLiabilities: initialBalances.liabilities,
            equity,
          }
        };
        
        setAllSnapshots([initialSnapshot]);
        setCurrentSnapshot(initialSnapshot);
        localStorage.setItem('dailySnapshots', JSON.stringify([initialSnapshot]));
      }
    } catch (error) {
      console.error('Error creating initial snapshot:', error);
    }
  };

  // Create today's snapshot based on previous day's closing values
  const createTodaySnapshot = (snapshots: BalanceSnapshot[], today: string): BalanceSnapshot => {
    // Sort snapshots by date, descending
    const sortedSnapshots = [...snapshots].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const previousSnapshot = sortedSnapshots[0];
    
    return {
      date: today,
      opening: {
        cash: previousSnapshot.closing.cash,
        inventory: previousSnapshot.closing.inventory,
        capital: previousSnapshot.closing.capital,
        liabilities: previousSnapshot.closing.liabilities,
      },
      transactions: [],
      closing: { ...previousSnapshot.closing }
    };
  };

  // Complete the setup process
  const completeSetup = (setupData: SetupData) => {
    localStorage.setItem('initialBalances', JSON.stringify(setupData));
    localStorage.setItem('setupComplete', 'true');
    setIsSetupComplete(true);
    createInitialSnapshot();
  };

  // Add a new transaction and recalculate balances
  const addTransaction = (transaction: Omit<Transaction, 'date'>) => {
    if (!currentSnapshot) return;
    
    const today = new Date().toISOString().split('T')[0];
    const newTransaction = { ...transaction, date: today };
    
    // Create updated snapshot with new transaction
    const updatedSnapshot = { ...currentSnapshot };
    updatedSnapshot.transactions = [...updatedSnapshot.transactions, newTransaction];
    
    // Recalculate closing values
    const closing = { ...updatedSnapshot.closing };
    
    // Update balances based on transaction type
    switch (transaction.type) {
      case 'sale':
        closing.cash += transaction.amount;
        break;
      case 'expense':
        closing.cash -= transaction.amount;
        break;
      case 'loan':
        closing.cash += transaction.amount;
        closing.liabilities += transaction.amount;
        break;
      case 'inventory':
        closing.cash -= transaction.amount;
        closing.inventory += transaction.amount;
        break;
      case 'capital':
        closing.cash += transaction.amount;
        closing.capital += transaction.amount;
        break;
    }
    
    // Recalculate derived values
    closing.retainedEarnings = closing.cash - closing.liabilities;
    closing.totalAssets = closing.cash + closing.inventory + closing.receivables;
    closing.totalLiabilities = closing.liabilities + closing.payables;
    closing.equity = closing.capital + closing.retainedEarnings;
    
    updatedSnapshot.closing = closing;
    
    // Update state and localStorage
    setCurrentSnapshot(updatedSnapshot);
    
    const updatedSnapshots = allSnapshots.map(snapshot => 
      snapshot.date === today ? updatedSnapshot : snapshot
    );
    
    setAllSnapshots(updatedSnapshots);
    localStorage.setItem('dailySnapshots', JSON.stringify(updatedSnapshots));
    
    return updatedSnapshot;
  };

  return {
    isSetupComplete,
    currentSnapshot,
    allSnapshots,
    loading,
    completeSetup,
    addTransaction
  };
}