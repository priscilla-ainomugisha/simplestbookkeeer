import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import OldHome from "@/pages/home";
import EnhancedHome from "@/pages/enhanced-home";
import { useState, useEffect } from "react";
import { SnapshotProvider } from "@/contexts/snapshot-context";

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
  const [useEnhancedMode, setUseEnhancedMode] = useState(true); // Set to true to enable the enhanced features by default
  
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
      <SnapshotProvider>
        {offlineMode && (
          <div className="fixed top-0 left-0 right-0 bg-black text-white p-2 text-center z-50 text-xs">
            You&apos;re offline. Data will be saved locally and synced when you reconnect.
          </div>
        )}
        
        <Switch>
          <Route path="/" component={useEnhancedMode ? EnhancedHome : Home} />
          <Route component={NotFound} />
        </Switch>
      </SnapshotProvider>
    </TooltipProvider>
  );
}

export default App;
