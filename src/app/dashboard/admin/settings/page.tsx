'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAdminSettings } from '@/hooks/useAdminSettings'
import PlatformSettingsTab from '@/components/admin/settings/PlatformSettingsTab'
import SecuritySettingsTab from '@/components/admin/settings/SecuritySettingsTab'
import NotificationSettingsTab from '@/components/admin/settings/NotificationSettingsTab'
import IntegrationSettingsTab from '@/components/admin/settings/IntegrationSettingsTab'
import ProfileSettingsTab from '@/components/admin/settings/ProfileSettingsTab'
import PasswordSettingsTab from '@/components/admin/settings/PasswordSettingsTab'
import { 
  Settings, 
  Shield, 
  Bell, 
  Plug, 
  User,
  Lock,
  RefreshCw,
  AlertCircle,
  Activity,
  Users,
  Building,
  TrendingUp
} from 'lucide-react'

const tabs = [
  {
    id: 'profile',
    name: 'Profile',
    icon: User,
    description: 'Personal information and account details'
  },
  {
    id: 'password',
    name: 'Password',
    icon: Lock,
    description: 'Password and security settings'
  },
  {
    id: 'platform',
    name: 'Platform',
    icon: Settings,
    description: 'Core platform settings and user limits'
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    description: 'Authentication and security policies'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    description: 'System notifications and alerts'
  },
  {
    id: 'integrations',
    name: 'Integrations',
    icon: Plug,
    description: 'Third-party integrations and services'
  }
]

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { 
    settings, 
    isLoading, 
    error, 
    refetch, 
    updateSetting, 
    isUpdating, 
    updateError 
  } = useAdminSettings()

  const handleUpdateSetting = async (section: string, newSettings: Record<string, unknown>) => {
    return await updateSetting(section, newSettings)
  }

  const handleUpdateProfile = async (profileData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }

      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    }
  }

  const handleUpdatePassword = async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password')
      }

      return true
    } catch (error) {
      console.error('Error updating password:', error)
      return false
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <DashboardLayout
          title="Admin Settings"
          subtitle="Configure platform settings and integrations"
        >
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <DashboardLayout
          title="Admin Settings"
          subtitle="Configure platform settings and integrations"
          actions={
            <button
              onClick={refetch}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          }
        >
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Settings</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout
        title="Admin Settings"
        subtitle="Configure platform settings and integrations"
        actions={
          <button
            onClick={refetch}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        }
      >
        <div className="max-w-7xl mx-auto">
          {/* System Overview */}
          {settings?.systemStats && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{settings.systemStats.totalUsers}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900">{settings.systemStats.totalOrganizations}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{settings.systemStats.activeUsers}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recent Signups</p>
                    <p className="text-2xl font-bold text-gray-900">{settings.systemStats.recentSignups}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <ProfileSettingsTab
                  onUpdate={handleUpdateProfile}
                  isUpdating={isUpdating}
                  updateError={updateError}
                />
              )}

              {activeTab === 'password' && (
                <PasswordSettingsTab
                  onUpdate={handleUpdatePassword}
                  isUpdating={isUpdating}
                  updateError={updateError}
                />
              )}

              {activeTab === 'platform' && settings?.platformConfig && (
                <PlatformSettingsTab
                  settings={settings.platformConfig}
                  onUpdate={(settings) => handleUpdateSetting('platform', settings)}
                  isUpdating={isUpdating}
                  updateError={updateError}
                />
              )}

              {activeTab === 'security' && settings?.securitySettings && (
                <SecuritySettingsTab
                  settings={settings.securitySettings}
                  onUpdate={(settings) => handleUpdateSetting('security', settings)}
                  isUpdating={isUpdating}
                  updateError={updateError}
                />
              )}

              {activeTab === 'notifications' && settings?.notificationSettings && (
                <NotificationSettingsTab
                  settings={settings.notificationSettings}
                  onUpdate={(settings) => handleUpdateSetting('notifications', settings)}
                  isUpdating={isUpdating}
                  updateError={updateError}
                />
              )}

              {activeTab === 'integrations' && settings?.integrationSettings && (
                <IntegrationSettingsTab
                  settings={settings.integrationSettings}
                  onUpdate={(settings) => handleUpdateSetting('integrations', settings)}
                  isUpdating={isUpdating}
                  updateError={updateError}
                />
              )}
            </div>
          </div>

          {/* Settings Help */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h4 className="font-medium text-gray-900 mb-3">Settings Help</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Profile Settings</h5>
                <p>Manage your personal information, contact details, and professional information.</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Password Settings</h5>
                <p>Update your password and configure security settings for your account.</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Platform Settings</h5>
                <p>Configure core platform functionality, user limits, and system behavior. Changes here affect all users and organizations.</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Security Settings</h5>
                <p>Manage authentication policies, password requirements, and security measures to protect user accounts and data.</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Notification Settings</h5>
                <p>Control system notifications, email alerts, and activity logging to keep users informed about important events.</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Integration Settings</h5>
                <p>Configure third-party integrations like Jira, Slack, and email services to extend platform functionality.</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
