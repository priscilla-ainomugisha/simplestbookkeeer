import { useSnapshot } from '@/hooks/use-snapshot';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function RealTimeBalance() {
  const { currentSnapshot, loading } = useSnapshot();

  if (loading || !currentSnapshot) {
    return (
      <div className="p-4">
        <Card className="bg-white border border-gray-200 mb-4 p-5">
          <p className="text-center text-gray-500">Loading balance sheet...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="bg-white border border-gray-200 mb-4 p-5">
        <h2 className="text-sm uppercase tracking-wide font-medium mb-4">Real-Time Balance Sheet</h2>
        
        {/* Current Assets - minimalist design */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">Assets</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cash & Equivalents</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.cash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Inventory</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.inventory)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Accounts Receivable</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.receivables)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-black">
              <span className="text-sm font-medium">Total Assets</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.totalAssets)}</span>
            </div>
          </div>
        </div>
        
        {/* Liabilities - minimalist design */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">Liabilities</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loans</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.liabilities)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Accounts Payable</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.payables)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-sm font-medium">Total Liabilities</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.totalLiabilities)}</span>
            </div>
          </div>
        </div>
        
        {/* Owner's Equity - minimalist design */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">Owner&apos;s Equity</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Capital</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.capital)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Retained Earnings</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.retainedEarnings)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-sm font-medium">Total Equity</span>
              <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.equity)}</span>
            </div>
          </div>
        </div>
        
        {/* Total - minimalist design */}
        <div className="bg-black text-white p-4">
          <div className="flex justify-between">
            <span className="text-sm">LIABILITIES + EQUITY</span>
            <span className="text-sm font-medium">{formatCurrency(currentSnapshot.closing.totalLiabilities + currentSnapshot.closing.equity)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}