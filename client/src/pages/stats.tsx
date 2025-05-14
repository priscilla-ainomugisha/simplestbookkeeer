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
      <Card className="bg-white border border-gray-200 mb-4 p-5">
        {/* Tab navigation - minimalist design */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`pb-2 px-5 ${activeTab === 'summary' ? 'border-b border-black text-black font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('summary')}
          >
            <BarChart3Icon className="inline mr-2 h-4 w-4" />
            SUMMARY
          </button>
          <button
            className={`pb-2 px-5 ${activeTab === 'balance' ? 'border-b border-black text-black font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('balance')}
          >
            <FilePlusIcon className="inline mr-2 h-4 w-4" />
            BALANCE SHEET
          </button>
        </div>

        {activeTab === 'summary' ? (
          <>
            <h2 className="text-sm uppercase tracking-wide font-medium mb-4">Weekly Financial Summary</h2>
            
            {/* Total Balance Card - minimalist design */}
            <div className="bg-black p-5 mb-5 text-white">
              <p className="text-xs uppercase tracking-wider mb-1">Current Balance</p>
              <p className="text-3xl font-light tracking-tight">{formatCurrency(weeklySummary.net)}</p>
              <div className="flex justify-between mt-4 pt-4 border-t border-gray-700 text-xs">
                <div>
                  <p className="uppercase tracking-wider text-gray-400 mb-1">Income</p>
                  <p className="text-sm">+{formatCurrency(weeklySummary.income)}</p>
                </div>
                <div>
                  <p className="uppercase tracking-wider text-gray-400 mb-1">Expenses</p>
                  <p className="text-sm">-{formatCurrency(weeklySummary.expense)}</p>
                </div>
              </div>
            </div>

            {/* Income/Expense Breakdown - minimalist design */}
            <div className="mb-5">
              <h3 className="text-sm uppercase tracking-wide font-medium mb-4">Category Analysis</h3>
              
              {/* Income Categories */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">Income Categories</p>
                {incomeBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-500 mb-3">No income transactions this week.</p>
                ) : (
                  <div className="mb-3 space-y-4">
                    {incomeBreakdown.map((item, index) => {
                      const percentage = totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0;
                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">{item.category}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Share of income</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1">
                            <div 
                              className="bg-black h-1" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expense Categories */}
              <div className="mb-3">
                <p className="text-xs uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">Expense Categories</p>
                {expenseBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-500 mb-3">No expense transactions this week.</p>
                ) : (
                  <div className="mb-3 space-y-4">
                    {expenseBreakdown.map((item, index) => {
                      const percentage = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">{item.category}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Share of expenses</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1">
                            <div 
                              className="bg-gray-500 h-1" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-sm uppercase tracking-wide font-medium mb-4">Balance Sheet Overview</h2>
            
            {/* Current Assets - minimalist design */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">Assets</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cash & Equivalents</span>
                  <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accounts Receivable</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inventory</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-black">
                  <span className="text-sm font-medium">Total Assets</span>
                  <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
                </div>
              </div>
            </div>
            
            {/* Liabilities - minimalist design */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">Liabilities</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accounts Payable</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Short-term Loans</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium">Total Liabilities</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
              </div>
            </div>
            
            {/* Owner's Equity - minimalist design */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">Owner&apos;s Equity</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Initial Capital</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Retained Earnings</span>
                  <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium">Total Equity</span>
                  <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
                </div>
              </div>
            </div>
            
            {/* Total - minimalist design */}
            <div className="bg-black text-white p-4">
              <div className="flex justify-between">
                <span className="text-sm">LIABILITIES + EQUITY</span>
                <span className="text-sm font-medium">{formatCurrency(weeklySummary.net)}</span>
              </div>
            </div>
          </>
        )}

        <Button
          variant="outline"
          className="w-full mt-6 bg-white text-black border border-black rounded-none hover:bg-gray-100 uppercase text-xs tracking-wider py-6"
          onClick={handleDownloadReport}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export {activeTab === 'summary' ? 'Weekly Report' : 'Balance Sheet'}
        </Button>
      </Card>
    </div>
  );
}