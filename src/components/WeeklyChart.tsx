'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
  TooltipProps
} from 'recharts'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, isSameDay } from 'date-fns'
import { Clock, TrendingUp, TrendingDown, Calendar } from 'lucide-react'

interface WeeklyChartProps {
  developers?: Array<{
    id: string
    name: string
    email?: string
    hours: number
    tasks: number
    worklogs?: Array<{
      author: { displayName: string; emailAddress: string; accountId?: string }
      timeSpentSeconds: number
      issueKey: string
      summary: string
      started: string
    }>
  }>
  isLoading?: boolean
  dateRange?: 'this-week' | 'last-week' | 'this-month'
}

interface DailyData {
  day: string
  totalHours: number
  developerCount: number
  tasksCompleted: number
  date: string
}

interface DeveloperDailyData {
  name: string
  [key: string]: number | string
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

export default function WeeklyChart({ developers = [], isLoading = false, dateRange = 'this-week' }: WeeklyChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')
  const [viewMode, setViewMode] = useState<'daily' | 'developer'>('daily')

  // Calculate date range for the current week
  const dateRangeData = useMemo(() => {
    const now = new Date()
    let startDate: Date, endDate: Date
    
    switch (dateRange) {
      case 'last-week':
        startDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        endDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        break
      case 'this-week':
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        endDate = endOfWeek(now, { weekStartsOn: 1 })
        break
    }
    
    return { startDate, endDate }
  }, [dateRange])

  // Generate daily data for the week
  const dailyData = useMemo(() => {
    if (!developers || developers.length === 0) {
      return []
    }

    const { startDate, endDate } = dateRangeData
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    
    const dailyStats: DailyData[] = days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      const dayWorklogs = developers.flatMap(dev => 
        dev.worklogs?.filter(worklog => {
          const worklogDate = new Date(worklog.started)
          return isSameDay(worklogDate, day)
        }) || []
      )
      
      const totalHours = dayWorklogs.reduce((sum, worklog) => 
        sum + (worklog.timeSpentSeconds / 3600), 0
      )
      
      const uniqueDevelopers = new Set(dayWorklogs.map(w => w.author.displayName))
      const uniqueTasks = new Set(dayWorklogs.map(w => w.issueKey))
      
      return {
        day: format(day, 'EEE'),
        date: dayKey,
        totalHours: Math.round(totalHours * 100) / 100,
        developerCount: uniqueDevelopers.size,
        tasksCompleted: uniqueTasks.size
      }
    })
    
    return dailyStats
  }, [developers, dateRangeData])

  // Generate developer comparison data
  const developerData = useMemo(() => {
    if (!developers || developers.length === 0) {
      return []
    }

    const { startDate, endDate } = dateRangeData
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    
    const developerDailyData: DeveloperDailyData[] = days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      const dayData: DeveloperDailyData = {
        name: format(day, 'EEE'),
        date: dayKey
      }
      
      // Add hours for each developer
      developers.forEach(dev => {
        const dayWorklogs = dev.worklogs?.filter(worklog => {
          const worklogDate = new Date(worklog.started)
          return isSameDay(worklogDate, day)
        }) || []
        
        const hours = dayWorklogs.reduce((sum, worklog) => 
          sum + (worklog.timeSpentSeconds / 3600), 0
        )
        
        dayData[dev.name] = Math.round(hours * 100) / 100
      })
      
      return dayData
    })
    
    return developerDailyData
  }, [developers, dateRangeData])

  // Calculate week-over-week change
  const weekOverWeekChange = useMemo(() => {
    if (dailyData.length < 2) return 0
    
    const currentWeekTotal = dailyData.reduce((sum, day) => sum + day.totalHours, 0)
    const previousWeekTotal = 0 // This would need to be calculated from previous week data
    
    if (previousWeekTotal === 0) return 0
    
    return ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
  }, [dailyData])

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} hours
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart data...</p>
        </div>
      </div>
    )
  }

  if (!developers || developers.length === 0) {
  return (
    <div className="w-full h-80 flex items-center justify-center">
      <div className="text-center">
        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">
            No worklog data found for the selected period.
          </p>
        </div>
      </div>
    )
  }

  const chartData = viewMode === 'daily' ? dailyData : developerData

  // Render the appropriate chart based on type and view mode
  const renderChart = () => {
    if (chartType === 'line' && viewMode === 'daily') {
      return (
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="totalHours" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      )
    }

    if (chartType === 'bar' && viewMode === 'daily') {
      return (
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="totalHours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      )
    }

    if (chartType === 'area' && viewMode === 'daily') {
      return (
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="totalHours" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      )
    }

    if (chartType === 'line' && viewMode === 'developer') {
      return (
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {developers.map((dev, index) => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
            const color = colors[index % colors.length]
            return (
              <Line 
                key={dev.name}
                type="monotone" 
                dataKey={dev.name} 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
              />
            )
          })}
        </LineChart>
      )
    }

    if (chartType === 'bar' && viewMode === 'developer') {
      return (
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {developers.map((dev, index) => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
            const color = colors[index % colors.length]
            return (
              <Bar key={dev.name} dataKey={dev.name} fill={color} radius={[4, 4, 0, 0]} />
            )
          })}
        </BarChart>
      )
    }

    // Default fallback
    return (
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="totalHours" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
        />
      </LineChart>
    )
  }

  return (
    <div className="w-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily Overview
            </button>
            <button
              onClick={() => setViewMode('developer')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'developer'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Developer Comparison
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === 'area'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Area
            </button>
          </div>
        </div>

        {/* Week-over-week change indicator */}
        {weekOverWeekChange !== 0 && (
          <div className="flex items-center space-x-2">
            {weekOverWeekChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              weekOverWeekChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {weekOverWeekChange > 0 ? '+' : ''}{weekOverWeekChange.toFixed(1)}% vs last week
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {dailyData.reduce((sum, day) => sum + day.totalHours, 0).toFixed(1)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Daily</p>
              <p className="text-2xl font-bold text-gray-900">
                {(dailyData.reduce((sum, day) => sum + day.totalHours, 0) / Math.max(dailyData.length, 1)).toFixed(1)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peak Day</p>
              <p className="text-2xl font-bold text-gray-900">
                {dailyData.length > 0 
                  ? dailyData.reduce((max, day) => day.totalHours > max.totalHours ? day : max).day
                  : 'N/A'
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  )
} 