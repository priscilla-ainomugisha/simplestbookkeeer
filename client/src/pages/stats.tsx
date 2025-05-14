import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEMO_USER } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { DownloadIcon, FilePlusIcon, BarChart3Icon } from "lucide-react";
import { useState } from "react";
import { Transaction } from "@shared/schema";

interface WeeklySummary {
  income: number;
  expense: number;
  net: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
}

export default function StatsView() {
  const [activeTab, setActiveTab] = useState<'summary' | 'balance'>('summary');

  // Get weekly summary
  const { data: weeklySummary = { income: 0, expense: 0, net: 0 } } = useQuery<WeeklySummary>({
    queryKey: [`/api/analytics/weekly/${DEMO_USER.id}`],
  });

  // Get income category breakdown
  const { data: incomeBreakdown = [] } = useQuery<CategoryBreakdown[]>({
    queryKey: [`/api/analytics/categories/${DEMO_USER.id}/income`],
  });

  // Get expense category breakdown
  const { data: expenseBreakdown = [] } = useQuery<CategoryBreakdown[]>({
    queryKey: [`/api/analytics/categories/${DEMO_USER.id}/expense`],
  });

  // Get all transactions for balance sheet
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${DEMO_USER.id}`],
  });

  // Calculate total amounts for percentage calculation
  const totalIncome = incomeBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);

  // Handle report download (in a real app, this would generate a PDF or Excel file)
  const handleDownloadReport = () => {
    alert("This feature would download a report in a real production app.");
  };

  return (
    <div className="p-4">
      <Card className="bg-white rounded-lg shadow mb-4 p-4">
        {/* Tab navigation */}
        <div className="flex border-b mb-4">
          <button
            className={`pb-2 px-4 ${activeTab === 'summary' ? 'border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('summary')}
          >
            <BarChart3Icon className="inline mr-1 h-4 w-4" />
            Summary
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'balance' ? 'border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('balance')}
          >
            <FilePlusIcon className="inline mr-1 h-4 w-4" />
            Balance Sheet
          </button>
        </div>

        {activeTab === 'summary' ? (
          <>
            <h2 className="font-medium text-lg mb-3">This Week&apos;s Summary</h2>
            
            {/* Total Balance Card */}
            <div className="bg-gradient-to-r from-[hsl(var(--secondary))] to-[hsl(var(--primary))] rounded-lg p-4 text-white mb-4">
              <p className="text-sm opacity-80">Current Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(weeklySummary.net)}</p>
              <div className="flex justify-between mt-2 text-sm">
                <div>
                  <p className="opacity-80">Income</p>
                  <p className="font-medium">+{formatCurrency(weeklySummary.income)}</p>
                </div>
                <div>
                  <p className="opacity-80">Expenses</p>
                  <p className="font-medium">-{formatCurrency(weeklySummary.expense)}</p>
                </div>
              </div>
            </div>

            {/* Income/Expense Breakdown */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Top Categories</h3>
              
              {/* Income Categories */}
              <p className="text-sm font-medium text-[hsl(var(--income))] mb-1">Income</p>
              {incomeBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500 mb-3">No income transactions this week.</p>
              ) : (
                <div className="mb-3 space-y-2">
                  {incomeBreakdown.map((item, index) => {
                    const percentage = totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0;
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.category}</span>
                          <span>{formatCurrency(item.amount)} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[hsl(var(--income))] h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Expense Categories */}
              <p className="text-sm font-medium text-[hsl(var(--expense))] mb-1">Expenses</p>
              {expenseBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500 mb-3">No expense transactions this week.</p>
              ) : (
                <div className="mb-3 space-y-2">
                  {expenseBreakdown.map((item, index) => {
                    const percentage = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.category}</span>
                          <span>{formatCurrency(item.amount)} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[hsl(var(--expense))] h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-medium text-lg mb-3">Balance Sheet</h2>
            
            {/* Current Assets */}
            <div className="mb-4">
              <h3 className="text-md font-medium border-b pb-1 mb-2">Assets</h3>
              <div className="ml-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Cash</span>
                  <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Accounts Receivable</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Inventory</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between mb-1 border-t pt-1">
                  <span className="text-sm font-medium">Total Assets</span>
                  <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
                </div>
              </div>
            </div>
            
            {/* Liabilities */}
            <div className="mb-4">
              <h3 className="text-md font-medium border-b pb-1 mb-2">Liabilities</h3>
              <div className="ml-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Accounts Payable</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Loans</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between mb-1 border-t pt-1">
                  <span className="text-sm font-medium">Total Liabilities</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
              </div>
            </div>
            
            {/* Owner's Equity */}
            <div className="mb-4">
              <h3 className="text-md font-medium border-b pb-1 mb-2">Owner&apos;s Equity</h3>
              <div className="ml-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Capital</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Retained Earnings</span>
                  <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
                </div>
                <div className="flex justify-between mb-1 border-t pt-1">
                  <span className="text-sm font-medium">Total Owner&apos;s Equity</span>
                  <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
                </div>
              </div>
            </div>
            
            {/* Total */}
            <div className="bg-gray-100 p-2 rounded-md">
              <div className="flex justify-between">
                <span className="font-medium">Total Liabilities + Equity</span>
                <span className="font-medium">{formatCurrency(weeklySummary.net)}</span>
              </div>
            </div>
          </>
        )}

        <Button
          variant="outline"
          className="w-full mt-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]"
          onClick={handleDownloadReport}
        >
          <DownloadIcon className="mr-1 h-4 w-4" />
          Download {activeTab === 'summary' ? 'Weekly Report' : 'Balance Sheet'}
        </Button>
      </Card>
    </div>
  );
}