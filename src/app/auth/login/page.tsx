'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, Building2, Users, BarChart3, ExternalLink } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { loginSchema } from '@/lib/validation'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedRole, setSelectedRole] = useState<'manager' | 'developer'>('manager')
  const [isAtlassianLoading, setIsAtlassianLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as { organizationId?: string; role: string }
      
      // ADMIN role goes directly to dashboard - they manage the platform, not Jira projects
      if (user.role === 'ADMIN') {
        router.push('/dashboard/admin')
      }
      // Only MANAGER role needs to have an organization
      // DEVELOPER role gets organization through invitation, so they don't need onboarding
      else if (!user.organizationId && user.role === 'MANAGER') {
        router.push('/onboarding/organization')
      } else {
        const dashboardPath = `/dashboard/${user.role.toLowerCase()}`
        router.push(dashboardPath)
      }
    }
  }, [status, session, router])

  // Handle URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.get('atlassian_success') === 'true') {
      // Show success message - the OAuth flow should have already created the session
      setErrors({ 
        submit: 'Successfully authenticated with Atlassian! Redirecting to dashboard...' 
      })
      
      // The session should already be created by the OAuth callback
      // Just redirect to dashboard - the middleware will handle the rest
      setTimeout(() => {
        router.push('/dashboard/developer')
      }, 2000)
    }
    
    if (urlParams.get('message') === 'invitation_required') {
      setErrors({ 
        submit: 'Developers need to be invited by their manager to access the system. Please check your email for an invitation link.' 
      })
    }
    
    if (urlParams.get('error') === 'invalid_user') {
      setErrors({ 
        submit: 'Invalid user. Please try the invitation process again.' 
      })
    }
    
    if (urlParams.get('error') === 'user_not_found') {
      setErrors({ 
        submit: 'User not found. Please contact your manager for a new invitation.' 
      })
    }
    
    if (urlParams.get('error') === 'session_creation_failed') {
      setErrors({ 
        submit: 'Failed to create session. Please try again or contact support.' 
      })
    }
    
    if (urlParams.get('error') === 'user_not_invited') {
      setErrors({ 
        submit: 'You must be invited by your manager to access the system. Please contact your manager for an invitation.' 
      })
    }
    
    if (urlParams.get('error') === 'invalid_user_status') {
      setErrors({ 
        submit: 'Invalid user status. Please contact support.' 
      })
    }
    
    if (urlParams.get('error') === 'user_update_failed') {
      setErrors({ 
        submit: 'Failed to update user account. Please try again or contact support.' 
      })
    }
    
    if (urlParams.get('error') === 'callback_failed') {
      setErrors({ 
        submit: 'Authentication failed. Please try again.' 
      })
    }
  }, [router])

  // Show loading while redirecting authenticated users
  if (status === 'authenticated' && session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    try {
      loginSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: unknown) {
      const newErrors: Record<string, string> = {}
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> }
        zodError.issues.forEach((err) => {
          newErrors[err.path[0]] = err.message
        })
      }
      setErrors(newErrors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setErrors({ submit: result.error })
      } else if (result?.ok) {
        // Redirect will be handled by the middleware or session callback
        router.push('/dashboard')
      }
    } catch {
      setErrors({ submit: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAtlassianSignIn = async () => {
    setIsAtlassianLoading(true)
    setErrors({})

    try {
      // For developers, redirect to Atlassian OAuth login
      // The backend will handle validation of invitation status
      window.location.href = '/api/auth/atlassian/login'
    } catch (error) {
      console.error('Atlassian sign in error:', error)
      setErrors({ submit: 'Failed to sign in with Atlassian. Please try again.' })
    } finally {
      setIsAtlassianLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Brand & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12 flex-col justify-between">
        {/* Logo & Brand */}
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Worklog Tracker</h1>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Internal Project Management</h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Streamline your team&apos;s work tracking with Jira integration, 
            comprehensive reporting, and performance analytics.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Team Management</h3>
              <p className="text-blue-100">Centralized user management and role assignment</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Performance Analytics</h3>
              <p className="text-blue-100">Track productivity and generate detailed reports</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-blue-100 text-sm">
          <p>&copy; 2025 Company. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Worklog Tracker</h1>
            </div>
            <p className="text-gray-600">Internal Project Management System</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your workspace</p>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('manager')}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    selectedRole === 'manager'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Manager</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('developer')}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    selectedRole === 'developer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Developer</span>
                </button>
              </div>
            </div>

            {/* Developer Atlassian OAuth */}
            {selectedRole === 'developer' && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Developer Access
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Sign in with your Atlassian account. You must have been invited by your manager to access the system.
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleAtlassianSignIn}
                  disabled={isAtlassianLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAtlassianLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Sign in with Atlassian
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Must be invited by your manager to access the system
                </p>
              </div>
            )}

            {/* Divider for Manager Login */}
            {selectedRole === 'manager' && (
              <>
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or sign in with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

                  {/* Submit Error/Success */}
                  {errors.submit && (
                    <div className={`p-4 rounded-lg flex items-center ${
                      errors.submit.includes('Successfully') 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <AlertCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        errors.submit.includes('Successfully') 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`} />
                      <p className={`text-sm ${
                        errors.submit.includes('Successfully') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>{errors.submit}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Submit Error/Success */}
            {errors.submit && (
              <div className={`p-4 rounded-lg flex items-center ${
                errors.submit.includes('Successfully') 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <AlertCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${
                  errors.submit.includes('Successfully') 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`} />
                <p className={`text-sm ${
                  errors.submit.includes('Successfully') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>{errors.submit}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 