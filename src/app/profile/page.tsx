'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContextNew'
import { jiraOrganizationSchema } from '@/lib/validation'
import { User, Settings, Globe, Key, Building, Save, CheckCircle, AlertCircle, LogOut, Download, Calendar, Users, Clock, TrendingUp, Filter, Edit, X } from 'lucide-react'
import DateRangePicker from '@/components/DateRangePicker'
import DashboardLayout from '@/components/DashboardLayout'

export default function ProfilePage() {
  const { user, updateJiraOrganization, logout } = useAuth()
  const [jiraData, setJiraData] = useState({
    organizationName: '',
    domain: '',
    email: '',
    apiToken: ''
  })
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState('this-week')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [isEditingOrganization, setIsEditingOrganization] = useState(false)
  const [organizationSuccess, setOrganizationSuccess] = useState(false)

  useEffect(() => {
    if (user?.jiraOrganization) {
      setJiraData(user.jiraOrganization)
    }
    if (user) {
      setUserData({
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setJiraData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleEditProfile = () => {
    setIsEditingProfile(true)
    setProfileSuccess(false)
    setErrors({})
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    // Reset to original values
    if (user) {
      setUserData({
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      })
    }
    setErrors({})
  }

  const handleUpdateProfile = async () => {
    if (!userData.firstName.trim() || !userData.lastName.trim()) {
      setErrors({ profile: 'First name and last name are required' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Here you would typically make an API call to update the profile
      // For now, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProfileSuccess(true)
      setIsEditingProfile(false)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (error) {
      setErrors({ profile: 'Failed to update profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditOrganization = () => {
    setIsEditingOrganization(true)
    setOrganizationSuccess(false)
    setErrors({})
  }

  const handleCancelOrganizationEdit = () => {
    setIsEditingOrganization(false)
    // Reset to original values
    if (user?.jiraOrganization) {
      setJiraData(user.jiraOrganization)
    }
    setErrors({})
  }

  const handleUpdateOrganization = async () => {
    if (!validateOrganizationForm()) return

    setIsLoading(true)
    setErrors({})

    const result = await updateJiraOrganization(jiraData)

    if (result.success) {
      setOrganizationSuccess(true)
      setIsEditingOrganization(false)
      setTimeout(() => setOrganizationSuccess(false), 3000)
    } else {
      setErrors({ organization: result.error || 'Failed to update organization settings' })
    }

    setIsLoading(false)
  }

  const validateOrganizationForm = () => {
    try {
      jiraOrganizationSchema.parse(jiraData)
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

  const handleLogout = () => {
    logout()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Profile Settings"
      subtitle="Manage your account and Jira organization settings"
      actions={
        <div className="flex items-center space-x-3">
          <DateRangePicker 
            value={selectedDateRange} 
            onChange={setSelectedDateRange} 
          />
          <button className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <User className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
              </div>
              {!isEditingProfile && (
                <button
                  onClick={handleEditProfile}
                  className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
            </div>
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleUserDataChange}
                    disabled={!isEditingProfile}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      isEditingProfile 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleUserDataChange}
                    disabled={!isEditingProfile}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      isEditingProfile 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    }`}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 font-medium">{user?.email || 'No email'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.isEmailVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user?.isEmailVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>

              {/* Profile Error */}
              {errors.profile && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-600">{errors.profile}</p>
                </div>
              )}

              {/* Profile Success */}
              {profileSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <p className="text-sm text-green-600">Profile updated successfully!</p>
                </div>
              )}

              {/* Edit Mode Buttons */}
              {isEditingProfile && (
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Profile
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Jira Organization Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Settings className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Jira Organization</h2>
              </div>
              {!isEditingOrganization && (
                <button
                  onClick={handleEditOrganization}
                  className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
            </div>

            <form className="space-y-4">
              {/* Organization Name */}
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  Organization Name
                </label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={jiraData.organizationName}
                  onChange={handleInputChange}
                  disabled={!isEditingOrganization}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isEditingOrganization 
                      ? (errors.organizationName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 bg-white')
                      : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                  }`}
                  placeholder="Your organization name"
                />
                {errors.organizationName && (
                  <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>
                )}
              </div>

              {/* Domain */}
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Jira Domain
                </label>
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  value={jiraData.domain}
                  onChange={handleInputChange}
                  disabled={!isEditingOrganization}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isEditingOrganization 
                      ? (errors.domain ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 bg-white')
                      : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                  }`}
                  placeholder="your-domain.atlassian.net"
                />
                {errors.domain && (
                  <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Jira Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={jiraData.email}
                  onChange={handleInputChange}
                  disabled={!isEditingOrganization}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isEditingOrganization 
                      ? (errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 bg-white')
                      : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                  }`}
                  placeholder="your-email@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* API Token */}
              <div>
                <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  API Token
                </label>
                <input
                  type="password"
                  id="apiToken"
                  name="apiToken"
                  value={jiraData.apiToken}
                  onChange={handleInputChange}
                  disabled={!isEditingOrganization}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isEditingOrganization 
                      ? (errors.apiToken ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 bg-white')
                      : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                  }`}
                  placeholder="Your Jira API token"
                />
                {errors.apiToken && (
                  <p className="mt-1 text-sm text-red-600">{errors.apiToken}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Get your API token from{' '}
                  <a 
                    href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Atlassian Account Settings
                  </a>
                </p>
              </div>

              {/* Organization Error */}
              {errors.organization && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-600">{errors.organization}</p>
                </div>
              )}

              {/* Organization Success */}
              {organizationSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <p className="text-sm text-green-600">Organization settings updated successfully!</p>
                </div>
              )}

              {/* Edit Mode Buttons */}
              {isEditingOrganization && (
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleUpdateOrganization}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Organization
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrganizationEdit}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 