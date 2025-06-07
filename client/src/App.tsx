import { Routes, Route, useLocation } from 'react-router-dom';
import Home from "@/pages/home";
import StatsView from "@/pages/stats";
import AppHeader from "@/components/AppHeader";
import SetupWizard from './components/SetupWizard';
import { useState, useEffect } from "react";
import Welcome from "@/pages/welcome";

// Create a temporary user context for the demo
export interface User {
  id: number;
  username: string;
}

export const DEMO_USER = {
  id: 1,
  name: 'Demo User'
};

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const location = useLocation();
  
  // Check if setup is needed on mount
  useEffect(() => {
    const setupComplete = localStorage.getItem("setupComplete");
    setShowSetupWizard(setupComplete !== "true");
  }, []);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show header on welcome page
  const isWelcomePage = location.pathname === '/' || location.pathname === '/welcome';

  return (
    <div className="min-h-screen bg-background">
      {!isWelcomePage && <AppHeader />}
      {!isOnline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Offline Mode</p>
          <p>You are currently offline. Some features may be limited.</p>
        </div>
      )}
      <main className={`container mx-auto px-4 ${isWelcomePage ? '' : 'py-8'}`}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/stats" element={<StatsView />} />
          <Route path="/welcome" element={<Welcome />} />
        </Routes>
      </main>
      <SetupWizard isOpen={showSetupWizard} onClose={() => setShowSetupWizard(false)} />
    </div>
  );
}
