import { useState, useRef, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Transaction as SnapshotTransaction } from "@/hooks/use-snapshot";
import { parseTransaction } from "@/lib/transaction-parser";
import TransactionInput from "@/components/transaction-input";
import { useSnapshotContext } from "@/contexts/snapshot-context";
import SetupWizard from "@/components/setup-wizard";

interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  transaction?: SnapshotTransaction;
}

export default function EnhancedChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { isSetupComplete, currentSnapshot, addTransaction, loading } = useSnapshotContext();

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial welcome message based on setup status
  useEffect(() => {
    if (loading) return;

    if (!isSetupComplete) {
      // Setup not complete - will be handled by the setup wizard
      return;
    }

    // Setup is complete, show welcome with current balance
    const welcomeMessages: ChatMessage[] = [];
    
    if (currentSnapshot) {
      // Add today's date and opening balance message
      welcomeMessages.push({
        id: "date-header",
        type: "system",
        content: `${formatDate(new Date())} - DAILY RECORDS`,
        timestamp: new Date(),
      });
      
      welcomeMessages.push({
        id: "opening-balance",
        type: "assistant",
        content: `Opening Balance: ${formatCurrency(currentSnapshot.opening.cash)}\n\nSend me your transactions for today and I'll update your books in real-time.`,
        timestamp: new Date(),
      });
    } else {
      // Fallback welcome message
      welcomeMessages.push({
        id: "welcome",
        type: "assistant",
        content: "THE SIMPLEST BOOKKEEPER\n\nSend a message about your financial transactions:\n\n• Sold goods for 5000\n• Spent 200 on transport\n• Borrowed 1000 from James",
        timestamp: new Date(),
      });
    }
    
    setMessages(welcomeMessages);
  }, [isSetupComplete, currentSnapshot, loading]);

  // Process a new message from the user
  const processMessage = (text: string) => {
    // Add user message
    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      type: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Parse the transaction from the message
    const parsedTransaction = parseTransaction(text);

    if (parsedTransaction) {
      // Add the transaction to the current snapshot
      const updatedSnapshot = addTransaction(parsedTransaction);
      
      // Create response based on transaction type
      let responseContent = '';
      
      switch (parsedTransaction.type) {
        case 'sale':
          responseContent = `✓ Sale recorded: ${formatCurrency(parsedTransaction.amount)}`;
          if (parsedTransaction.item) {
            responseContent += ` for ${parsedTransaction.item}`;
          }
          responseContent += `\n\nUpdated balance: ${formatCurrency(updatedSnapshot?.closing.cash || 0)}`;
          break;
        case 'expense':
          responseContent = `✓ Expense recorded: ${formatCurrency(parsedTransaction.amount)}`;
          if (parsedTransaction.category) {
            responseContent += ` for ${parsedTransaction.category}`;
          }
          responseContent += `\n\nUpdated balance: ${formatCurrency(updatedSnapshot?.closing.cash || 0)}`;
          break;
        case 'loan':
          responseContent = `✓ Loan recorded: ${formatCurrency(parsedTransaction.amount)}`;
          if (parsedTransaction.item) {
            responseContent += ` from ${parsedTransaction.item}`;
          }
          responseContent += `\n\nUpdated balance: ${formatCurrency(updatedSnapshot?.closing.cash || 0)}`;
          responseContent += `\nTotal liabilities: ${formatCurrency(updatedSnapshot?.closing.liabilities || 0)}`;
          break;
        case 'inventory':
          responseContent = `✓ Inventory purchase recorded: ${formatCurrency(parsedTransaction.amount)}`;
          if (parsedTransaction.item) {
            responseContent += ` for ${parsedTransaction.item}`;
          }
          responseContent += `\n\nUpdated cash balance: ${formatCurrency(updatedSnapshot?.closing.cash || 0)}`;
          responseContent += `\nTotal inventory value: ${formatCurrency(updatedSnapshot?.closing.inventory || 0)}`;
          break;
        case 'capital':
          responseContent = `✓ Capital contribution recorded: ${formatCurrency(parsedTransaction.amount)}`;
          responseContent += `\n\nUpdated balance: ${formatCurrency(updatedSnapshot?.closing.cash || 0)}`;
          responseContent += `\nTotal equity: ${formatCurrency(updatedSnapshot?.closing.equity || 0)}`;
          break;
      }
      
      // Add the assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: responseContent,
        timestamp: new Date(),
        transaction: parsedTransaction as any,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } else {
      // Could not parse a transaction
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: "I couldn't understand that transaction. Please try again with a message like:\n\n• Sold goods for 5000\n• Spent 200 on transport\n• Borrowed 1000 from James",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

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
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto pb-20">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`
              ${message.type === "user" ? "chat-bubble-user" : message.type === "assistant" ? "chat-bubble-assistant" : "text-center text-xs text-gray-500 my-4 uppercase tracking-wider"}
              ${message.type !== "system" ? "chat-bubble p-4 mb-4" : ""}
            `}
          >
            {message.type === "user" ? (
              // User message - minimalist design
              <>
                <p className="text-sm">{message.content}</p>
                <p className="text-[10px] text-gray-400 text-right mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </>
            ) : message.type === "system" ? (
              // System message (date headers, etc.)
              <div className="border-t border-gray-200 pt-2">{message.content}</div>
            ) : (
              // Assistant message - minimalist design
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <TransactionInput onSendMessage={processMessage} />
    </div>
  );
}