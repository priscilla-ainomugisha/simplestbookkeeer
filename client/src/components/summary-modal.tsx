import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ShareIcon, XIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DEMO_USER } from "@/App";
import { formatCurrency, formatDateFull } from "@/lib/utils";

interface SummaryModalProps {
  onClose: () => void;
}

interface DailySummary {
  income: number;
  expense: number;
  net: number;
}

interface TransactionBreakdown {
  category: string;
  amount: number;
  type: "income" | "expense";
}

export default function SummaryModal({ onClose }: SummaryModalProps) {
  const [open, setOpen] = useState(true);
  const today = new Date();
  
  // Get daily summary
  const { data: summary = { income: 0, expense: 0, net: 0 } } = useQuery<DailySummary>({
    queryKey: [`/api/analytics/daily/${DEMO_USER.id}`],
  });
  
  // Get transactions for breakdown
  const { data: transactions = [] } = useQuery({
    queryKey: [`/api/transactions/${DEMO_USER.id}`],
  });
  
  // Create transaction breakdown for today
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  
  const transactionBreakdown: TransactionBreakdown[] = transactions
    .filter(t => new Date(t.createdAt) >= todayStart)
    .map(t => ({
      category: t.category,
      amount: t.amount,
      type: t.type as "income" | "expense"
    }));
  
  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  
  // Handle share functionality
  const handleShare = () => {
    // In a real app, this would open a sharing menu
    alert("Sharing functionality would be implemented here in a real app.");
  };
  
  // Handle download functionality
  const handleDownload = () => {
    // In a real app, this would download a PDF report
    alert("Download functionality would be implemented here in a real app.");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white rounded-lg w-5/6 max-w-md p-4 sm:max-w-md">
        <DialogHeader className="flex justify-between items-center mb-4">
          <DialogTitle className="font-medium text-lg">Daily Summary</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="text-gray-500"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">{formatDateFull(today)}</p>
          <div className="flex justify-between mt-2">
            <div>
              <p className="text-sm text-gray-500">Income</p>
              <p className="font-medium text-[hsl(var(--income))] text-lg">+{formatCurrency(summary.income)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="font-medium text-[hsl(var(--expense))] text-lg">-{formatCurrency(summary.expense)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Net</p>
              <p className="font-medium text-lg">{formatCurrency(summary.net)}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-3 mb-4">
          <p className="font-medium mb-2">Transaction Breakdown</p>
          {transactionBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions today</p>
          ) : (
            <div className="space-y-2">
              {transactionBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{item.category}</span>
                  <span className={item.type === "income" 
                    ? "text-[hsl(var(--income))]" 
                    : "text-[hsl(var(--expense))]"
                  }>
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))/80] text-white flex-1 py-2 rounded-lg flex items-center justify-center"
            onClick={handleShare}
          >
            <ShareIcon className="mr-1 h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            className="border border-[hsl(var(--accent))] text-[hsl(var(--accent))] flex-1 py-2 rounded-lg flex items-center justify-center"
            onClick={handleDownload}
          >
            <DownloadIcon className="mr-1 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
