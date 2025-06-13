import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import TabNavigation from "@/components/tab-navigation";
import ChatInterface from "@/components/chat-interface";
import HistoryView from "@/pages/history";
import StatsView from "@/pages/stats";
import InputArea from "@/components/input-area";
import SummaryModal from "@/components/summary-modal";
import { Transaction } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

type TabType = "chat" | "history" | "stats";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Fetch transactions for the authenticated user
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${user?.id}`],
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user?.id, // Only fetch if we have a user ID
  });
  
  if (!user) {
    return null; // ProtectedRoute will handle the redirect
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onSummaryClick={() => setShowSummaryModal(true)} />
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as TabType)} 
      />
      
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === "chat" && <ChatInterface />}
        {activeTab === "history" && <HistoryView transactions={transactions} />}
        {activeTab === "stats" && <StatsView />}
      </main>

      {showSummaryModal && (
        <SummaryModal onClose={() => setShowSummaryModal(false)} />
      )}
      
      {activeTab === "chat" && <InputArea userId={user.id} />}
    </div>
  );
}
