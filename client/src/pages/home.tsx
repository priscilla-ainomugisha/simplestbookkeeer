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

type TabType = "chat" | "history" | "stats";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Fetch transactions for the demo user
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${DEMO_USER.id}`],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header onSummaryClick={() => setShowSummaryModal(true)} />
      
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
      
      {activeTab === "chat" && <InputArea userId={DEMO_USER.id} />}
    </div>
  );
}
