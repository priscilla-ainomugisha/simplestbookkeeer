import { createContext, useContext, ReactNode } from 'react';
import { useSnapshot, BalanceSnapshot, Transaction, SetupData } from '@/hooks/use-snapshot';

interface SnapshotContextType {
  isSetupComplete: boolean;
  currentSnapshot: BalanceSnapshot | null;
  allSnapshots: BalanceSnapshot[];
  loading: boolean;
  completeSetup: (setupData: SetupData) => void;
  addTransaction: (transaction: Omit<Transaction, 'date'>) => BalanceSnapshot | undefined;
}

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

export function SnapshotProvider({ children }: { children: ReactNode }) {
  const snapshotData = useSnapshot();
  
  return (
    <SnapshotContext.Provider value={snapshotData}>
      {children}
    </SnapshotContext.Provider>
  );
}

export function useSnapshotContext() {
  const context = useContext(SnapshotContext);
  if (context === undefined) {
    throw new Error('useSnapshotContext must be used within a SnapshotProvider');
  }
  return context;
}