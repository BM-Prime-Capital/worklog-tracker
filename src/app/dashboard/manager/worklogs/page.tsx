'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContextNew'
import { jiraApiEnhanced as jiraApi, JiraWorklog } from '@/lib/jiraApiEnhanced'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { Calendar, Clock, Filter, Download, CalendarDays, CalendarRange, CalendarCheck } from 'lucide-react'
import WorklogCalendar from '@/components/WorklogCalendar'
import WorklogTable from '@/components/WorklogTable'
import WorklogStats from '@/components/WorklogStats'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ExportModal from '@/components/ExportModal'
import PDFExportService from '@/lib/pdfExportService'

export default function WorklogsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [worklogs, setWorklogs] = useState<JiraWorklog[]>([])
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  })
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Calculate date range based on filter type
  useEffect(() => {
    let start: Date, end: Date

    switch (filterType) {
      case 'day':
        start = selectedDate
        end = selectedDate
        break
      case 'week':
        start = startOfWeek(selectedDate, { weekStartsOn: 1 })
        end = endOfWeek(selectedDate, { weekStartsOn: 1 })
        break
      case 'month':
        start = startOfMonth(selectedDate)
        end = endOfMonth(selectedDate)
        break
      default:
        start = startOfWeek(selectedDate, { weekStartsOn: 1 })
        end = endOfWeek(selectedDate, { weekStartsOn: 1 })
    }

    setDateRange({ start, end })
  }, [filterType, selectedDate])

  // Fetch worklogs based on date range
  useEffect(() => {
    const fetchWorklogs = async () => {
      try {
        setIsDataLoading(true)

        const startDate = format(dateRange.start, 'yyyy-MM-dd')
        const endDate = format(dateRange.end, 'yyyy-MM-dd')

        // console.log('Fetching worklogs for date range:', startDate, 'to', endDate)
        // console.log('Filter type:', filterType)
        // console.log('Selected date:', selectedDate.toISOString())
        // console.log('Date range start:', dateRange.start.toISOString())
        // console.log('Date range end:', dateRange.end.toISOString())

        const worklogData = await jiraApi.getWorklogs(startDate, endDate)

        // console.log('Received worklogs:', worklogData.length)
        setWorklogs(worklogData)
      } catch (error) {
        console.error('Error fetching worklogs:', error)
        setWorklogs([])
      } finally {
        setIsDataLoading(false)
      }
    }

    if (user) {
      fetchWorklogs()
    }
  }, [dateRange, user, filterType, selectedDate])

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const handleFilterTypeChange = (type: 'day' | 'week' | 'month') => {
    setFilterType(type)
  }

  const getFilterTypeLabel = () => {
    switch (filterType) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy')
      case 'week':
        return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
      case 'month':
        return format(selectedDate, 'MMMM yyyy')
      default:
        return ''
    }
  }

  const getTotalHours = () => {
    return worklogs.reduce((total, worklog) => total + (worklog.timeSpentSeconds / 3600), 0)
  }

  const getUniqueDevelopers = () => {
    const developers = new Set(worklogs.map(w => w.author.displayName))
    return developers.size
  }

  const getUniqueIssues = () => {
    const issues = new Set(worklogs.map(w => w.issueKey))
    return issues.size
  }

  const handleExport = async (exportOptions: {
    startDate: Date
    endDate: Date
    includeIndividualReports: boolean
    exportTimestamp: Date
  }) => {
    try {
      const pdfService = new PDFExportService()

      // Filter worklogs for the export period
      const filteredWorklogs = worklogs.filter(worklog => {
        const worklogTime = new Date(worklog.started).getTime()
        const startTime = exportOptions.startDate.getTime()
        const endTime = exportOptions.endDate.getTime()
        return worklogTime >= startTime && worklogTime <= endTime
      })

      // Generate PDF
      const pdfBlob = await pdfService.exportWorklogReport({
        startDate: exportOptions.startDate,
        endDate: exportOptions.endDate,
        worklogs: filteredWorklogs,
        exportTimestamp: exportOptions.exportTimestamp,
        includeIndividualReports: exportOptions.includeIndividualReports
      })

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `worklog-report-${format(exportOptions.startDate, 'yyyy-MM-dd')}-to-${format(exportOptions.endDate, 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('PDF export completed successfully')
    } catch (error) {
      console.error('PDF export failed:', error)
      throw new Error('Failed to generate PDF report')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading worklogs...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Worklog Details"
      subtitle="Detailed view of time tracking and worklog entries"
      actions={
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Worklogs</h2>

              {/* Filter Type Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFilterTypeChange('day')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterType === 'day'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 mr-1" />
                  Day
                </button>
                <button
                  onClick={() => handleFilterTypeChange('week')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterType === 'week'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CalendarRange className="w-4 h-4 mr-1" />
                  Week
                </button>
                <button
                  onClick={() => handleFilterTypeChange('month')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterType === 'month'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 mr-1" />
                  Month
                </button>
              </div>
            </div>

            {/* Date Range Display */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{getFilterTypeLabel()}</span>
            </div>
          </div>

          {/* Calendar Component */}
          <div className="mt-6">
            <WorklogCalendar
              selectedDate={selectedDate}
              filterType={filterType}
              onDateChange={handleDateChange}
              worklogs={worklogs}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <WorklogStats
            totalHours={getTotalHours()}
            totalEntries={worklogs.length}
            uniqueDevelopers={getUniqueDevelopers()}
            uniqueIssues={getUniqueIssues()}
            isLoading={isDataLoading}
          />
        </div>

        {/* Worklog Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50">
          <WorklogTable
            worklogs={worklogs}
            isLoading={isDataLoading}
            dateRange={dateRange}
          />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        worklogs={worklogs}
        onExport={handleExport}
      />
    </DashboardLayout>
  )
}
