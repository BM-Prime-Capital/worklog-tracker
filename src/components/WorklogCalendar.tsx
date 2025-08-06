'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { JiraWorklog } from '@/lib/jiraApiEnhanced'

interface WorklogCalendarProps {
  selectedDate: Date
  filterType: 'day' | 'week' | 'month'
  onDateChange: (date: Date) => void
  worklogs: JiraWorklog[]
}

export default function WorklogCalendar({ selectedDate, filterType, onDateChange, worklogs }: WorklogCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)

  // Get calendar days for the current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Group worklogs by date with timezone handling
  const worklogsByDate = worklogs.reduce((acc, worklog) => {
    // Parse the date and convert to local timezone
    const worklogDate = new Date(worklog.started)
    // Use the local date string to avoid timezone issues
    const date = worklogDate.toLocaleDateString('en-CA') // Returns YYYY-MM-DD format
    console.log('Worklog date processing:', worklog.started, '->', worklogDate.toISOString(), '->', date)
    
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(worklog)
    return acc
  }, {} as Record<string, JiraWorklog[]>)
  
  console.log('Available worklog dates:', Object.keys(worklogsByDate))
  console.log('Worklogs by date:', worklogsByDate)

  // Calculate total hours for a specific date
  const getHoursForDate = (date: Date) => {
    const dateKey = date.toLocaleDateString('en-CA') // Use same format as worklog grouping
    console.log('Getting hours for date:', format(date, 'yyyy-MM-dd'), '->', dateKey)
    const dayWorklogs = worklogsByDate[dateKey] || []
    const hours = dayWorklogs.reduce((total, worklog) => total + (worklog.timeSpentSeconds / 3600), 0)
    console.log('Found', dayWorklogs.length, 'worklogs for', dateKey, 'with', hours, 'hours')
    return hours
  }

  // Check if date is in selected range
  const isInSelectedRange = (date: Date) => {
    switch (filterType) {
      case 'day':
        const isDaySelected = isSameDay(date, selectedDate)
        console.log('Day check:', format(date, 'yyyy-MM-dd'), 'vs', format(selectedDate, 'yyyy-MM-dd'), '=', isDaySelected)
        return isDaySelected
      case 'week':
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
        const isInWeek = isWithinInterval(date, { start: weekStart, end: weekEnd })
        console.log('Week check:', format(date, 'yyyy-MM-dd'), 'in week', format(weekStart, 'yyyy-MM-dd'), 'to', format(weekEnd, 'yyyy-MM-dd'), '=', isInWeek)
        return isInWeek
      case 'month':
        return isSameMonth(date, selectedDate)
      default:
        return false
    }
  }

  // Check if date has worklogs
  const hasWorklogs = (date: Date) => {
    const dateKey = date.toLocaleDateString('en-CA') // Use same format as worklog grouping
    const hasData = worklogsByDate[dateKey] && worklogsByDate[dateKey].length > 0
    console.log('Checking worklogs for date:', format(date, 'yyyy-MM-dd'), '->', dateKey, '=', hasData)
    return hasData
  }

  const handleDateClick = (date: Date) => {
    onDateChange(date)
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const getDayClassName = (date: Date) => {
    const baseClasses = "w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer transition-all duration-200"
    
    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-300`
    }
    
    if (isInSelectedRange(date)) {
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`
    }
    
    if (hasWorklogs(date)) {
      return `${baseClasses} bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300`
    }
    
    return `${baseClasses} text-gray-700 hover:bg-gray-100`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="w-10 h-10 flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const hours = getHoursForDate(day)
          const hasWorklogData = hasWorklogs(day)
          
          return (
            <div key={index} className="relative">
              <button
                onClick={() => handleDateClick(day)}
                className={getDayClassName(day)}
              >
                {format(day, 'd')}
              </button>
              
              {/* Hours indicator */}
              {hasWorklogData && hours > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {hours >= 8 ? '8+' : Math.round(hours)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-gray-600">Has Worklogs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span className="text-gray-600">No Data</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {filterType === 'day' && hasWorklogs(selectedDate) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">
                {Math.round(getHoursForDate(selectedDate) * 100) / 100}h logged
              </span>
            </div>
            <div className="text-gray-400">•</div>
            <span className="text-gray-600">
              {worklogsByDate[format(selectedDate, 'yyyy-MM-dd')]?.length || 0} entries
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 