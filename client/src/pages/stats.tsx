import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEMO_USER } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { DownloadIcon } from "lucide-react";

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

        <Button
          variant="outline"
          className="w-full text-[hsl(var(--accent))] border-[hsl(var(--accent))]"
          onClick={handleDownloadReport}
        >
          <DownloadIcon className="mr-1 h-4 w-4" />
          Download Weekly Report
        </Button>
      </Card>
    </div>
  );
}
