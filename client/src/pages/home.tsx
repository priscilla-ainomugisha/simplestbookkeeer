import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";

type TabType = "chat" | "history" | "stats";

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab');
    return (tabParam === 'chat' || tabParam === 'history' || tabParam === 'stats') 
      ? tabParam 
      : "chat";
  });
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Fetch sales for the authenticated user
  const { data: sales = [], isLoading: isLoadingSales } = useQuery({
    queryKey: [`/api/transactions/${user?.id}`],
    queryFn: () => user?.id ? fetchSalesHistory(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  // Fetch user's balance sheet
  const { data: balanceSheet, isLoading: isLoadingBalanceSheet } = useQuery({
    queryKey: ['balanceSheet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('balance_sheets')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
  
  if (!user) {
    return null; // ProtectedRoute will handle the redirect
  }

  const isLoading = isLoadingSales || isLoadingBalanceSheet;
  
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onSummaryClick={() => setShowSummaryModal(true)} />
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as TabType)} 
      />
      
      <main className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === "chat" && <ChatInterface />}
            {activeTab === "history" && <HistoryView transactions={sales} />}
            {activeTab === "stats" && <StatsView />}
          </>
        )}
      </main>

      {showSummaryModal && (
        <SummaryModal 
          onClose={() => setShowSummaryModal(false)}
        />
      )}
      
      {activeTab === "chat" && <InputArea userId={user.id} />}
    </div>
  );
}
