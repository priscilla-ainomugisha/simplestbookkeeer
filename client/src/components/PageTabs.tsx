import React from 'react';

type PageTabsProps = {
  activeTab: 'chat' | 'summary' | 'settings';
  onTabChange: (tab: 'chat' | 'summary' | 'settings') => void;
};

export default function PageTabs({ activeTab, onTabChange }: PageTabsProps) {
  return (
    <div className="bg-card dark:bg-card rounded-xl shadow-md mb-6 overflow-hidden border border-border/20 animate-in">
      <div className="flex border-b border-border/30">
        <button 
          className={`flex-1 py-3 px-4 font-medium transition-all duration-200 ${
            activeTab === 'chat' 
              ? 'text-primary border-b-2 border-primary bg-primary/5 dark:bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
          onClick={() => onTabChange('chat')}
        >
          <div className="flex items-center justify-center">
            <span className="material-icons text-sm mr-1">chat</span>
            <span>Chat</span>
          </div>
        </button>
        <button 
          className={`flex-1 py-3 px-4 font-medium transition-all duration-200 ${
            activeTab === 'summary' 
              ? 'text-primary border-b-2 border-primary bg-primary/5 dark:bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
          onClick={() => onTabChange('summary')}
        >
          <div className="flex items-center justify-center">
            <span className="material-icons text-sm mr-1">bar_chart</span>
            <span>Summary</span>
          </div>
        </button>
        <button 
          className={`flex-1 py-3 px-4 font-medium transition-all duration-200 ${
            activeTab === 'settings' 
              ? 'text-primary border-b-2 border-primary bg-primary/5 dark:bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
          onClick={() => onTabChange('settings')}
        >
          <div className="flex items-center justify-center">
            <span className="material-icons text-sm mr-1">settings</span>
            <span>Settings</span>
          </div>
        </button>
      </div>
    </div>
  );
}
