import React from 'react';

type PageTabsProps = {
  activeTab: 'chat' | 'summary' | 'settings';
  onTabChange: (tab: 'chat' | 'summary' | 'settings') => void;
};

export default function PageTabs({ activeTab, onTabChange }: PageTabsProps) {
  return (
    <div className="mb-6 overflow-hidden animate-in">
      {/* Retro tab navigation */}
      <div className="flex bg-dots">
        <button 
          className={`flex-1 py-2 transition-all duration-200 relative uppercase font-bold tracking-wide text-sm border-4 ${
            activeTab === 'chat' 
              ? 'bg-secondary text-white border-black z-10' 
              : 'bg-white border-r-0 border-t-4 border-l-4 border-b-4 border-primary hover:bg-primary/10'
          }`}
          onClick={() => onTabChange('chat')}
          style={activeTab === 'chat' ? {transform: 'translateY(2px)'} : {}}
        >
          <div className="flex items-center justify-center">
            <span className="material-icons text-sm mr-1">chat</span>
            <span>Chat</span>
          </div>
        </button>
        
        <button 
          className={`flex-1 py-2 transition-all duration-200 relative uppercase font-bold tracking-wide text-sm border-4 ${
            activeTab === 'summary' 
              ? 'bg-secondary text-white border-black z-10' 
              : 'bg-white border-r-0 border-t-4 border-l-0 border-b-4 border-primary hover:bg-primary/10'
          }`}
          onClick={() => onTabChange('summary')}
          style={activeTab === 'summary' ? {transform: 'translateY(2px)'} : {}}
        >
          <div className="flex items-center justify-center">
            <span className="material-icons text-sm mr-1">bar_chart</span>
            <span>Summary</span>
          </div>
        </button>
        
        <button 
          className={`flex-1 py-2 transition-all duration-200 relative uppercase font-bold tracking-wide text-sm border-4 ${
            activeTab === 'settings' 
              ? 'bg-secondary text-white border-black z-10' 
              : 'bg-white border-t-4 border-l-0 border-b-4 border-r-4 border-primary hover:bg-primary/10'
          }`}
          onClick={() => onTabChange('settings')}
          style={activeTab === 'settings' ? {transform: 'translateY(2px)'} : {}}
        >
          <div className="flex items-center justify-center">
            <span className="material-icons text-sm mr-1">settings</span>
            <span>Settings</span>
          </div>
        </button>
      </div>
      
      {/* Tab content border */}
      <div className="h-2 bg-secondary w-full"></div>
    </div>
  );
}
