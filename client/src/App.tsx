import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { useState, useEffect } from "react";

// Create a temporary user context for the demo
export interface User {
  id: number;
  username: string;
}

export const DEMO_USER: User = {
  id: 1,
  username: "demo_user"
};

function App() {
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <TooltipProvider>
      {offlineMode && (
        <div className="fixed top-0 left-0 right-0 bg-expense text-white p-2 text-center z-50">
          You&apos;re offline. Data will be saved locally and synced when you reconnect.
        </div>
      )}
      
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
