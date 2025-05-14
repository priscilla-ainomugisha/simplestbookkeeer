import React, { forwardRef } from 'react';
import TransactionCard from './TransactionCard';

type Message = {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  isVoiceNote?: boolean;
  duration?: number;
  isTyping?: boolean;
  transactionData?: {
    type: 'sale' | 'expense';
    amount: number;
    category: string;
    date: Date;
  };
};

type ChatContainerProps = {
  messages: Message[];
};

const ChatContainer = forwardRef<HTMLDivElement, ChatContainerProps>(
  ({ messages }, ref) => {
    // Format voice note duration
    const formatDuration = (seconds: number = 0) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div ref={ref} className="chat-container overflow-y-auto max-h-[calc(100vh-280px)]">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex mb-4 ${message.type === 'user' ? 'justify-end' : ''}`}
          >
            <div 
              className={`rounded-lg py-3 px-4 max-w-[85%] ${
                message.type === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            >
              {message.isTyping ? (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : message.isVoiceNote ? (
                <div className="flex items-center">
                  <span className="material-icons mr-2">mic</span>
                  <span>Voice note ({formatDuration(message.duration)})</span>
                </div>
              ) : message.transactionData ? (
                <TransactionCard transaction={message.transactionData} />
              ) : (
                <p className={message.type === 'user' ? '' : 'text-neutral-800 dark:text-neutral-100'}>
                  {message.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;
