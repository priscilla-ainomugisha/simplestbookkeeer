import React from 'react';

type PageTabsProps = {
  activeTab: 'chat' | 'summary' | 'settings';
  onTabChange: (tab: 'chat' | 'summary' | 'settings') => void;
};

export default function PageTabs({ activeTab, onTabChange }: PageTabsProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow mb-6 overflow-hidden">
      <div className="flex border-b border-neutral-200 dark:border-neutral-700">
        <button 
          className={`flex-1 py-3 px-4 font-medium ${
            activeTab === 'chat' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
          onClick={() => onTabChange('chat')}
        >
          Chat
        </button>
        <button 
          className={`flex-1 py-3 px-4 font-medium ${
            activeTab === 'summary' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
          onClick={() => onTabChange('summary')}
        >
          Summary
        </button>
        <button 
          className={`flex-1 py-3 px-4 font-medium ${
            activeTab === 'settings' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
          onClick={() => onTabChange('settings')}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
