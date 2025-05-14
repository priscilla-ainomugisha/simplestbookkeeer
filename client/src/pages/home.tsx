import { useState } from "react";
import Header from "@/components/header";
import TabNavigation from "@/components/tab-navigation";
import ChatInterface from "@/components/chat-interface";
import HistoryView from "@/pages/history";
import StatsView from "@/pages/stats";
import InputArea from "@/components/input-area";
import SummaryModal from "@/components/summary-modal";
import { DEMO_USER } from "@/App";
import { Transaction } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { LineChart, Wallet, ChevronRight } from "lucide-react";

type TabType = "chat" | "history" | "stats";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Fetch transactions for the demo user
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${DEMO_USER.id}`],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  return (
    <div className="min-h-screen bg-background">
      <Header onSummaryClick={() => setShowSummaryModal(true)} />
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as TabType)} 
      />
      
      <main className="pl-16 pt-4 pb-20 px-6">
        {activeTab === "chat" && (
          <div className="max-w-3xl mx-auto">
            <ChatInterface />
            <InputArea userId={DEMO_USER.id} />
          </div>
        )}
        
        {activeTab === "history" && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Transaction History</h2>
            </div>
            <HistoryView transactions={transactions} />
          </div>
        )}
        
        {activeTab === "stats" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold mb-1">My Portfolio</h1>
                <p className="text-muted-foreground">View and manage your financial transactions</p>
              </div>
              <button className="text-primary font-medium text-sm flex items-center">
                View All <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <StatsView />
              </div>
              
              <div className="col-span-12 lg:col-span-4">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center">
                      <Wallet size={18} className="mr-2 text-primary" />
                      Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {transactions.slice(0, 3).map((t, i) => (
                        <div key={i} className="flex items-center p-3 bg-secondary/50 rounded-md">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                            {t.type === 'income' ? '+' : '-'}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-sm">{t.category}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                          </div>
                          <p className={`ml-auto font-medium ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                            {t.type === 'income' ? '+' : '-'}${t.amount}
                          </p>
                        </div>
                      ))}
                      
                      {transactions.length === 0 && (
                        <p className="text-muted-foreground text-sm py-4 text-center">
                          No recent transactions to display
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center">
                      <LineChart size={18} className="mr-2 text-primary" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="bg-secondary/50 p-3 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Income</p>
                        <p className="text-lg font-semibold text-income">$1,250.00</p>
                      </div>
                      <div className="bg-secondary/50 p-3 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-lg font-semibold text-expense">$752.38</p>
                      </div>
                      <div className="bg-primary/10 p-3 rounded-md">
                        <p className="text-sm text-muted-foreground">Net Balance</p>
                        <p className="text-lg font-semibold text-primary">$497.62</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      {showSummaryModal && (
        <SummaryModal onClose={() => setShowSummaryModal(false)} />
      )}
    </div>
  );
}

// Helper function to format dates
function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
