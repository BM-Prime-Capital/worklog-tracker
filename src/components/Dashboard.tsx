'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, Clock, TrendingUp, Filter, Download, User } from 'lucide-react'
import StatsCard from './StatsCard'
import WeeklyChart from './WeeklyChart'
import DeveloperList from './DeveloperList'
import TeamOverview from './TeamOverview'
import ProjectWorklogs from './ProjectWorklogs'
import DeveloperWorklogDetails from './DeveloperWorklogDetails'
import DateRangePicker from './DateRangePicker'
import DashboardLayout from './DashboardLayout'
import ExportModal from './ExportModal'
import { useAuth } from '@/contexts/AuthContextNew'
import { jiraApiEnhanced as jiraApi, JiraWorklog } from '@/lib/jiraApiEnhanced'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { Developer } from '@/lib/types'
import JiraTestPanel from './JiraTestPanel'
import PDFExportService from '@/lib/pdfExportService'

// Process worklogs to extract only real data from Jira API
const processWorklogs = (worklogs: {
  author: { displayName: string; emailAddress: string; accountId?: string }
  timeSpentSeconds: number
  issueKey: string
  summary: string
  started: string
}[]) => {
  const developers = new Map<string, {
    id: string
    name: string
    email: string
    hours: number
    tasks: Set<string>
    worklogs: {
      author: { displayName: string; emailAddress: string; accountId?: string }
      timeSpentSeconds: number
      issueKey: string
      summary: string
      started: string
    }[]
  }>()
  
  // Process each worklog entry
  worklogs.forEach(worklog => {
    const author = worklog.author.displayName
    const authorEmail = worklog.author.emailAddress
    const hours = worklog.timeSpentSeconds / 3600
    
    // Aggregate by developer
    if (!developers.has(author)) {
      developers.set(author, {
        id: worklog.author.accountId || `dev-${Date.now()}-${Math.random()}`,
        name: author,
        email: authorEmail,
        hours: 0,
        tasks: new Set(),
        worklogs: []
      })
    }
    
    const dev = developers.get(author)!
    dev.hours += hours
    dev.tasks.add(worklog.issueKey)
    dev.worklogs.push(worklog)
  })
  
  // Convert to array with only real data
  const developersArray = Array.from(developers.values()).map(dev => ({
    id: dev.id,
    name: dev.name,
    email: dev.email,
    hours: Math.round(dev.hours * 100) / 100,
    tasks: dev.tasks.size,
    worklogs: dev.worklogs
  }))
  
  // Sort developers by hours worked (descending)
  developersArray.sort((a, b) => b.hours - a.hours)
  
  return {
    developers: developersArray,
    totalHours: developersArray.reduce((sum, dev) => sum + dev.hours, 0)
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [selectedDateRange, setSelectedDateRange] = useState('this-week')
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    developers: [] as Developer[],
    totalHours: 0,
    activeDevelopers: 0,
    tasksCompleted: 0
  })
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [worklogs, setWorklogs] = useState<JiraWorklog[]>([])

  // Fetch data based on date range.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Get date range
        let startDate: string, endDate: string
        const now = new Date()
        
        switch (selectedDateRange) {
          case 'this-week':
            startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            break
          case 'last-week':
            const lastWeek = subDays(now, 7)
            startDate = format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            endDate = format(endOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            break
          case 'this-month':
            startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
            endDate = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd')
            break
          default:
            startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        }

        // Fetch worklogs
        const worklogData = await jiraApi.getWorklogs(startDate, endDate)
        setWorklogs(worklogData)
        
        // Process worklogs for dashboard
        const processed = processWorklogs(worklogData)
        
        setDashboardData({
          developers: processed.developers,
          totalHours: processed.totalHours,
          activeDevelopers: processed.developers.length,
          tasksCompleted: processed.developers.reduce((sum, dev) => sum + dev.tasks, 0)
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [selectedDateRange, user])

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
      link.download = `worklog-tracker-dashboard-report-${format(exportOptions.startDate, 'yyyy-MM-dd')}-to-${format(exportOptions.endDate, 'yyyy-MM-dd')}.pdf`
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

  return (
    <DashboardLayout
      title="Developer Worklog Dashboard"
      subtitle="Track team productivity and time allocation"
      actions={
        <div className="flex items-center space-x-3">
          <DateRangePicker 
            value={selectedDateRange} 
            onChange={setSelectedDateRange} 
          />
          <button 
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            Test Jira
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Test Panel */}
        {showTestPanel && (
          <div className="mb-8">
            <JiraTestPanel />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Hours"
            value={isLoading ? "..." : Math.round(dashboardData.totalHours).toString()}
            change=""
            changeType="neutral"
            icon={Clock}
            description="Logged this period"
          />
          <StatsCard
            title="Active Developers"
            value={isLoading ? "..." : dashboardData.activeDevelopers.toString()}
            change=""
            changeType="neutral"
            icon={Users}
            description="With logged time"
          />
          <StatsCard
            title="Tasks Worked On"
            value={isLoading ? "..." : dashboardData.tasksCompleted.toString()}
            change=""
            changeType="neutral"
            icon={Calendar}
            description="Unique issues"
          />
          <StatsCard
            title="Average Hours"
            value={isLoading ? "..." : dashboardData.activeDevelopers > 0 ? Math.round(dashboardData.totalHours / dashboardData.activeDevelopers).toString() : "0"}
            change=""
            changeType="neutral"
            icon={TrendingUp}
            description="Per developer"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Weekly Hours Overview</h2>
              </div>
              <WeeklyChart 
                developers={dashboardData.developers} 
                isLoading={isLoading}
                dateRange={selectedDateRange as 'this-week' | 'last-week' | 'this-month'}
              />
            </div>
          </div>

          {/* Team Overview */}
          <div className="lg:col-span-1">
            <TeamOverview developers={dashboardData.developers} isLoading={isLoading} />
          </div>
        </div>

        {/* Project Worklogs */}
        <div className="mt-8">
          <ProjectWorklogs developers={dashboardData.developers} isLoading={isLoading} />
        </div>

        {/* Developer Worklog Details */}
        <div className="mt-8">
          <DeveloperWorklogDetails developers={dashboardData.developers} isLoading={isLoading} />
        </div>

        {/* Developer List */}
        <div className="mt-8">
          <DeveloperList developers={dashboardData.developers} isLoading={isLoading} />
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        worklogs={worklogs}
        onExport={handleExport}
      />
    </DashboardLayout>
  )
} 