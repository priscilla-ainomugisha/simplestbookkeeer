import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Transaction } from "@shared/schema";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface HistoryViewProps {
  transactions: Transaction[];
}

type FilterType = "all" | "income" | "expense";

export default function HistoryView({ transactions }: HistoryViewProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [visibleCount, setVisibleCount] = useState(5);
  
  // Filter transactions based on the selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "all") return true;
    return transaction.type === filter;
  });
  
  // Show only a limited number with option to view more
  const visibleTransactions = filteredTransactions.slice(0, visibleCount);
  
  const showMore = () => {
    setVisibleCount(prev => prev + 5);
  };
  
  return (
    <div className="p-4">
      <Card className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium text-lg">Recent Transactions</h2>
          <div className="flex space-x-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"}
              className={filter === "all" ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : ""}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "income" ? "default" : "outline"}
              className={filter === "income" ? "bg-[hsl(var(--income))] hover:bg-[hsl(var(--income))]" : ""}
              size="sm"
              onClick={() => setFilter("income")}
            >
              Income
            </Button>
            <Button
              variant={filter === "expense" ? "default" : "outline"}
              className={filter === "expense" ? "bg-[hsl(var(--expense))] hover:bg-[hsl(var(--expense))]" : ""}
              size="sm"
              onClick={() => setFilter("expense")}
            >
              Expense
            </Button>
          </div>
        </div>

        {/* Transaction list */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found.
          </div>
        ) : (
          <div className="divide-y">
            {visibleTransactions.map((transaction) => (
              <div key={transaction.id} className="py-3 flex justify-between items-center">
                <div className="flex items-center">
                  {transaction.type === "sale" ? (
                    <ArrowDownIcon className="text-[hsl(var(--income))] mr-2" />
                  ) : (
                    <ArrowUpIcon className="text-[hsl(var(--expense))] mr-2" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.category}</p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
                <p className={`font-medium ${transaction.type === "sale" ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`}>
                  {transaction.type === "sale" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {visibleTransactions.length < filteredTransactions.length && (
          <Button
            variant="outline"
            className="w-full mt-3 text-[hsl(var(--accent))] border-[hsl(var(--accent))]"
            onClick={showMore}
          >
            View More Transactions
          </Button>
        )}
      </Card>
    </div>
  );
}
