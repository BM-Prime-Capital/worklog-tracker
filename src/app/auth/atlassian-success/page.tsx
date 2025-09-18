'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'

function AtlassianSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  
  const userId = searchParams.get('userId')
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const role = searchParams.get('role')

  useEffect(() => {
    if (userId && email) {
      // Try to sign in the user automatically
      handleAutoSignIn()
    }
  }, [userId, email])

  const handleAutoSignIn = async () => {
    if (!userId) return
    
    setIsSigningIn(true)
    try {
      // Call our custom session creation API to get credentials
      const response = await fetch('/api/auth/atlassian/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.success && data.credentials) {
        console.log('Got credentials, signing in with NextAuth')
        
        // Use NextAuth's signIn with the credentials
        const result = await signIn('credentials', {
          email: data.credentials.email,
          password: data.credentials.password,
          redirect: false,
        })

        if (result?.ok) {
          console.log('NextAuth sign-in successful')
          setIsRedirecting(true)
          router.push('/dashboard/developer')
        } else {
          console.error('NextAuth sign-in failed:', result?.error)
          setError('Please use the button below to access your dashboard')
          setIsSigningIn(false)
        }
      } else {
        console.error('Session creation failed:', data.error)
        setError('Please use the button below to access your dashboard')
        setIsSigningIn(false)
      }
    } catch (err) {
      console.error('Auto sign-in failed:', err)
      setError('Please use the button below to access your dashboard')
      setIsSigningIn(false)
    }
  }

  const handleManualRedirect = async () => {
    if (!userId) {
      router.push('/dashboard/developer')
      return
    }
    
    setIsSigningIn(true)
    try {
      // Call our custom session creation API to get credentials
      const response = await fetch('/api/auth/atlassian/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.success && data.credentials) {
        console.log('Got credentials, signing in with NextAuth')
        
        // Use NextAuth's signIn with the credentials
        const result = await signIn('credentials', {
          email: data.credentials.email,
          password: data.credentials.password,
          redirect: false,
        })

        if (result?.ok) {
          console.log('NextAuth sign-in successful')
          setIsRedirecting(true)
          router.push('/dashboard/developer')
        } else {
          console.error('NextAuth sign-in failed:', result?.error)
          setError('Failed to sign in. Please try again.')
          setIsSigningIn(false)
        }
      } else {
        console.error('Session creation failed:', data.error)
        setError('Failed to create session. Please try again.')
        setIsSigningIn(false)
      }
    } catch (err) {
      console.error('Manual sign-in failed:', err)
      setError('Failed to sign in. Please try again.')
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Atlassian Authentication Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Your account has been successfully linked with Atlassian. 
              {name && <><br />Welcome, {name}!</>}
            </p>
            
            {isSigningIn ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-600">Setting up your session...</span>
              </div>
            ) : isRedirecting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-600">Redirecting to dashboard...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleManualRedirect}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <ExternalLink className="h-4 w-4" />
                  Go to Dashboard
                </button>
                
                {error && (
                  <div className="flex items-center justify-center text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                )}
              </div>
            )}
            
            {!error && (
              <p className="text-sm text-gray-500 mt-4">
                {isSigningIn ? 'Setting up your session...' : 'You can now access your developer dashboard.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AtlassianSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Loading...
              </h1>
              <p className="text-gray-600">
                Setting up your authentication...
              </p>
            </div>
          </div>
        </div>
      </div>
    }>
      <AtlassianSuccessContent />
    </Suspense>
  )
}
