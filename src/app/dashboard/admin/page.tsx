'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  Users, 
  UserCog, 
  Shield, 
  Database, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalManagers: number
  totalDevelopers: number
  activeUsers: number
  recentSignups: number
  systemHealth: 'healthy' | 'warning' | 'error'
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalManagers: 0,
    totalDevelopers: 0,
    activeUsers: 0,
    recentSignups: 0,
    systemHealth: 'healthy'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/stats')
        // const data = await response.json()
        
        // Mock data for now
        setStats({
          totalUsers: 156,
          totalManagers: 12,
          totalDevelopers: 144,
          activeUsers: 142,
          recentSignups: 8,
          systemHealth: 'healthy'
        })
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchAdminStats()
    }
  }, [session])

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />
      case 'warning': return <AlertCircle className="w-5 h-5" />
      case 'error': return <AlertCircle className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout
        title="Admin Dashboard"
        subtitle="Platform management and system administration"
        actions={
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-3 py-2 rounded-lg ${getSystemHealthColor(stats.systemHealth)}`}>
              {getSystemHealthIcon(stats.systemHealth)}
              <span className="ml-2 text-sm font-medium capitalize">
                System {stats.systemHealth}
              </span>
            </div>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.totalManagers}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDevelopers}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.recentSignups}</p>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Database className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{stats.systemHealth}</p>
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
                  <span className="font-medium">{stats.totalManagers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending Approvals</span>
                  <span className="font-medium">2</span>
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
                  <span className={`font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
                    {stats.systemHealth}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Integrations</span>
                  <span className="font-medium">3</span>
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
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New manager registered</p>
                  <p className="text-xs text-gray-500">Sarah Johnson joined as Manager • 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Team member invited</p>
                  <p className="text-xs text-gray-500">Manager invited 3 new developers • 4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">System maintenance completed</p>
                  <p className="text-xs text-gray-500">Database optimization finished • 6 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
