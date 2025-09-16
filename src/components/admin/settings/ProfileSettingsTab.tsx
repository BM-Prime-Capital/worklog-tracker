'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit
} from 'lucide-react'
import { adminService } from '@/lib/adminService'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  role: string
  department?: string
  employmentType?: string
  createdAt: string
  lastLogin?: string
  organizationId?: {
    _id: string
    name: string
    slug: string
  }
}

interface ProfileSettingsTabProps {
  onUpdate: (profileData: any) => Promise<boolean>
  isUpdating: boolean
  updateError: string | null
}

export default function ProfileSettingsTab({ 
  onUpdate, 
  isUpdating, 
  updateError 
}: ProfileSettingsTabProps) {
  const { data: session } = useSession()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState<Partial<ProfileData>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (session?.user) {
      // Initialize profile data from session
      const initialData: ProfileData = {
        firstName: (session.user as any).firstName || '',
        lastName: (session.user as any).lastName || '',
        email: (session.user as any).email || '',
        role: (session.user as any).role || 'ADMIN',
        department: (session.user as any).department || '',
        employmentType: (session.user as any).employmentType || '',
        createdAt: (session.user as any).createdAt || new Date().toISOString(),
        lastLogin: (session.user as any).lastLogin || '',
        organizationId: (session.user as any).organizationId || null
      }
      
      setProfileData(initialData)
      setFormData(initialData)
      setIsLoading(false)
    }
  }, [session])

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    setHasChanges(JSON.stringify(newData) !== JSON.stringify(profileData))
  }

  const handleSave = async () => {
    if (!profileData) return
    
    const success = await onUpdate(formData)
    if (success) {
      setProfileData(formData as ProfileData)
      setHasChanges(false)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setFormData(profileData || {})
    setHasChanges(false)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Profile</h3>
        <p className="text-gray-600">Unable to load profile information</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
          <p className="text-sm text-gray-600">Manage your personal information and account details</p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        ) : hasChanges && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {updateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{updateError}</p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-gray-900">Personal Information</h4>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{profileData.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{profileData.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email address"
                />
              ) : (
                <div className="flex items-center space-x-2 py-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{profileData.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="flex items-center space-x-2 py-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{profileData.role}</span>
                <span className="text-xs text-gray-500">(Cannot be changed)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Building className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="font-medium text-gray-900">Professional Information</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              {isEditing ? (
                <select
                  value={formData.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="software-engineering">Software Engineering</option>
                  <option value="venture-capital">Venture Capital</option>
                  <option value="graphic-design">Graphic Design</option>
                  <option value="communication">Communication</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">
                  {profileData.department ? adminService.getDepartmentName(profileData.department) : 'Not specified'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type
              </label>
              {isEditing ? (
                <select
                  value={formData.employmentType || ''}
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employment Type</option>
                  <option value="permanent">Permanent</option>
                  <option value="intern">Intern</option>
                  <option value="contractor">Contractor</option>
                  <option value="consultant">Consultant</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">
                  {profileData.employmentType ? 
                    profileData.employmentType.charAt(0).toUpperCase() + profileData.employmentType.slice(1) : 
                    'Not specified'
                  }
                </p>
              )}
            </div>

            {profileData.organizationId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <div className="flex items-center space-x-2 py-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{profileData.organizationId.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-purple-600 mr-2" />
            <h4 className="font-medium text-gray-900">Account Information</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium text-gray-900">
                {adminService.formatDate(profileData.createdAt)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Login</span>
              <span className="font-medium text-gray-900">
                {adminService.formatLastLogin(profileData.lastLogin)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Account Status</span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="font-medium text-green-600">Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="font-medium text-gray-900">Profile Actions</h4>
          </div>
          
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Download Profile Data
            </button>
            <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Export Activity Log
            </button>
            <button className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-medium text-blue-900 mb-3">Profile Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium">Personal Information</p>
            <p>Keep your name and contact details up to date</p>
          </div>
          <div>
            <p className="font-medium">Professional Details</p>
            <p>Update your department and employment information</p>
          </div>
          <div>
            <p className="font-medium">Account Security</p>
            <p>Regularly update your password and security settings</p>
          </div>
        </div>
      </div>
    </div>
  )
}
