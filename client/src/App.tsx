import { Routes, Route, useLocation } from 'react-router-dom';
import Home from "@/pages/home";
import StatsView from "@/pages/stats";
import AppHeader from "@/components/AppHeader";
import SetupWizard from './components/SetupWizard';
import { useState, useEffect } from "react";
import Welcome from "@/pages/welcome";
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SignIn } from './components/auth/SignIn';
import Onboarding from '@/pages/Onboarding';
import SignUp from '@/pages/signup';

// Create a temporary user context for the demo
export interface User {
  id: number;
  username: string;
}

// Define demo user as a constant
export const DEMO_USER: User = {
  id: 1,
  username: 'demo_user'
};

export default function App() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isWelcomePage = location.pathname === '/' || location.pathname === '/welcome';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/auth/callback';

  console.log('App component rendered', {
    currentPath: location.pathname,
    isWelcomePage,
    isAuthPage,
    isOnline
  });

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

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        {!isWelcomePage && !isAuthPage && <AppHeader />}
        {!isOnline && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p className="font-bold">Offline Mode</p>
            <p>You are currently offline. Some features may be limited.</p>
          </div>
        )}
        <main className={`container mx-auto px-4 ${isWelcomePage || isAuthPage ? '' : 'py-8'}`}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/auth/callback" element={<SignIn />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <StatsView />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
