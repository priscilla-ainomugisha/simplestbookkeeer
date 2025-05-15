import { useState } from 'react';
import Header from '@/components/header';
import EnhancedChat from '@/components/enhanced-chat';
import RealTimeBalance from '@/components/real-time-balance';
import TabNavigation from '@/components/tab-navigation';
import SummaryModal from '@/components/summary-modal';
import { useSnapshotContext } from '@/contexts/snapshot-context';
import SetupWizard from '@/components/setup-wizard';

export default function EnhancedHome() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [showSummary, setShowSummary] = useState(false);
  const { isSetupComplete, loading } = useSnapshotContext();

  // If setup is not complete, show the setup wizard
  if (!isSetupComplete && !loading) {
    return <SetupWizard />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

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
      </div>
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab)} 
      />
      
      {showSummary && <SummaryModal onClose={() => setShowSummary(false)} />}
    </div>
  );
}