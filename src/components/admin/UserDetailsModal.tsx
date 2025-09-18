'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Shield, 
  UserCog, 
  Code, 
  CheckCircle, 
  XCircle,
  Clock,
  Users,
  Activity,
  Edit,
  Trash2,
  Save,
  AlertCircle
} from 'lucide-react'
import { AdminUser } from '@/lib/adminService'
import { adminService } from '@/lib/adminService'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  onUserUpdate?: (updatedUser: AdminUser) => void
  onUserDelete?: (userId: string) => void
}

export default function UserDetailsModal({ 
  isOpen, 
  onClose, 
  userId, 
  onUserUpdate,
  onUserDelete 
}: UserDetailsModalProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<AdminUser>>({})

  // Fetch user details when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails()
    }
  }, [isOpen, userId])

  const fetchUserDetails = async () => {
    if (!userId) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await adminService.getUserDetails(userId)
      
      if (response.success && response.data) {
        setUser(response.data)
        setEditData(response.data)
      } else {
        setError(response.message || 'Failed to fetch user details')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData(user || {})
    setError(null)
  }

  const handleSave = async () => {
    if (!user || !userId) return
    
    try {
      setIsSaving(true)
      setError(null)
      
      const response = await adminService.updateUser(userId, editData)
      
      if (response.success && response.data) {
        setUser(response.data)
        setIsEditing(false)
        onUserUpdate?.(response.data)
      } else {
        setError(response.message || 'Failed to update user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !userId) return
    
    if (!confirm(`Are you sure you want to deactivate ${user.firstName} ${user.lastName}?`)) {
      return
    }
    
    try {
      setIsSaving(true)
      setError(null)
      
      const response = await adminService.deleteUser(userId)
      
      if (response.success) {
        onUserDelete?.(userId)
        onClose()
      } else {
        setError(response.message || 'Failed to delete user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof AdminUser, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4" />
      case 'MANAGER': return <UserCog className="w-4 h-4" />
      case 'DEVELOPER': return <Code className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'MANAGER': return 'bg-purple-100 text-purple-800'
      case 'DEVELOPER': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isLoading ? 'Loading...' : `${user?.firstName} ${user?.lastName}`}
              </h2>
              <p className="text-sm text-gray-600">
                {isLoading ? 'Fetching user details...' : 'User Details'}
              </p>
            </div>
            {!isLoading && user && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
                <span className="ml-1">{user.role}</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isLoading && user && !isEditing && (
              <>
                <button
                  onClick={handleEdit}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit User"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Deactivate User"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading user details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading User</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchUserDetails}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editData.firstName || ''}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          value={editData.lastName || ''}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Last name"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-900">{user.firstName} {user.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email address"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{user.email}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.isEmailVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isEmailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    {isEditing ? (
                      <select
                        value={editData.role || ''}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="DEVELOPER">Developer</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span className="text-gray-900">{user.role}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    {isEditing ? (
                      <select
                        value={editData.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="software-engineering">Software Engineering</option>
                        <option value="venture-capital">Venture Capital</option>
                        <option value="graphic-design">Graphic Design</option>
                        <option value="communication">Communication</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{adminService.getDepartmentName(user.department || '')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Status</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {isEditing ? (
                      <select
                        value={editData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {user.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{adminService.formatLastLogin(user.lastLogin)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{adminService.formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  {user.organizationId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{user.organizationId.name}</span>
                      </div>
                    </div>
                  )}

                  {user.invitedBy && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invited By</label>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {user.invitedBy.firstName} {user.invitedBy.lastName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Statistics */}
              {user.stats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Activity Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">Last Login</p>
                          <p className="font-semibold">{user.stats.lastLoginDays}d ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-600">Worklogs</p>
                          <p className="font-semibold">{user.stats.totalWorklogs}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-600">Projects</p>
                          <p className="font-semibold">{user.stats.projectsCount}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${user.stats.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-semibold">{user.stats.isOnline ? 'Online' : 'Offline'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        {!isLoading && user && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
