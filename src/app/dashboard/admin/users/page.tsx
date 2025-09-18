'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UserDetailsModal from '@/components/admin/UserDetailsModal'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { adminService } from '@/lib/adminService'
import { 
  Users, 
  Search, 
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserCog,
  Code,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'MANAGER' | 'DEVELOPER'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { 
    users, 
    pagination, 
    isLoading, 
    error, 
    refetch, 
    updateFilters 
  } = useAdminUsers({
    search: searchTerm,
    role: roleFilter,
    status: statusFilter
  })

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    updateFilters({ search: value })
  }

  const handleRoleFilter = (value: 'all' | 'ADMIN' | 'MANAGER' | 'DEVELOPER') => {
    setRoleFilter(value)
    updateFilters({ role: value })
  }

  const handleStatusFilter = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value)
    updateFilters({ status: value })
  }

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsModalOpen(true)
  }

  const handleUserUpdate = () => {
    // Refresh the users list to reflect changes
    refetch()
  }

  const handleUserDelete = (userId: string) => {
    // Remove from selected users if it was selected
    const newSelected = new Set(selectedUsers)
    newSelected.delete(userId)
    setSelectedUsers(newSelected)
    
    // Refresh the users list
    refetch()
  }

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4" />
      case 'MANAGER': return <UserCog className="w-4 h-4" />
      case 'DEVELOPER': return <Code className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <DashboardLayout
          title="User Management"
          subtitle="Manage all platform users"
        >
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
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
          title="User Management"
          subtitle="Manage all platform users"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
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
        title="User Management"
        subtitle="Manage all platform users across all roles"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={refetch}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
            {selectedUsers.size > 0 && (
              <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedUsers.size})
              </button>
            )}
          </div>
        }
      >
        <div className="max-w-7xl mx-auto">
          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilter(e.target.value as 'all' | 'ADMIN' | 'MANAGER' | 'DEVELOPER')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="DEVELOPER">Developer</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(users.map(u => u._id)))
                          } else {
                            setSelectedUsers(new Set())
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleUserClick(user._id)}>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adminService.getRoleInfo(user.role).color}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adminService.getDepartmentName(user.department || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.isEmailVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isEmailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {adminService.formatLastLogin(user.lastLogin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleUserClick(user._id)}
                            className="text-blue-600 hover:text-blue-900" 
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUserClick(user._id)}
                            className="text-green-600 hover:text-green-900" 
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUserClick(user._id)}
                            className="text-red-600 hover:text-red-900" 
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateFilters({ page: pagination.currentPage - 1 })}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => updateFilters({ page: pagination.currentPage + 1 })}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        <UserDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedUserId(null)
          }}
          userId={selectedUserId}
          onUserUpdate={handleUserUpdate}
          onUserDelete={handleUserDelete}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
