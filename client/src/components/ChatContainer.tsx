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
      <div ref={ref} className="chat-container overflow-y-auto max-h-[calc(100vh-280px)] px-1 py-2">
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`flex mb-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {message.type === 'assistant' && !message.isTyping && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2 mt-1 flex-shrink-0 shadow-sm">
                <span className="material-icons text-sm">smart_toy</span>
              </div>
            )}
            
            <div 
              className={`py-3 px-4 max-w-[85%] ${
                message.type === 'user' 
                  ? 'chat-bubble-user' 
                  : message.isTyping 
                    ? 'bg-muted dark:bg-muted rounded-xl py-2' 
                    : 'chat-bubble-assistant'
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
                <p className={message.type === 'user' ? 'text-white' : 'text-foreground dark:text-foreground'}>
                  {message.content}
                </p>
              )}
            </div>
            
            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white ml-2 mt-1 flex-shrink-0 shadow-sm">
                <span className="material-icons text-sm">person</span>
              </div>
            )}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <span className="material-icons text-4xl mb-2">chat</span>
            <p>Start a conversation by typing a message or recording a voice note.</p>
          </div>
        )}
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;
