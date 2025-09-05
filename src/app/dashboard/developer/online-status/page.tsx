'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, TrendingUp, Award, Target, Users } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContextNew'

// Mock data for online status
const mockOnlineStatusData = {
  currentStreak: 12,
  longestStreak: 28,
  totalDaysPresent: 156,
  totalDaysTracked: 180,
  currentStatus: 'online', // 'online', 'away', 'busy', 'offline'
  lastUpdated: '2 hours ago',
  todayStatus: 'present', // 'present', 'absent', 'not-set'
  weeklyStats: {
    thisWeek: 5,
    lastWeek: 7,
    change: '+2'
  },
  monthlyStats: {
    thisMonth: 18,
    lastMonth: 22,
    change: '-4'
  },
  // Calendar data for the last 6 months (180 days)
  calendarData: generateMockCalendarData(),
  // Recent activity
  recentActivity: [
    { date: '2024-01-15', time: '09:15', status: 'present', note: 'Started work' },
    { date: '2024-01-14', time: '09:30', status: 'present', note: 'Team meeting day' },
    { date: '2024-01-13', time: '10:00', status: 'present', note: 'Weekend work' },
    { date: '2024-01-12', time: '09:00', status: 'present', note: 'Regular start' },
    { date: '2024-01-11', time: '09:15', status: 'present', note: 'Code review day' },
    { date: '2024-01-10', time: '09:00', status: 'present', note: 'Sprint planning' },
    { date: '2024-01-09', time: '09:30', status: 'absent', note: 'Sick day' },
    { date: '2024-01-08', time: '09:00', status: 'present', note: 'Regular start' },
  ]
}

// Generate mock calendar data for the last 180 days
function generateMockCalendarData() {
  const data = []
  const today = new Date()
  
  for (let i = 179; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Randomly generate presence data (70% present, 20% absent, 10% not set)
    const random = Math.random()
    let status = 'not-set'
    if (random < 0.7) status = 'present'
    else if (random < 0.9) status = 'absent'
    
    data.push({
      date: date.toISOString().split('T')[0],
      status,
      note: status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Not set'
    })
  }
  
  return data
}

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

export default function OnlineStatusPage() {
  const { user } = useAuth()
  const [isMarkingPresent, setIsMarkingPresent] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(mockOnlineStatusData.currentStatus)
  const [todayStatus, setTodayStatus] = useState(mockOnlineStatusData.todayStatus)
  const [showCalendar, setShowCalendar] = useState(true)

  const handleMarkPresent = async () => {
    setIsMarkingPresent(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setTodayStatus('present')
    setIsMarkingPresent(false)
    
    // Update mock data
    mockOnlineStatusData.todayStatus = 'present'
    mockOnlineStatusData.currentStreak += 1
    mockOnlineStatusData.totalDaysPresent += 1
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
                  <p className="text-2xl font-bold text-gray-900">{mockOnlineStatusData.currentStreak}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{mockOnlineStatusData.longestStreak}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{mockOnlineStatusData.totalDaysPresent}</p>
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
                    {Math.round((mockOnlineStatusData.totalDaysPresent / mockOnlineStatusData.totalDaysTracked) * 100)}%
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

              {/* Mark Present Button */}
              <button
                onClick={handleMarkPresent}
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
                    <span>Already Marked Present</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Mark Me Present Today</span>
                  </div>
                )}
              </button>

              {todayStatus === 'present' && (
                <p className="text-green-600 text-sm mt-3">
                  ✓ You&apos;ve marked yourself present for today!
                </p>
              )}
            </div>
          </div>

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
              Contribution Graph
            </button>
          </div>

          {/* Calendar View */}
          {showCalendar && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Monthly Calendar View</h3>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {generateCalendarDays().map((day, index) => (
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
            </div>
          )}

          {/* Contribution Graph View (GitHub-style) */}
          {!showCalendar && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Contribution Graph</h3>
              
              {/* GitHub-style contribution grid */}
              <div className="w-full">
                <div className="flex space-x-1">
                  {/* Weekday labels on the left */}
                  <div className="flex flex-col space-y-1 pr-3">
                    {['Mon', 'Wed', 'Fri'].map(day => (
                      <div key={day} className="h-2 text-xs text-gray-400 leading-none">
                        {day}
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
                    
                    {/* Contribution grid */}
                    <div className="grid grid-cols-52 gap-0.5">
                      {generateContributionGrid().map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col space-y-0.5">
                          {week.map((day, dayIndex) => (
                            <div
                              key={`${weekIndex}-${dayIndex}`}
                              className={`w-2 h-2 rounded-sm ${getContributionColor(day.level)} hover:scale-150 transition-transform cursor-pointer border border-gray-100`}
                              title={`${day.date}: ${day.status} (${day.level} activity)`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 mt-6 pt-6 border-t border-gray-200">
                <span className="text-sm text-gray-500">Less</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-100 rounded-sm border border-gray-200"></div>
                  <div className="w-2 h-2 bg-gray-200 rounded-sm border border-gray-200"></div>
                  <div className="w-2 h-2 bg-green-200 rounded-sm border border-gray-200"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-sm border border-gray-200"></div>
                  <div className="w-2 h-2 bg-green-600 rounded-sm border border-gray-200"></div>
                  <div className="w-2 h-2 bg-green-800 rounded-sm border border-gray-200"></div>
                </div>
                <span className="text-sm text-gray-500">More</span>
              </div>
              
              <p className="text-sm text-gray-500 mt-4 text-center">
                Hover over the squares to see daily status and activity level
              </p>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-3">
              {mockOnlineStatusData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status)}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.note}</p>
                      <p className="text-xs text-gray-500">{activity.date} at {activity.time}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[activity.status as keyof typeof statusConfig]?.bgColor} ${statusConfig[activity.status as keyof typeof statusConfig]?.textColor} ${statusConfig[activity.status as keyof typeof statusConfig]?.borderColor} border`}>
                    {getStatusLabel(activity.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// Helper function to generate calendar days for current month
function generateCalendarDays() {
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
    
    // Find status for this date
    const dateString = currentDate.toISOString().split('T')[0]
    const statusData = mockOnlineStatusData.calendarData.find(d => d.date === dateString)
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

// Helper function to generate a grid of weeks for the contribution graph
function generateContributionGrid() {
  const weeks = []
  const today = new Date()
  const year = today.getFullYear()
  
  // Generate 52 weeks of data (full year)
  for (let week = 0; week < 52; week++) {
    const weekDays = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(year, 0, 1) // Start from January 1st
      date.setDate(date.getDate() + (week * 7) + day)
      
      // Find status for this date from mock data
      const dateString = date.toISOString().split('T')[0]
      const statusData = mockOnlineStatusData.calendarData.find(d => d.date === dateString)
      const status = statusData ? statusData.status : 'not-set'
      
      // Generate activity level based on status
      let level = 0
      if (status === 'present') {
        level = Math.floor(Math.random() * 4) + 2 // 2-5 for present days
      } else if (status === 'absent') {
        level = 1 // Low activity for absent days
      } else {
        level = 0 // No activity for not-set days
      }
      
      weekDays.push({
        date: dateString,
        status,
        level
      })
    }
    weeks.push(weekDays)
  }
  
  return weeks
}

// Helper function to get color based on activity level
function getContributionColor(level: number) {
  switch (level) {
    case 0: return 'bg-gray-100'
    case 1: return 'bg-gray-200'
    case 2: return 'bg-green-200'
    case 3: return 'bg-green-400'
    case 4: return 'bg-green-600'
    case 5: return 'bg-green-800'
    default: return 'bg-gray-100'
  }
}
