import { useState } from 'react';
import Header from '@/components/header';
import EnhancedChat from '@/components/enhanced-chat';
import TransactionInput from '@/components/transaction-input';
import RealTimeBalance from '@/components/real-time-balance';
import TabNavigation from '@/components/tab-navigation';
import SummaryModal from '@/components/summary-modal';

export default function EnhancedHome() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [showSummary, setShowSummary] = useState(false);

  // Function to process new messages
  const processMessage = (text: string) => {
    // Message processing will be handled by the EnhancedChat component
    console.log('Message sent from EnhancedHome:', text);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onSummaryClick={() => setShowSummary(true)} />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' && (
          <div className="flex-1 overflow-y-auto pb-20">
            <EnhancedChat />
          </div>
        )}
        
        {activeTab === 'balance' && (
          <div className="flex-1 overflow-y-auto pb-20">
            <RealTimeBalance />
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto pb-20">
            <RealTimeBalance />
          </div>
        )}

        {activeTab === 'chat' && <TransactionInput onSendMessage={processMessage} />}
      </div>
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab)} 
      />
      
      {showSummary && <SummaryModal onClose={() => setShowSummary(false)} />}
    </div>
  );
}