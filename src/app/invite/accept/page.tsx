'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

export default function InviteAcceptPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  const token = searchParams.get('token')
  const error = searchParams.get('error')

  useEffect(() => {
    // Handle OAuth callback errors
    if (error) {
      switch (error) {
        case 'invalid_state':
          setStatus('invalid')
          setMessage('Invalid OAuth state. Please try again or contact your manager.')
          break
        case 'missing_invitation':
          setStatus('invalid')
          setMessage('Missing invitation token. Please use the link from your invitation email.')
          break
        case 'token_exchange_failed':
          setStatus('invalid')
          setMessage('Failed to exchange authorization code. Please try again.')
          break
        case 'profile_fetch_failed':
          setStatus('invalid')
          setMessage('Failed to fetch your Atlassian profile. Please try again.')
          break
        case 'invitation_not_found':
          setStatus('invalid')
          setMessage('Invitation not found. Please contact your manager for a new invitation.')
          break
        case 'invitation_expired':
          setStatus('expired')
          setMessage('This invitation has expired. Please contact your manager for a new invitation.')
          break
        case 'callback_failed':
          setStatus('invalid')
          setMessage('OAuth callback failed. Please try again or contact support.')
          break
        default:
          setStatus('invalid')
          setMessage('An unknown error occurred. Please try again or contact support.')
      }
      return
    }

    if (!token) {
      setStatus('invalid')
      setMessage('Invalid invitation link. Please contact your manager for a new invitation.')
      return
    }

    // Validate the invitation token
    validateInvitationToken(token)
  }, [token, error])

  const validateInvitationToken = async (token: string) => {
    try {
      const response = await fetch(`/api/invite/validate?token=${token}`)
      const data = await response.json()

      if (data.success) {
        setStatus('valid')
        setMessage('Invitation is valid! Click the button below to sign in with your Atlassian account.')
      } else {
        if (data.message?.includes('expired')) {
          setStatus('expired')
          setMessage('This invitation has expired. Please contact your manager for a new invitation.')
        } else {
          setStatus('invalid')
          setMessage(data.message || 'Invalid invitation. Please contact your manager.')
        }
      }
    } catch (error) {
      console.error('Error validating invitation:', error)
      setStatus('invalid')
      setMessage('Failed to validate invitation. Please try again or contact your manager.')
    }
  }

  const handleAtlassianSignIn = async () => {
    if (!token) return
    
    setIsRedirecting(true)
    try {
      // Redirect to backend OAuth login endpoint
      window.location.href = `/api/auth/atlassian/login?token=${token}`
    } catch (error) {
      console.error('Error initiating Atlassian sign-in:', error)
      setIsRedirecting(false)
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating Invitation</h2>
            <p className="text-gray-600">Please wait while we verify your invitation...</p>
          </div>
        )

      case 'valid':
        return (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Team!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <button
              onClick={handleAtlassianSignIn}
              disabled={isRedirecting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to Atlassian...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Sign in with Atlassian
                </>
              )}
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              You&apos;ll be redirected to Atlassian to complete your authentication.
            </p>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Expired</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        )

      case 'invalid':
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Developer Invitation</h1>
            <p className="text-gray-600 mt-2">Complete your account setup</p>
          </div>
          
          {renderContent()}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Contact your manager or{' '}
            <a href="mailto:support@company.com" className="text-blue-600 hover:text-blue-500">
              support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
