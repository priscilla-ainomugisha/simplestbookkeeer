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
      <div ref={ref} className="chat-container overflow-y-auto max-h-[calc(100vh-280px)] px-1 py-2 relative">
        {/* Retro background pattern */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>
        
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`flex mb-5 ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {message.type === 'assistant' && !message.isTyping && (
              <div className="w-8 h-8 bg-primary flex items-center justify-center text-white mr-2 mt-1 flex-shrink-0 border-2 border-black" 
                   style={{ boxShadow: "2px 2px 0 #000", transform: "rotate(-3deg)" }}>
                <span className="material-icons text-sm">smart_toy</span>
              </div>
            )}
            
            <div 
              className={`max-w-[85%] relative z-10 ${
                message.type === 'user' 
                  ? 'chat-bubble-user' 
                  : message.isTyping 
                    ? 'bg-muted dark:bg-muted border-2 border-primary py-2 px-4' 
                    : 'chat-bubble-assistant'
              }`}
            >
              {message.isTyping ? (
                <div className="typing-indicator blink">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              ) : message.isVoiceNote ? (
                <div className="font-bold uppercase">
                  <div className="flex items-center border-b-2 border-white pb-1 mb-2">
                    <span className="material-icons mr-2">mic</span>
                    <span>Voice Note ({formatDuration(message.duration)})</span>
                  </div>
                  <div>{message.content}</div>
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
              <div className="w-8 h-8 bg-secondary flex items-center justify-center text-white ml-2 mt-1 flex-shrink-0 border-2 border-black"
                   style={{ boxShadow: "2px 2px 0 #000", transform: "rotate(3deg)" }}>
                <span className="material-icons text-sm">person</span>
              </div>
            )}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 relative z-10">
            <div className="w-20 h-20 border-4 border-primary bg-white flex items-center justify-center mb-4" 
                style={{ transform: "rotate(-5deg)", boxShadow: "5px 5px 0 #000" }}>
              <span className="material-icons text-primary text-3xl">record_voice_over</span>
            </div>
            
            <h3 className="text-xl font-extrabold uppercase mb-2 tracking-wide">The Simplest Bookkeeper</h3>
            
            <div className="bg-white border-4 border-primary max-w-xs mb-4 p-3" 
                style={{ boxShadow: "5px 5px 0 #000" }}>
              <p className="text-foreground mb-2">
                Record your sales and expenses by voice or text. 
              </p>
              <p className="text-secondary font-bold">
                Get started by trying these:
              </p>
            </div>
            
            <div className="text-sm bg-secondary text-white max-w-xs p-0 border-2 border-black"
                style={{ boxShadow: "4px 4px 0 #000" }}>
              <p className="font-bold uppercase tracking-wide py-1 px-3 bg-primary text-white border-b-2 border-black">
                Example Commands:
              </p>
              <p className="py-2 px-3 border-b border-white/20 font-medium">
                "I sold products for $1200 today"
              </p>
              <p className="py-2 px-3 font-medium">
                "I spent $45 on office supplies"
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;
