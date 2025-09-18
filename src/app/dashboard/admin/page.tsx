'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAdminStats } from '@/hooks/useAdminStats'
import { adminService } from '@/lib/adminService'
import { 
  Users, 
  UserCog, 
  Database, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Building2,
  RefreshCw
} from 'lucide-react'

export default function AdminDashboard() {
  const { stats, isLoading, error, refetch, systemHealthStatus } = useAdminStats()

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />
      case 'warning': return <AlertCircle className="w-5 h-5" />
      case 'error': return <AlertCircle className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="w-4 h-4" />
      case 'organization_created': return <Building2 className="w-4 h-4" />
      case 'system_event': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'user_signup': return 'bg-green-100 text-green-600'
      case 'organization_created': return 'bg-blue-100 text-blue-600'
      case 'system_event': return 'bg-orange-100 text-orange-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }


  if (error) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <DashboardLayout
          title="Admin Dashboard"
          subtitle="Platform management and system administration"
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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
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
        title="Admin Dashboard"
        subtitle="Platform management and system administration"
        actions={
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-3 py-2 rounded-lg ${systemHealthStatus.color}`}>
              {getSystemHealthIcon(stats?.systemHealth || 'healthy')}
              <span className="ml-2 text-sm font-medium capitalize">
                {systemHealthStatus.label}
              </span>
            </div>
            <button
              onClick={refetch}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        }
      >
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : (stats?.totalUsers || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Managers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCog className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Managers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : (stats?.totalManagers || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Developers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Developers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : (stats?.totalDevelopers || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : (stats?.activeUsers || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Signups */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Signups</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : (stats?.recentSignups || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Organizations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : (stats?.totalOrganizations || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Manager Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Manager Management</h3>
                <UserCog className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">
                Manage all platform managers, their permissions, and access levels.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Managers</span>
                  <span className="font-medium">
                    {isLoading ? '...' : (stats?.totalManagers || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Organizations</span>
                  <span className="font-medium">
                    {isLoading ? '...' : (stats?.totalOrganizations || 0)}
                  </span>
                </div>
              </div>
              <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Manage Managers
              </button>
            </div>

            {/* System Administration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Administration</h3>
                <Database className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">
                Monitor system performance, manage integrations, and configure platform settings.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">System Status</span>
                  <span className={`font-medium ${systemHealthStatus.color}`}>
                    {isLoading ? '...' : (stats?.systemHealth || 'unknown')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-medium">
                    {isLoading ? '...' : (stats?.activeUsers || 0)}
                  </span>
                </div>
              </div>
              <button className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                System Settings
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Platform Activity</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 ${getActivityIconColor(activity.type)} rounded-full flex items-center justify-center`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {activity.description} • {adminService.formatActivityTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
