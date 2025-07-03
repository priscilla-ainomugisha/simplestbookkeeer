import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import InputArea from "@/components/input-area";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  transaction?: Transaction;
}

export default function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch transactions to populate chat history
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${user?.id}`],
    enabled: !!user?.id,
  });

  // Initial welcome message - minimalist style
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content: "THE SIMPLEST BOOKKEEPER\n\nSend a message about your financial transactions:\n\n• I sold goods for 5000\n• Spent 200 on transport\n• Paid 80 for food",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Convert transactions to chat messages when transactions data changes
  useEffect(() => {
    if (transactions.length > 0) {
      setMessages(prev => {
        // Get all transaction IDs already in chat
        const existingTransactionIds = prev
          .filter(msg => msg.transaction)
          .map(msg => msg.transaction?.id);

        // Only add new transactions not already in chat
        const newMessages = transactions
          .filter(t => !existingTransactionIds.includes(t.id))
          .flatMap(transaction => ([
            {
              id: `user-${transaction.id}`,
              type: "user" as "user",
              content: transaction.description || transaction.transcription || transaction.rawInput || (transaction.type ? `Recorded a ${transaction.type}` : "Recorded a transaction"),
              timestamp: transaction.createdAt ? new Date(transaction.createdAt) : new Date(),
              transaction
            },
            {
              id: `assistant-${transaction.id}`,
              type: "assistant" as "assistant",
              content: "",
              timestamp: transaction.createdAt ? new Date(transaction.createdAt) : new Date(),
              transaction
            }
          ]));

        // Merge old and new, sort by timestamp
        return [...prev, ...newMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
    }
  }, [transactions]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle confirmation of transaction
  const handleConfirmTransaction = (transactionId: string) => {
    // In a real app, this would update the transaction status
    // For now, we'll just show a confirmation
    alert(`Transaction #${transactionId} confirmed!`);
    
    // Refresh the transactions data
    queryClient.invalidateQueries({ queryKey: [`/api/transactions/${user?.id}`] });
  };

  // Handle edit of transaction
  const handleEditTransaction = (transactionId: string) => {
    // In a real app, this would open an edit form
    alert(`Editing transaction #${transactionId} - this would open an edit form in a real app`);
  };

  // Add this handler to allow adding a message from input area
  const handleAddUserMessage = (content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `user-input-${Date.now()}`,
        type: "user",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 flex flex-col min-h-full">
      {messages.map((message) => (
        <div key={message.id} className={`chat-bubble ${message.type === "user" ? "chat-bubble-user" : "chat-bubble-assistant"} p-4 mb-4`}>
          {message.type === "user" ? (
            // User message - minimalist design
            <>
              <p className="text-sm">{message.content}</p>
              <p className="text-[10px] text-gray-400 text-right mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </>
          ) : message.transaction ? (
            // Assistant message with transaction - minimalist design
            <>
              <p className="text-sm font-medium uppercase tracking-wide mb-3">
                {message.transaction.type === "sale" ? "Transaction: Income" : "Transaction: Expense"}
              </p>
              <div className="border border-gray-200 p-3 my-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Amount</span>
                  <span className="text-md font-semibold">{formatCurrency(message.transaction.amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-sm">{message.transaction.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Date</span>
                  <span className="text-sm">{formatDate(message.transaction.createdAt) || "Unknown date"}</span>
                </div>
              </div>
              <div className="flex justify-end mt-1 space-x-3">
                <Button 
                  size="sm"
                  className="bg-black hover:bg-gray-900 text-white text-xs px-4 py-1 h-7"
                  onClick={() => handleConfirmTransaction(message.transaction!.id)}
                >
                  Confirm
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-100 text-gray-800 text-xs px-4 py-1 h-7"
                  onClick={() => handleEditTransaction(message.transaction!.id)}
                >
                  Edit
                </Button>
              </div>
            </>
          ) : (
            // Regular assistant message - minimalist design
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      ))}
      <div ref={chatEndRef} />
      {/* Add the input area and pass the handler */}
      <InputArea userId={user.id} onSendMessage={handleAddUserMessage} />
    </div>
  );
}
