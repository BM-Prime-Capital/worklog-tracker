'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Calendar, CheckCircle, TrendingUp, Award, Target, Plus, Smile, Frown, Meh, Heart, Zap, Coffee } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDateLocal } from '@/lib/dateUtils'
// import { useAuth } from '@/contexts/AuthContextNew'

// Removed mock data - now using real API data

// Mood options configuration
const moodOptions = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  { value: 'excited', label: 'Excited', icon: Zap, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { value: 'focused', label: 'Focused', icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { value: 'energetic', label: 'Energetic', icon: Coffee, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { value: 'motivated', label: 'Motivated', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-50' },
  { value: 'sick', label: 'Sick', icon: Frown, color: 'text-gray-500', bgColor: 'bg-gray-50' },
  { value: 'tired', label: 'Tired', icon: Meh, color: 'text-gray-400', bgColor: 'bg-gray-100' }
]

// Status configuration
const statusConfig = {
  present: {
    label: 'Present',
    color: 'bg-green-500',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  absent: {
    label: 'Absent',
    color: 'bg-red-500',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50'
  },
  'not-set': {
    label: 'Not Set',
    color: 'bg-gray-300',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-50'
  }
}

// Check-in type configuration
const checkInTypeConfig = {
  early: {
    label: 'Early',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '⏰'
  },
  'on-time': {
    label: 'On Time',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '✅'
  },
  late: {
    label: 'Late',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '⏰'
  }
}

export default function OnlineStatusPage() {
  const [isMarkingPresent, setIsMarkingPresent] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [selectedMood, setSelectedMood] = useState('')
  const [description, setDescription] = useState('')
  const [currentStatus] = useState('online') // Default status
  const [todayStatus, setTodayStatus] = useState('not-set')
  const [todayMood, setTodayMood] = useState('')
  const [todayDescription, setTodayDescription] = useState('')
  const [todayCheckInTime, setTodayCheckInTime] = useState('')
  const [todayCheckInType, setTodayCheckInType] = useState('on-time')
  const [showCalendar, setShowCalendar] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineStatusData, setOnlineStatusData] = useState({
    stats: {
      currentStreak: 0,
      longestStreak: 0,
      totalDaysPresent: 0,
      totalDaysTracked: 0,
      attendanceRate: 0
    },
    punctualityStats: {
      early: 0,
      onTime: 0,
      late: 0,
      total: 0
    },
    organizationCheckInWindow: {
      startTime: '08:00',
      endTime: '10:00',
      timezone: 'UTC+3'
    },
    recentActivity: [] as Array<{
      date: string
      time: string
      status: string
      mood: string
      description: string
      checkInType: string
      isEdited: boolean
    }>
  })

  const fetchOnlineStatusData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/developer/online-status')
      const data = await response.json()

      if (response.ok) {
        setOnlineStatusData(data.data)
        
        // Update today's status if available
        if (data.data.todayStatus) {
          setTodayStatus(data.data.todayStatus.status)
          setTodayMood(data.data.todayStatus.mood || '')
          setTodayDescription(data.data.todayStatus.description || '')
          setTodayCheckInTime(data.data.todayStatus.time || '')
          setTodayCheckInType(data.data.todayStatus.checkInType || 'on-time')
        } else {
          // Reset today's status if no check-in today
          setTodayStatus('not-set')
          setTodayMood('')
          setTodayDescription('')
          setTodayCheckInTime('')
          setTodayCheckInType('on-time')
        }
      } else {
        console.error('Failed to fetch online status data:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch online status data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOnlineStatusData()
  }, [])

  const handleOpenCheckInModal = () => {
    setShowCheckInModal(true)
    setSelectedMood('')
    setDescription('')
  }

  const handleCheckIn = async () => {
    setIsMarkingPresent(true)
    
    try {
      const response = await fetch('/api/developer/online-status/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: selectedMood,
          description: description
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check in')
      }

      // Update state with real data
      setTodayStatus('present')
      setTodayMood(data.checkIn.mood)
      setTodayDescription(data.checkIn.description)
      setTodayCheckInTime(data.checkIn.time)
      setTodayCheckInType(data.checkIn.checkInType)
      setIsMarkingPresent(false)
      setShowCheckInModal(false)
      
      // Refresh the page data
      await fetchOnlineStatusData()
      
    } catch (error) {
      console.error('Check-in error:', error)
      setIsMarkingPresent(false)
      // You might want to show an error message to the user
    }
  }

  const getStatusColor = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.color || 'bg-gray-300'
  }

  const getStatusLabel = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.label || 'Unknown'
  }

  const getCurrentStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getCurrentStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      case 'busy': return 'Busy'
      case 'offline': return 'Offline'
      default: return 'Unknown'
    }
  }

  const getMoodIcon = (mood: string) => {
    const moodOption = moodOptions.find(option => option.value === mood)
    return moodOption ? moodOption.icon : Smile
  }

  const getMoodColor = (mood: string) => {
    const moodOption = moodOptions.find(option => option.value === mood)
    return moodOption ? moodOption.color : 'text-gray-500'
  }

  const getCheckInTypeConfig = (type: string) => {
    return checkInTypeConfig[type as keyof typeof checkInTypeConfig] || checkInTypeConfig['on-time']
  }

  return (
    <ProtectedRoute allowedRoles={['DEVELOPER']}>
      <DashboardLayout
        title="Online Status"
        subtitle="Track your daily presence and availability"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Current Streak */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : onlineStatusData.stats.currentStreak}</p>
                  <p className="text-xs text-gray-500">days</p>
                </div>
              </div>
            </div>

            {/* Longest Streak */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Longest Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : onlineStatusData.stats.longestStreak}</p>
                  <p className="text-xs text-gray-500">days</p>
                </div>
              </div>
            </div>

            {/* Total Days Present */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Present</p>
                  <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : onlineStatusData.stats.totalDaysPresent}</p>
                  <p className="text-xs text-gray-500">days</p>
                </div>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : `${onlineStatusData.stats.attendanceRate}%`}
                  </p>
                  <p className="text-xs text-gray-500">overall</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Action Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mark Your Presence Today</h2>
              <p className="text-gray-600 mb-8">
                Click the button below to signal that you&apos;re available for work today
              </p>

              {/* Current Status Display */}
              <div className="mb-8">
                <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-gray-50 border border-gray-200">
                  <div className={`w-3 h-3 rounded-full ${getCurrentStatusColor(currentStatus)}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    Current Status: {getCurrentStatusLabel(currentStatus)}
                  </span>
                </div>
              </div>

              {/* Today's Status Display */}
              {todayStatus === 'present' && (
                <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-lg font-semibold text-green-800">Present Today</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCheckInTypeConfig(todayCheckInType).bgColor} ${getCheckInTypeConfig(todayCheckInType).color} ${getCheckInTypeConfig(todayCheckInType).borderColor} border`}>
                      {getCheckInTypeConfig(todayCheckInType).icon} {getCheckInTypeConfig(todayCheckInType).label}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">Check-in Time</p>
                      <p className="font-semibold text-gray-900">{todayCheckInTime}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Mood</p>
                      <div className="flex items-center justify-center space-x-1">
                        {React.createElement(getMoodIcon(todayMood), { className: `w-4 h-4 ${getMoodColor(todayMood)}` })}
                        <span className="font-semibold text-gray-900 capitalize">{todayMood}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Description</p>
                      <p className="font-semibold text-gray-900">{todayDescription || 'No description'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Check-in Button */}
              <button
                onClick={handleOpenCheckInModal}
                disabled={isMarkingPresent || todayStatus === 'present'}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  todayStatus === 'present'
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : isMarkingPresent
                    ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                }`}
              >
                {isMarkingPresent ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Marking...</span>
                  </div>
                ) : todayStatus === 'present' ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Already Checked In</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Check In Today</span>
                  </div>
                )}
              </button>

              {/* Organization Check-in Window Info */}
              <div className="mt-4 text-sm text-gray-500">
                <p>Organization check-in window: {onlineStatusData.organizationCheckInWindow.startTime} - {onlineStatusData.organizationCheckInWindow.endTime} ({onlineStatusData.organizationCheckInWindow.timezone})</p>
              </div>
            </div>
          </div>

          {/* Check-in Modal */}
          {showCheckInModal && (
            <div className="fixed inset-0 bg-black/80 transition-opacity flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Check In Today</h3>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Current Time Display */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Time:</span>
                      <span className="font-semibold text-gray-900">{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Check-in Window:</span>
                    <span className="text-sm text-gray-900">{onlineStatusData.organizationCheckInWindow.startTime} - {onlineStatusData.organizationCheckInWindow.endTime}</span>
                    </div>
                  </div>

                  {/* Mood Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">How are you feeling today? (Optional)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {moodOptions.map((mood) => {
                        const IconComponent = mood.icon
                        return (
                          <button
                            key={mood.value}
                            onClick={() => setSelectedMood(mood.value)}
                            className={`p-2 rounded-lg border-2 transition-all ${
                              selectedMood === mood.value
                                ? `border-blue-500 ${mood.bgColor}`
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <IconComponent className={`w-4 h-4 ${mood.color}`} />
                              <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Any additional information about your availability today..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCheckInModal(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCheckIn}
                      disabled={isMarkingPresent}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isMarkingPresent ? 'Checking In...' : 'Check In'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle View Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowCalendar(true)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                showCalendar
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Calendar View
            </button>
            <button
              onClick={() => setShowCalendar(false)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                !showCalendar
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Weekly Activity Grid
            </button>
          </div>

          {/* Calendar View */}
          {showCalendar && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Monthly Calendar View</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading calendar data...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {generateCalendarDays(onlineStatusData.recentActivity.map(activity => ({
                      date: activity.date,
                      status: activity.status
                    }))).map((day, index) => (
                      <div
                        key={index}
                        className={`p-2 text-center text-sm border border-gray-100 ${
                          day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        {day.date && (
                          <div className="flex flex-col items-center space-y-1">
                            <span className={`text-xs ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                              {day.date}
                            </span>
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(day.status)}`}></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Present</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Absent</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-600">Not Set</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Weekly Activity Grid View */}
          {!showCalendar && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Activity Grid</h3>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading activity data...</p>
                </div>
              ) : (
                <>
              {/* Weekly Activity Grid */}
              <div className="w-full">
                <div className="flex space-x-1">
                  {/* Weekday labels on the left - properly aligned with Sunday-Saturday pattern */}
                  <div className="flex flex-col pr-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className={`h-2 text-xs leading-none flex items-center justify-center ${
                        ['Mon', 'Wed', 'Fri'].includes(day) ? 'text-gray-600 font-medium' : 'text-gray-400'
                      }`}>
                        {['Mon', 'Wed', 'Fri'].includes(day) ? day : ''}
                      </div>
                    ))}
                  </div>
                  
                  {/* Month labels at the top */}
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between mb-2">
                      {generateMonthLabels().map((month, index) => (
                        <div key={index} className="text-xs text-gray-400 text-center">
                          {month.name}
                        </div>
                      ))}
                    </div>
                    
                    {/* Weekly Activity Grid - properly structured with Sunday-Saturday weeks */}
                    <div className="grid grid-cols-52 gap-0.5">
                      {generateWeeklyActivityGrid(onlineStatusData.recentActivity.map(activity => ({
                        date: activity.date,
                        status: activity.status
                      }))).map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col">
                          {week.map((day, dayIndex) => (
                            <div
                              key={`${weekIndex}-${dayIndex}`}
                              className={`w-2 h-2 rounded-sm ${getActivityColor(day.status)} hover:scale-150 transition-transform cursor-pointer border border-gray-100`}
                              title={`${day.date}: ${day.status}`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
                  
              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-sm"></div>
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-sm"></div>
                  <span className="text-sm text-gray-600">Not Set</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-4 text-center">
                Hover over the squares to see daily status. Each column represents a week, each row represents a day of the week.
              </p>
                </>
              )}
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="text-gray-500">Loading recent activity...</div>
                </div>
              ) : onlineStatusData.recentActivity.length > 0 ? (
                onlineStatusData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status)}`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description || 'Checked in'}</p>
                        <p className="text-xs text-gray-500">{activity.date} at {activity.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[activity.status as keyof typeof statusConfig]?.bgColor} ${statusConfig[activity.status as keyof typeof statusConfig]?.textColor} ${statusConfig[activity.status as keyof typeof statusConfig]?.borderColor} border`}>
                        {getStatusLabel(activity.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCheckInTypeConfig(activity.checkInType).bgColor} ${getCheckInTypeConfig(activity.checkInType).color} ${getCheckInTypeConfig(activity.checkInType).borderColor} border`}>
                        {getCheckInTypeConfig(activity.checkInType).icon} {getCheckInTypeConfig(activity.checkInType).label}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-500">No recent activity</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// Helper function to generate calendar days for current month
function generateCalendarDays(activityData: Array<{date: string, status: string}>) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const days = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= lastDay || days.length < 42) {
    const isCurrentMonth = currentDate.getMonth() === month
    const date = isCurrentMonth ? currentDate.getDate() : null
    
    // Find status for this date from real activity data
    const dateString = formatDateLocal(currentDate)
    const statusData = activityData.find(d => d.date === dateString)
    const status = statusData ? statusData.status : 'not-set'
    
    days.push({
      date,
      status,
      isCurrentMonth
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return days
}

// Helper function to generate month labels for the contribution graph
function generateMonthLabels() {
  const months = []
  const today = new Date()
  const year = today.getFullYear()
  
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(year, i, 1)
    const daysInMonth = new Date(year, i + 1, 0).getDate()
    const weeksInMonth = Math.ceil(daysInMonth / 7)
    months.push({
      name: monthDate.toLocaleString('default', { month: 'short' }),
      days: daysInMonth,
      weeks: weeksInMonth
    })
  }
  return months
}

// Helper function to generate a weekly activity grid (Sunday-Saturday weeks)
function generateWeeklyActivityGrid(activityData: Array<{date: string, status: string}>) {
  const weeks = []
  const today = new Date()
  const year = today.getFullYear()
  
  // Start from the first Sunday of the year
  const firstSunday = new Date(year, 0, 1)
  const firstSundayDay = firstSunday.getDay() // 0 = Sunday
  const daysToFirstSunday = firstSundayDay === 0 ? 0 : 7 - firstSundayDay
  firstSunday.setDate(firstSunday.getDate() + daysToFirstSunday)
  
  // Generate 52 weeks of data (full year)
  for (let week = 0; week < 52; week++) {
    const weekDays = []
    
    // Generate 7 days for this week (Sunday to Saturday)
    for (let day = 0; day < 7; day++) {
      const date = new Date(firstSunday)
      date.setDate(firstSunday.getDate() + (week * 7) + day)
      
      // Find status for this date from real activity data
      const dateString = formatDateLocal(date)
      const statusData = activityData.find(d => d.date === dateString)
      const status = statusData ? statusData.status : 'not-set'
      
      weekDays.push({
        date: dateString,
        status
      })
    }
    weeks.push(weekDays)
  }
  
  return weeks
}

// Helper function to get color based on status
function getActivityColor(status: string) {
  switch (status) {
    case 'present': return 'bg-green-500'
    case 'absent': return 'bg-red-500'
    case 'not-set': 
    default: return 'bg-gray-300'
  }
}
