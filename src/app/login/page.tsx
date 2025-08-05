'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { JiraCredentials } from '@/lib/jiraApi'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [credentials, setCredentials] = useState<JiraCredentials>({
    domain: '',
    email: '',
    apiToken: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (field: keyof JiraCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const success = await login(credentials)
      
      if (success) {
        setSuccess('Successfully connected to Jira!')
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setError('Failed to connect to Jira. Please check your credentials.')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during authentication.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Connect to Jira
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your Jira credentials to access the worklog dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-gray-100/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Domain */}
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                Jira Domain
              </label>
              <div className="mt-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">https://</span>
                  </div>
                  <input
                    id="domain"
                    name="domain"
                    type="text"
                    required
                    value={credentials.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    className="pl-16 appearance-none block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-200"
                    placeholder="your-domain.atlassian.net"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Your Jira cloud domain (e.g., company.atlassian.net)
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-200"
                  placeholder="your-email@company.com"
                />
              </div>
            </div>

            {/* API Token */}
            <div>
              <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700">
                API Token
              </label>
              <div className="mt-1 relative">
                <input
                  id="apiToken"
                  name="apiToken"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={credentials.apiToken}
                  onChange={(e) => handleInputChange('apiToken', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-200"
                  placeholder="Enter your Jira API token"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Generate API token
                </a>
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{success}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Connecting...
                  </>
                ) : (
                  'Connect to Jira'
                )}
              </button>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Need help?</span>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-500 space-y-2">
              <p>
                <strong>To get your API token:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">Atlassian Account Settings</a></li>
                <li>Click &ldquo;Create API token&rdquo;</li>
                <li>Give it a label (e.g., &ldquo;Worklog Dashboard&rdquo;)</li>
                <li>Copy the token and paste it above</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 