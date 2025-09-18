'use client'

import { useState, useMemo } from 'react'
import { 
  Users, 
  UserCheck, 
  Clock, 
  Search, 
  RefreshCw, 
  EyeOff,
  Calendar,
  TrendingUp,
  Activity,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatHours } from '@/lib/timeUtils'

// Mock data structure - in real app this would come from API
interface DeveloperStatus {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen: Date
  currentActivity?: string
  timeOnline: number // in hours
  isActive: boolean
  timezone: string
}

interface DailyPresence {
  date: string
  onlineCount: number
  totalCount: number
  averageHours: number
}

const mockDevelopers: DeveloperStatus[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    status: 'online',
    lastSeen: new Date(),
    currentActivity: 'Working on feature implementation',
    timeOnline: 6.5,
    isActive: true,
    timezone: 'EST'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    status: 'away',
    lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    currentActivity: 'In meeting',
    timeOnline: 4.2,
    isActive: false,
    timezone: 'PST'
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    status: 'busy',
    lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    currentActivity: 'Code review in progress',
    timeOnline: 7.8,
    isActive: true,
    timezone: 'EST'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    status: 'offline',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    currentActivity: undefined,
    timeOnline: 0,
    isActive: false,
    timezone: 'CST'
  },
  {
    id: '5',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@company.com',
    status: 'online',
    lastSeen: new Date(),
    currentActivity: 'Testing new features',
    timeOnline: 5.3,
    isActive: true,
    timezone: 'PST'
  }
]

const mockDailyPresence: DailyPresence[] = [
  { date: '2024-01-15', onlineCount: 4, totalCount: 5, averageHours: 6.2 },
  { date: '2024-01-16', onlineCount: 3, totalCount: 5, averageHours: 5.8 },
  { date: '2024-01-17', onlineCount: 5, totalCount: 5, averageHours: 7.1 },
  { date: '2024-01-18', onlineCount: 4, totalCount: 5, averageHours: 6.5 },
  { date: '2024-01-19', onlineCount: 3, totalCount: 5, averageHours: 5.9 },
  { date: '2024-01-20', onlineCount: 2, totalCount: 5, averageHours: 4.2 },
  { date: '2024-01-21', onlineCount: 4, totalCount: 5, averageHours: 6.8 }
]

export default function OnlineStatusPage() {
  const [developers] = useState<DeveloperStatus[]>(mockDevelopers)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'away' | 'busy'>('all')
  const [showInactive, setShowInactive] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = developers.length
    const online = developers.filter(d => d.status === 'online').length
    const away = developers.filter(d => d.status === 'away').length
    const busy = developers.filter(d => d.status === 'busy').length
    const offline = developers.filter(d => d.status === 'offline').length
    const active = developers.filter(d => d.isActive).length
    const totalHours = developers.reduce((sum, d) => sum + d.timeOnline, 0)
    const averageHours = total > 0 ? totalHours / total : 0

    return {
      total,
      online,
      away,
      busy,
      offline,
      active,
      totalHours,
      averageHours
    }
  }, [developers])

  // Filter developers
  const filteredDevelopers = useMemo(() => {
    return developers.filter(dev => {
      const matchesSearch = dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dev.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || dev.status === statusFilter
      const matchesActive = showInactive || dev.isActive

      return matchesSearch && matchesStatus && matchesActive
    })
  }, [developers, searchTerm, statusFilter, showInactive])

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  // Get status color and icon
  const getStatusInfo = (status: DeveloperStatus['status']) => {
    switch (status) {
      case 'online':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: Wifi, label: 'Online' }
      case 'away':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock, label: 'Away' }
      case 'busy':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle, label: 'Busy' }
      case 'offline':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: WifiOff, label: 'Offline' }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: WifiOff, label: 'Unknown' }
    }
  }

  // Format last seen time
  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <ProtectedRoute allowedRoles={['MANAGER']}>
      <DashboardLayout 
        title="Online Status"
        subtitle="Monitor team presence and activity in real-time"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Developers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Online Now</p>
                  <p className="text-2xl font-bold text-green-600">{stats.online}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Today</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Hours Today</p>
                  <p className="text-2xl font-bold text-purple-600">{formatHours(stats.averageHours)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Online</p>
                  <p className="text-lg font-bold text-green-600">{stats.online}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Away</p>
                  <p className="text-lg font-bold text-yellow-600">{stats.away}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Busy</p>
                  <p className="text-lg font-bold text-red-600">{stats.busy}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Offline</p>
                  <p className="text-lg font-bold text-gray-600">{stats.offline}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search developers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'online' | 'offline' | 'away' | 'busy')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                {/* Show Inactive Toggle */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show inactive</span>
                </label>

                {/* Date Picker */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Developers List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Developer Status ({filteredDevelopers.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredDevelopers.map((developer) => {
                const statusInfo = getStatusInfo(developer.status)
                const StatusIcon = statusInfo.icon

                return (
                  <div key={developer.id} className="p-6 hover:bg-gray-50/50 transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center relative">
                            <span className="text-lg font-medium text-blue-600">
                              {developer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                            {/* Status indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusInfo.bgColor}`}>
                              <StatusIcon className={`w-2.5 h-2.5 ${statusInfo.color} mx-auto mt-0.5`} />
                            </div>
                          </div>
                        </div>

                        {/* Developer Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {developer.name}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{developer.email}</p>
                          {developer.currentActivity && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Activity:</span> {developer.currentActivity}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Details */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatHours(developer.timeOnline)}
                          </p>
                          <p className="text-xs">Today</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatLastSeen(developer.lastSeen)}
                          </p>
                          <p className="text-xs">Last seen</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {developer.timezone}
                          </p>
                          <p className="text-xs">Timezone</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {developer.isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredDevelopers.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No developers found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>

          {/* Daily Presence Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Presence Overview</h3>
            <div className="space-y-4">
              {mockDailyPresence.map((day) => (
                <div key={day.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-900 w-20">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(day.onlineCount / day.totalCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {day.onlineCount}/{day.totalCount}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Avg: {formatHours(day.averageHours)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
