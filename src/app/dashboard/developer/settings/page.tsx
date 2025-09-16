'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContextNew'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  User, 
  Key, 
  Bell, 
  Shield, 
  Save, 
  Edit3, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Building2
} from 'lucide-react'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  atlassianEmail: string
  atlassianDisplayName: string
  atlassianAvatarUrl: string
  atlassianAccountId: string
  jiraOrganization: {
    organizationName: string
    domain: string
    email: string
  } | null
}

interface OrganizationData {
  id: string
  name: string
  slug: string
  description?: string
  domain?: string
  email?: string
  settings: {
    timezone: string
    workingDays: string[]
    workingHours: {
      start: string
      end: string
    }
  }
  subscription: {
    plan: 'free' | 'pro' | 'enterprise'
    status: 'active' | 'inactive' | 'cancelled' | 'trial'
    maxUsers: number
  }
}

interface NotificationSettings {
  emailNotifications: boolean
  worklogReminders: boolean
  projectUpdates: boolean
  weeklyReports: boolean
}

export default function DeveloperSettingsPage() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Profile form state
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    atlassianEmail: '',
    atlassianDisplayName: '',
    atlassianAvatarUrl: '',
    atlassianAccountId: '',
    jiraOrganization: null
  })
  
  // Organization data state
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null)
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    worklogReminders: true,
    projectUpdates: true,
    weeklyReports: false
  })
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Password setup state
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [passwordSetupData, setPasswordSetupData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordSetupFields, setShowPasswordSetupFields] = useState({
    new: false,
    confirm: false
  })

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        atlassianEmail: user.atlassianEmail || '',
        atlassianDisplayName: user.atlassianDisplayName || '',
        atlassianAvatarUrl: user.atlassianAvatarUrl || '',
        atlassianAccountId: user.atlassianAccountId || '',
        jiraOrganization: user.jiraOrganization || null
      })
      
      // Load organization data
      loadOrganizationData()
    }
  }, [user])

  const loadOrganizationData = async () => {
    try {
      const response = await fetch('/api/user/organization')
      const data = await response.json()
      
      if (data.success) {
        setOrganizationData(data.organization)
      } else {
        console.error('Failed to load organization data:', data.error)
      }
    } catch (error) {
      console.error('Error loading organization data:', error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        // Update the user context
        updateUser({ 
          firstName: profileData.firstName,
          lastName: profileData.lastName
        })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' })
      }
    } catch (error) {
      console.error('Password change error:', error)
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordSetupData.newPassword !== passwordSetupData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (passwordSetupData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: passwordSetupData.newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Password setup successful! You can now use email/password authentication.' })
        setPasswordSetupData({ newPassword: '', confirmPassword: '' })
        setShowPasswordSetup(false)
        // Update user context to reflect that password auth is now available
        updateUser({ ...user, authMethods: [...(user?.authMethods || []), 'password'] })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to setup password' })
      }
    } catch (error) {
      console.error('Password setup error:', error)
      setMessage({ type: 'error', text: 'Failed to setup password. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Notification settings updated successfully!' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update notification settings' })
      }
    } catch (error) {
      console.error('Notification update error:', error)
      setMessage({ type: 'error', text: 'Failed to update notification settings. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const testJiraConnection = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/jira/test-connection', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Jira connection successful!' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Jira connection failed' })
      }
    } catch (error) {
      console.error('Jira connection test error:', error)
      setMessage({ type: 'error', text: 'Failed to test Jira connection. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Key },
  ]

  return (
    <ProtectedRoute allowedRoles={['DEVELOPER']}>
      <DashboardLayout 
        title="Settings"
        subtitle="Manage your account and preferences"
      >
        <div className="max-w-4xl mx-auto">
          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-3" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-3" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  <Edit3 className="w-5 h-5 text-gray-400" />
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Atlassian Account Info */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Atlassian Account</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Atlassian Email
                        </label>
                        <input
                          type="email"
                          value={profileData.atlassianEmail}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={profileData.atlassianDisplayName}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Atlassian account information is managed through your Atlassian profile
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Organization Information</h3>
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>

                {organizationData ? (
                  <div className="space-y-6">
                    {/* Organization Details */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Organization Details</h4>
                            <p className="text-sm text-gray-500">Your organization information</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization Name
                          </label>
                          <p className="text-sm text-gray-900 font-medium">{organizationData.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization Slug
                          </label>
                          <p className="text-sm text-gray-900 font-mono">{organizationData.slug}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Domain
                          </label>
                          <p className="text-sm text-gray-900">
                            {organizationData.domain || 'Not configured'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <p className="text-sm text-gray-900">
                            {organizationData.email || 'Not configured'}
                          </p>
                        </div>
                      </div>

                      {organizationData.description && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <p className="text-sm text-gray-900">{organizationData.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Organization Settings */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Organization Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Timezone
                          </label>
                          <p className="text-sm text-gray-900">{organizationData.settings.timezone}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Working Days
                          </label>
                          <p className="text-sm text-gray-900">
                            {organizationData.settings.workingDays
                              .map(day => day.charAt(0).toUpperCase() + day.slice(1))
                              .join(', ')
                            }
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Working Hours
                          </label>
                          <p className="text-sm text-gray-900">
                            {organizationData.settings.workingHours.start} - {organizationData.settings.workingHours.end}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Information */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Subscription Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan
                          </label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            organizationData.subscription.plan === 'enterprise' 
                              ? 'bg-purple-100 text-purple-800'
                              : organizationData.subscription.plan === 'pro'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {organizationData.subscription.plan.charAt(0).toUpperCase() + organizationData.subscription.plan.slice(1)}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            organizationData.subscription.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : organizationData.subscription.status === 'trial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {organizationData.subscription.status.charAt(0).toUpperCase() + organizationData.subscription.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Users
                          </label>
                          <p className="text-sm text-gray-900">{organizationData.subscription.maxUsers}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Loading organization information...
                    </p>
                    <p className="text-xs text-gray-400">
                      Please wait while we fetch your organization details.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                  <Shield className="w-5 h-5 text-gray-400" />
                </div>

                {/* Authentication Methods Status */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Authentication Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900">Atlassian OAuth</p>
                          <p className="text-xs text-green-700">Primary authentication method</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-green-800 bg-green-100 px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>

                    <div className={`flex items-center justify-between p-3 border rounded-lg ${
                      user?.authMethods?.includes('password') 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user?.authMethods?.includes('password') 
                            ? 'bg-green-100' 
                            : 'bg-gray-100'
                        }`}>
                          {user?.authMethods?.includes('password') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Key className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            user?.authMethods?.includes('password') 
                              ? 'text-green-900' 
                              : 'text-gray-700'
                          }`}>
                            Email & Password
                          </p>
                          <p className={`text-xs ${
                            user?.authMethods?.includes('password') 
                              ? 'text-green-700' 
                              : 'text-gray-500'
                          }`}>
                            {user?.authMethods?.includes('password') 
                              ? 'Fallback authentication method' 
                              : 'Not configured - click to set up'
                            }
                          </p>
                        </div>
                      </div>
                      {user?.authMethods?.includes('password') ? (
                        <span className="text-xs font-medium text-green-800 bg-green-100 px-2 py-1 rounded-full">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowPasswordSetup(true)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
                        >
                          Set Up
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Setup Modal */}
                {showPasswordSetup && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Set Up Password Authentication</h4>
                        <button
                          onClick={() => {
                            setShowPasswordSetup(false)
                            setPasswordSetupData({ newPassword: '', confirmPassword: '' })
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <EyeOff className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-6">
                        Set up a password to enable email/password authentication as a fallback method.
                      </p>

                      <form onSubmit={handlePasswordSetup} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswordSetupFields.new ? 'text' : 'password'}
                              value={passwordSetupData.newPassword}
                              onChange={(e) => setPasswordSetupData({ ...passwordSetupData, newPassword: e.target.value })}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswordSetupFields({ ...showPasswordSetupFields, new: !showPasswordSetupFields.new })}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswordSetupFields.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Password must be at least 8 characters long</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswordSetupFields.confirm ? 'text' : 'password'}
                              value={passwordSetupData.confirmPassword}
                              onChange={(e) => setPasswordSetupData({ ...passwordSetupData, confirmPassword: e.target.value })}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswordSetupFields({ ...showPasswordSetupFields, confirm: !showPasswordSetupFields.confirm })}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswordSetupFields.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordSetup(false)
                              setPasswordSetupData({ newPassword: '', confirmPassword: '' })
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            {isSaving ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Setting up...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Set Up Password</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Password Change Form - Only show if password auth is already set up */}
                {user?.authMethods?.includes('password') && (
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Password must be at least 8 characters long</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Changing...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Change Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Worklog Reminders</h4>
                      <p className="text-sm text-gray-500">Remind me to log my work daily</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.worklogReminders}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, worklogReminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Project Updates</h4>
                      <p className="text-sm text-gray-500">Notify me about project changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.projectUpdates}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, projectUpdates: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
                      <p className="text-sm text-gray-500">Send me weekly productivity reports</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReports}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyReports: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNotificationUpdate}
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Jira Integration</h3>
                  <Key className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-6">
                  {/* Organization Jira Settings */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Organization Jira Settings</h4>
                          <p className="text-sm text-gray-500">Inherited from your organization</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {profileData.jiraOrganization ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Configured
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not Configured
                          </span>
                        )}
                      </div>
                    </div>

                    {profileData.jiraOrganization ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-900">Organization Configuration</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-blue-700 font-medium">Organization:</span>
                              <span className="ml-2 text-blue-900">{profileData.jiraOrganization.organizationName}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-medium">Domain:</span>
                              <span className="ml-2 text-blue-900">{profileData.jiraOrganization.domain}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-medium">Jira Email:</span>
                              <span className="ml-2 text-blue-900">{profileData.jiraOrganization.email}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-medium">API Status:</span>
                              <span className="ml-2 text-green-700 font-medium">Active</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <p className="mb-2">
                            <strong>Note:</strong> Your Jira integration settings are managed by your organization administrator. 
                            You cannot modify these settings directly.
                          </p>
                          <p>
                            If you need changes to the Jira configuration, please contact your manager or organization administrator.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                            Your organization hasn&apos;t configured Jira integration yet.
                        </p>
                        <p className="text-xs text-gray-400">
                          Contact your manager to set up Jira integration for your organization.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Personal Atlassian Account */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Your Atlassian Account</h4>
                          <p className="text-sm text-gray-500">Personal account linked to Jira</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {profileData.atlassianAccountId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not Linked
                          </span>
                        )}
                      </div>
                    </div>

                    {profileData.atlassianAccountId ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Account ID:</span>
                              <span className="ml-2 font-mono text-gray-900 text-xs">{profileData.atlassianAccountId}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <span className="ml-2 text-gray-900">{profileData.atlassianEmail}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Display Name:</span>
                              <span className="ml-2 text-gray-900">{profileData.atlassianDisplayName}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <span className="ml-2 text-green-600 font-medium">Active</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={testJiraConnection}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Testing...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Test Connection</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-4">
                          Link your Atlassian account to access Jira data
                        </p>
                        <button
                          onClick={() => window.location.href = '/auth/login'}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Link Atlassian Account
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Data Sync Information */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">How It Works</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Organization Setup</p>
                          <p className="text-gray-500">Your manager configures Jira integration for the entire organization</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Account Linking</p>
                          <p className="text-gray-500">You link your personal Atlassian account through OAuth</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Automatic Sync</p>
                          <p className="text-gray-500">Your dashboard automatically syncs with Jira using organization settings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
