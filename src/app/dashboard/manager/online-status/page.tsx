'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  Users, 
  UserCheck, 
  Search, 
  RefreshCw,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle2,
  Edit3,
  Trash2,
  X
} from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatHours } from '@/lib/timeUtils'
import { getCurrentDateLocal } from '@/lib/dateUtils'

// Real data structure from API
interface Developer {
  id: string
  name: string
  email: string
  atlassianAccountId: string
}

interface OnlineStatusRecord {
  id: string
  userId: string
  atlassianAccountId: string
  status: 'present' | 'absent'
  mood?: string
  description?: string
  date: string
  time: string
  checkInType: 'early' | 'on-time' | 'late'
  isEdited: boolean
  editedBy?: string
  editedAt?: string
  editReason?: string
  originalStatus?: {
    status: 'present' | 'absent'
    mood?: string
    description?: string
    time: string
    checkInType: 'early' | 'on-time' | 'late'
  }
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
    atlassianAccountId: string
  } | null
}

interface DailyPresence {
  date: string
  onlineCount: number
  totalCount: number
  averageHours: number
}

interface WeeklyRecord {
  date: string
  dayName: string
  isToday: boolean
  records: OnlineStatusRecord[]
}

interface OnlineStatusData {
  developers: Developer[]
  todayStatus: {
    present: number
    absent: number
    total: number
    attendanceRate: number
  }
  punctualityStats: {
    early: number
    onTime: number
    late: number
    total: number
  }
  organizationCheckInWindow: {
    startTime: string
    endTime: string
    timezone: string
  }
  dailyPresenceData: DailyPresence[]
  weeklyRecords: WeeklyRecord[]
  onlineStatusRecords: OnlineStatusRecord[]
}

// Mood options for editing
const moodOptions = [
  { value: 'happy', label: 'Happy', color: 'text-yellow-500' },
  { value: 'excited', label: 'Excited', color: 'text-purple-500' },
  { value: 'focused', label: 'Focused', color: 'text-blue-500' },
  { value: 'energetic', label: 'Energetic', color: 'text-orange-500' },
  { value: 'motivated', label: 'Motivated', color: 'text-red-500' },
  { value: 'sick', label: 'Sick', color: 'text-gray-500' },
  { value: 'tired', label: 'Tired', color: 'text-gray-400' }
]

export default function OnlineStatusPage() {
  const [onlineStatusData, setOnlineStatusData] = useState<OnlineStatusData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getCurrentDateLocal())
  const [isLoading, setIsLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<OnlineStatusRecord | null>(null)
  const [editForm, setEditForm] = useState({
    status: 'present' as 'present' | 'absent',
    mood: '',
    description: '',
    editReason: ''
  })

  // Fetch online status data
  const fetchOnlineStatusData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/manager/online-status?date=${selectedDate}`)
      const data = await response.json()

      if (response.ok) {
        console.log('Online status data received:', data.data)
        console.log('Online status records count:', data.data?.onlineStatusRecords?.length || 0)
        console.log('Selected date:', selectedDate)
        console.log('Sample record from API:', data.data?.onlineStatusRecords?.[0])
        setOnlineStatusData(data.data)
      } else {
        console.error('Failed to fetch online status data:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch online status data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  // Fetch data on component mount and when date changes
  useEffect(() => {
    fetchOnlineStatusData()
  }, [selectedDate, fetchOnlineStatusData])

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (!onlineStatusData) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        attendanceRate: 0,
        totalHours: 0,
        averageHours: 0
      }
    }

    const { todayStatus, dailyPresenceData } = onlineStatusData
    const totalHours = dailyPresenceData.reduce((sum, day) => sum + day.averageHours, 0)
    const averageHours = dailyPresenceData.length > 0 ? totalHours / dailyPresenceData.length : 0

    return {
      total: todayStatus.total,
      present: todayStatus.present,
      absent: todayStatus.absent,
      attendanceRate: todayStatus.attendanceRate,
      totalHours,
      averageHours
    }
  }, [onlineStatusData])

  // Filter weekly records based on search and status
  const filteredWeeklyRecords = useMemo(() => {
    if (!onlineStatusData?.weeklyRecords) return []

    return onlineStatusData.weeklyRecords.map(dayRecord => ({
      ...dayRecord,
      records: dayRecord.records.filter(record => {
        const user = record.user
        if (!user) return false

        const matchesSearch = searchTerm === '' || 
                             (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                             (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter

        return matchesSearch && matchesStatus
      })
    })).filter(dayRecord => dayRecord.records.length > 0) // Only show days with matching records
  }, [onlineStatusData, searchTerm, statusFilter])

  // Handle edit record
  const handleEditRecord = (record: OnlineStatusRecord) => {
    setEditingRecord(record)
    setEditForm({
      status: record.status,
      mood: record.mood || '',
      description: record.description || '',
      editReason: ''
    })
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingRecord) return

    try {
      const response = await fetch('/api/manager/online-status/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: editingRecord.id,
          status: editForm.status,
          mood: editForm.mood,
          description: editForm.description,
          editReason: editForm.editReason
        })
      })

      if (response.ok) {
        setEditingRecord(null)
        await fetchOnlineStatusData() // Refresh data
      } else {
        const data = await response.json()
        console.error('Failed to update record:', data.error)
      }
    } catch (error) {
      console.error('Failed to update record:', error)
    }
  }

  // Handle delete record
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return

    try {
      const response = await fetch(`/api/manager/online-status/edit?recordId=${recordId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchOnlineStatusData() // Refresh data
      } else {
        const data = await response.json()
        console.error('Failed to delete record:', data.error)
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchOnlineStatusData()
    setIsRefreshing(false)
  }

  // Get status color and icon
  const getStatusInfo = (status: 'present' | 'absent') => {
    switch (status) {
      case 'present':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2, label: 'Present' }
      case 'absent':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: X, label: 'Absent' }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: X, label: 'Unknown' }
    }
  }

  // Get check-in type color
  const getCheckInTypeColor = (type: 'early' | 'on-time' | 'late') => {
    switch (type) {
      case 'early':
        return 'text-green-600 bg-green-50'
      case 'on-time':
        return 'text-blue-600 bg-blue-50'
      case 'late':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
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
                  <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present Today</p>
                  <p className="text-2xl font-bold text-green-600">{isLoading ? '...' : stats.present}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{isLoading ? '...' : `${stats.attendanceRate}%`}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Hours Today</p>
                  <p className="text-2xl font-bold text-purple-600">{isLoading ? '...' : formatHours(stats.averageHours)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading status data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Present</p>
                    <p className="text-lg font-bold text-green-600">{stats.present}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Absent</p>
                    <p className="text-lg font-bold text-red-600">{stats.absent}</p>
                  </div>
                </div>
                {onlineStatusData?.punctualityStats && (
                  <div className="space-y-2">
                    <div key="on-time" className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">On Time</p>
                        <p className="text-lg font-bold text-blue-600">{onlineStatusData.punctualityStats.onTime}</p>
                      </div>
                    </div>
                    <div key="late" className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Late</p>
                        <p className="text-lg font-bold text-orange-600">{onlineStatusData.punctualityStats.late}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'present' | 'absent')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
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

          {/* Weekly Online Status Records */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Weekly Online Status Records
              </h3>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading records...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredWeeklyRecords.map((dayRecord) => (
                  <div key={dayRecord.date} className="p-6">
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h4 className={`text-lg font-semibold ${dayRecord.isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {dayRecord.dayName}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          dayRecord.isToday 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {dayRecord.date}
                        </span>
                        {dayRecord.isToday && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dayRecord.records.length} record{dayRecord.records.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Records for this day */}
                    {dayRecord.records.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No check-ins recorded</p>
                        <p className="text-sm text-gray-400">No developers checked in on this day</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayRecord.records
                          .filter(record => record.user) // Filter out records without user data
                          .map((record) => {
                            const user = record.user!
                            const statusInfo = getStatusInfo(record.status)
                            const StatusIcon = statusInfo.icon

                            return (
                              <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                                <div className="flex items-center space-x-4">
                                  {/* Avatar */}
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center relative">
                                      <span className="text-sm font-medium text-blue-600">
                                        {(user.name || 'Unknown').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </span>
                                      {/* Status indicator */}
                                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusInfo.bgColor}`}>
                                        <StatusIcon className={`w-1.5 h-1.5 ${statusInfo.color} mx-auto mt-0.5`} />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Developer Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <h5 className="text-sm font-medium text-gray-900 truncate">
                                        {user.name || 'Unknown Developer'}
                                      </h5>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                                        {statusInfo.label}
                                      </span>
                                      {record.isEdited && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                          Edited
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                                    {record.mood && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-medium">Mood:</span> {record.mood}
                                      </p>
                                    )}
                                    {record.description && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-medium">Description:</span> {record.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Status Details */}
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                  <div className="text-right">
                                    <p className="font-medium text-gray-900">
                                      {record.time || 'N/A'}
                                    </p>
                                    <p className="text-xs">Time</p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCheckInTypeColor(record.checkInType || 'on-time')}`}>
                                      {record.checkInType || 'N/A'}
                                    </span>
                                    <p className="text-xs mt-1">Punctuality</p>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleEditRecord(record)}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit record"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(record.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isLoading && filteredWeeklyRecords.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>

          {/* Daily Presence Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Presence Overview</h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading presence data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {onlineStatusData?.dailyPresenceData.map((day) => (
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
            )}
          </div>

          {/* Edit Modal */}
          {editingRecord && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Record</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'present' | 'absent' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>

                  {/* Mood */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
                    <select
                      value={editForm.mood}
                      onChange={(e) => setEditForm({ ...editForm, mood: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select mood</option>
                      {moodOptions.map((mood) => (
                        <option key={mood.value} value={mood.value}>{mood.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  {/* Edit Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Edit Reason</label>
                    <input
                      type="text"
                      value={editForm.editReason}
                      onChange={(e) => setEditForm({ ...editForm, editReason: e.target.value })}
                      placeholder="Why are you editing this record?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex space-x-3">
                  <button
                    onClick={() => setEditingRecord(null)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
