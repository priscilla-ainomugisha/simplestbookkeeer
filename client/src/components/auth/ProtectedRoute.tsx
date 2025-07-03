import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { useEffect, useState } from 'react'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (!loading) {
      setIsInitialLoad(false)
    }
  }, [loading])

  console.log('ProtectedRoute rendered', { 
    user, 
    loading, 
    isInitialLoad,
    currentPath: location.pathname,
    hasCompletedOnboarding: user?.has_completed_onboarding 
  });

  // Show loading spinner only during initial load
  if (loading && isInitialLoad) {
    console.log('Auth is loading, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    console.log('No user found, redirecting to signin');
    // Save the attempted URL to redirect back after login
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  // If user has completed onboarding and tries to access onboarding page
  if (user.has_completed_onboarding && location.pathname === '/onboarding') {
    console.log('User has completed onboarding, redirecting to home');
    return <Navigate to="/home" replace />
  }

  // If user hasn't completed onboarding and isn't on the onboarding page
  if (!user.has_completed_onboarding && location.pathname !== '/onboarding') {
    console.log('User has not completed onboarding, redirecting to onboarding');
    return <Navigate to="/onboarding" replace />
  }

  console.log('Rendering protected route content');
  return <>{children}</>
} 