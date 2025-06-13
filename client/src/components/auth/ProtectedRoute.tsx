import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const currentPath = window.location.pathname

  console.log('ProtectedRoute rendered', { user, loading, currentPath })

  useEffect(() => {
    if (loading) {
      console.log('Auth is loading, showing spinner')
      return
    }

    if (!user) {
      console.log('No user found, redirecting to welcome')
      navigate('/welcome')
      return
    }

    const checkOnboardingStatus = async () => {
      try {
        console.log('Checking onboarding status for user:', user.id)
        const { data, error } = await supabase
          .from('users')
          .select('has_completed_onboarding')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error checking onboarding status:', error)
          return
        }

        console.log('Onboarding status check result:', data)
        setHasCompletedOnboarding(data?.has_completed_onboarding || false)
        setIsCheckingOnboarding(false)

        // Only redirect if we're not already on the onboarding page
        if (!data?.has_completed_onboarding && currentPath !== '/onboarding') {
          console.log('User has not completed onboarding, redirecting to onboarding')
          navigate('/onboarding')
        } else if (data?.has_completed_onboarding && currentPath === '/onboarding') {
          console.log('User has completed onboarding, redirecting to home')
          navigate('/home')
        }
      } catch (error) {
        console.error('Error in onboarding check:', error)
        setIsCheckingOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [user, loading, navigate, currentPath])

  if (loading || isCheckingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  console.log('Rendering protected route content')
  return <>{children}</>
} 