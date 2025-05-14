import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEMO_USER } from "@/App";
import { Transaction } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  transaction?: Transaction;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch transactions to populate chat history
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${DEMO_USER.id}`],
  });

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content: "Welcome to The Simplest Bookkeeper! 👋\n\nSend me a voice note or message about your sales and expenses. For example:\n\n\"I sold goods for 5000 today\"\n\"Spent 200 on transport\"",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Convert transactions to chat messages when transactions data changes
  useEffect(() => {
    if (transactions.length > 0) {
      // Add only new transactions that aren't already in chat
      const existingTransactionIds = messages
        .filter(msg => msg.transaction)
        .map(msg => msg.transaction?.id);

      const newTransactions = transactions
        .filter(t => !existingTransactionIds.includes(t.id))
        .slice(0, 5); // Limit to 5 most recent to avoid cluttering

      if (newTransactions.length > 0) {
        const newMessages: ChatMessage[] = [];
        
        newTransactions.forEach(transaction => {
          // Add user message
          newMessages.push({
            id: `user-${transaction.id}`,
            type: "user",
            content: transaction.transcription || transaction.rawInput || `Recorded a ${transaction.type}`,
            timestamp: new Date(transaction.createdAt),
            transaction
          });
          
          // Add assistant confirmation message
          newMessages.push({
            id: `assistant-${transaction.id}`,
            type: "assistant",
            content: "",  // Will be shown using the formatted transaction card
            timestamp: new Date(transaction.createdAt),
            transaction
          });
        });
        
        // Combine with existing messages, maintaining chronological order
        setMessages(prev => 
          [...prev, ...newMessages].sort((a, b) => 
            a.timestamp.getTime() - b.timestamp.getTime()
          )
        );
      }
    }
  }, [transactions, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle confirmation of transaction
  const handleConfirmTransaction = (transactionId: number) => {
    // In a real app, this would update the transaction status
    // For now, we'll just show a confirmation
    alert(`Transaction #${transactionId} confirmed!`);
    
    // Refresh the transactions data
    queryClient.invalidateQueries({ queryKey: [`/api/transactions/${DEMO_USER.id}`] });
  };

  // Handle edit of transaction
  const handleEditTransaction = (transactionId: number) => {
    // In a real app, this would open an edit form
    alert(`Editing transaction #${transactionId} - this would open an edit form in a real app`);
  };

  return (
    <div className="p-4 flex flex-col min-h-full">
      {messages.map((message) => (
        <div key={message.id} className={`chat-bubble ${message.type === "user" ? "chat-bubble-user" : "chat-bubble-assistant"} p-3`}>
          {message.type === "user" ? (
            // User message
            <>
              <p>{message.content}</p>
              <p className="text-xs text-gray-600 text-right mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </>
          ) : message.transaction ? (
            // Assistant message with transaction
            <>
              <p className={`font-medium ${message.transaction.type === "income" ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`}>
                {message.transaction.type === "income" ? "✅ Sale Recorded" : "💸 Expense Recorded"}
              </p>
              <div className="bg-gray-100 rounded p-2 mt-2">
                <p><strong>Amount:</strong> {formatCurrency(message.transaction.amount)}</p>
                <p><strong>Category:</strong> {message.transaction.category}</p>
                <p><strong>Date:</strong> {formatDate(message.transaction.createdAt)}</p>
              </div>
              <div className="mt-2 text-sm">
                <p>Is this correct?</p>
                <div className="flex mt-1 space-x-2">
                  <Button 
                    size="sm"
                    className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))/80] text-white rounded-full text-xs px-3 py-1 h-auto"
                    onClick={() => handleConfirmTransaction(message.transaction!.id)}
                  >
                    Yes
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full text-xs px-3 py-1 h-auto"
                    onClick={() => handleEditTransaction(message.transaction!.id)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Regular assistant message
            <p>{message.content}</p>
          )}
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
