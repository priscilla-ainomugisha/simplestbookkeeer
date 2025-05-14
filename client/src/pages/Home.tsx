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
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Track if voice processing is available
  
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
      // Remove typing indicator
      setMessages(prev => prev.filter(m => !m.isTyping));
      
      // Add a friendly error message as an assistant message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "I'm having trouble understanding your message. Please try again with a clearer format like 'I sold items for 500' or 'spent 200 on transport'.",
          type: 'assistant',
          timestamp: new Date()
        }
      ]);
      
      // Also show a toast
      toast({
        title: "Couldn't process message",
        description: "Please try a clearer format for your transaction.",
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
      // Remove typing indicator
      setMessages(prev => prev.filter(m => !m.isTyping));
      
      // Add a friendly error message as an assistant message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "Sorry, I couldn't process your voice note right now. This might be due to service limits or connection issues. Please try sending your transaction as a text message instead.",
          type: 'assistant',
          timestamp: new Date()
        }
      ]);
      
      // Disable voice recording after an error
      setVoiceEnabled(false);
      
      // Also show a toast
      toast({
        title: "Voice processing unavailable",
        description: "Please try sending your transaction as a text message instead.",
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
    <div className="font-sans bg-background text-foreground min-h-screen dark:crt-effect">
      <AppHeader />
      
      {/* Retro background patterns */}
      <div className="absolute top-0 left-0 right-0 h-full w-full bg-grid opacity-20 pointer-events-none"></div>
      <div className="absolute top-16 left-0 right-0 h-8 bg-accent pointer-events-none opacity-10"></div>
      
      <main className="container mx-auto max-w-md pt-20 pb-32 px-4 relative">
        <PageTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === 'chat' && (
          <>
            <QuickStats stats={todayStats} />
            <div className="bg-white dark:bg-card/40 mb-4 border-4 border-primary shadow-md"
                 style={{ boxShadow: "6px 6px 0 rgba(0,0,0,0.2)" }}>
              <ChatContainer 
                messages={messages} 
                ref={chatContainerRef} 
              />
            </div>
          </>
        )}
        
        {activeTab === 'summary' && (
          <div className="bg-white border-4 border-primary p-4 mt-4 animate-in"
               style={{ boxShadow: "6px 6px 0 rgba(0,0,0,0.2)" }}>
            {/* Retro window header */}
            <div className="bg-primary text-white px-3 py-1 -mx-4 -mt-4 mb-4 flex items-center justify-between border-b-2 border-black uppercase">
              <h2 className="font-bold text-sm tracking-wide flex items-center">
                <span className="material-icons text-base mr-2">bar_chart</span>
                Summary View
              </h2>
              <div className="flex">
                <div className="w-3 h-3 bg-yellow-400 border border-black mx-0.5"></div>
                <div className="w-3 h-3 bg-green-400 border border-black mx-0.5"></div>
                <div className="w-3 h-3 bg-red-400 border border-black mx-0.5"></div>
              </div>
            </div>
            
            <div className="border-2 border-primary p-3 bg-white">
              <p className="font-medium mb-3">
                This tab will show transaction summaries and reports. Track your business performance over time with detailed analytics.
              </p>
            </div>
            
            <div className="mt-4 border-2 border-dashed border-secondary p-4 flex flex-col items-center justify-center bg-dots">
              <div className="w-16 h-16 bg-secondary flex items-center justify-center border-2 border-black mb-2"
                   style={{ transform: "rotate(-5deg)" }}>
                <span className="material-icons text-4xl text-white">rocket_launch</span>
              </div>
              <p className="font-bold uppercase text-center text-secondary">Coming soon in the next update!</p>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="bg-white border-4 border-primary p-4 mt-4 animate-in"
               style={{ boxShadow: "6px 6px 0 rgba(0,0,0,0.2)" }}>
            {/* Retro window header */}
            <div className="bg-primary text-white px-3 py-1 -mx-4 -mt-4 mb-4 flex items-center justify-between border-b-2 border-black uppercase">
              <h2 className="font-bold text-sm tracking-wide flex items-center">
                <span className="material-icons text-base mr-2">settings</span>
                Settings
              </h2>
              <div className="flex">
                <div className="w-3 h-3 bg-yellow-400 border border-black mx-0.5"></div>
                <div className="w-3 h-3 bg-green-400 border border-black mx-0.5"></div>
                <div className="w-3 h-3 bg-red-400 border border-black mx-0.5"></div>
              </div>
            </div>
            
            <div className="border-2 border-primary p-3 bg-white">
              <p className="font-medium mb-3">
                Configure your account settings, notification preferences, and customize your bookkeeping experience.
              </p>
            </div>
            
            <div className="mt-4 border-2 border-dashed border-secondary p-4 flex flex-col items-center justify-center bg-dots">
              <div className="w-16 h-16 bg-secondary flex items-center justify-center border-2 border-black mb-2"
                   style={{ transform: "rotate(5deg)" }}>
                <span className="material-icons text-4xl text-white">engineering</span>
              </div>
              <p className="font-bold uppercase text-center text-secondary">Settings panel coming soon!</p>
            </div>
          </div>
        )}
      </main>
      
      {/* Dark mode scanline effect */}
      <div className="dark:block hidden">
        <div className="scanline"></div>
      </div>
      
      <InputFooter 
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        voiceEnabled={voiceEnabled}
      />
    </div>
  );
}
