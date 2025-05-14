import { useState, useEffect, useRef } from 'react';
import AppHeader from '@/components/AppHeader';
import PageTabs from '@/components/PageTabs';
import QuickStats from '@/components/QuickStats';
import ChatContainer from '@/components/ChatContainer';
import InputFooter from '@/components/InputFooter';
import { useToast } from '@/hooks/use-toast';
import { useRecording } from '@/hooks/use-recording';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { processTextMessage, sendVoiceRecording } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'settings'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();
  const { isRecording, startRecording, stopRecording, audioBlob } = useRecording();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [todayStats, setTodayStats] = useState({ revenue: 0, expenses: 0, profit: 0 });
  
  // Load initial welcome message
  useEffect(() => {
    // Clear any existing messages first to avoid key conflicts
    setMessages([]);
    
    // Add welcome message with unique ID
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        content: 'Welcome back! Send me a voice note or text about your sales and expenses, and I\'ll help you keep track.',
        type: 'assistant',
        timestamp: new Date()
      }
    ]);
  }, []);

  // Fetch today's stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/transactions/today-stats'],
    enabled: true,
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    if (statsData) {
      setTodayStats(statsData);
    }
  }, [statsData]);

  // Process text message mutation
  const textMutation = useMutation({
    mutationFn: processTextMessage,
    onSuccess: (data) => {
      // Add the response to the chat
      setMessages(prev => [
        ...prev.filter(m => !m.isTyping),
        {
          id: Date.now().toString(),
          content: '',
          type: 'assistant',
          timestamp: new Date(),
          transactionData: data
        }
      ]);
      
      // Invalidate stats query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/today-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error processing message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Process voice recording mutation
  const voiceMutation = useMutation({
    mutationFn: sendVoiceRecording,
    onSuccess: (data) => {
      // Add the response to the chat
      setMessages(prev => [
        ...prev.filter(m => !m.isTyping),
        {
          id: Date.now().toString(),
          content: '',
          type: 'assistant',
          timestamp: new Date(),
          transactionData: data
        }
      ]);
      
      // Invalidate stats query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/today-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error processing voice note",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle sending a text message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add the user message to the chat
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Add typing indicator with unique ID
    setMessages(prev => [
      ...prev,
      {
        id: `typing-${Date.now()}`,
        content: '',
        type: 'assistant',
        timestamp: new Date(),
        isTyping: true
      }
    ]);
    
    // Process the message
    textMutation.mutate(inputValue);
    
    // Clear the input
    setInputValue('');
  };

  // Handle recording toggle
  const handleToggleRecording = async () => {
    if (isRecording) {
      const audioData = await stopRecording();
      if (audioData) {
        // Add the voice note to the chat
        const newMessage: Message = {
          id: Date.now().toString(),
          content: 'Voice note',
          type: 'user',
          timestamp: new Date(),
          isVoiceNote: true,
          duration: audioData.duration
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Add typing indicator with unique ID
        setMessages(prev => [
          ...prev,
          {
            id: `typing-voice-${Date.now()}`,
            content: '',
            type: 'assistant',
            timestamp: new Date(),
            isTyping: true
          }
        ]);
        
        // Send the recording to the server
        voiceMutation.mutate(audioData.blob);
      }
    } else {
      startRecording();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="font-sans bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 min-h-screen">
      <AppHeader />
      
      <main className="container mx-auto max-w-md pt-20 pb-32 px-4">
        <PageTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === 'chat' && (
          <>
            <QuickStats stats={todayStats} />
            <ChatContainer 
              messages={messages} 
              ref={chatContainerRef} 
            />
          </>
        )}
        
        {activeTab === 'summary' && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 mt-4">
            <h2 className="text-lg font-medium mb-4">Summary View</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              This tab will show transaction summaries and reports.
            </p>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 mt-4">
            <h2 className="text-lg font-medium mb-4">Settings</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Settings will be available here.
            </p>
          </div>
        )}
      </main>
      
      <InputFooter 
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
