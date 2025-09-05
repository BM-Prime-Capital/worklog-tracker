'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react'
import StatsCard from './StatsCard'
import WeeklyChart from './WeeklyChart'
import DeveloperList from './DeveloperList'
import TeamOverview from './TeamOverview'
import ProjectWorklogs from './ProjectWorklogs'
import DeveloperWorklogDetails from './DeveloperWorklogDetails'
import ExportModal from './ExportModal'
import { useSession } from 'next-auth/react'
import { jiraApiEnhanced as jiraApi, JiraWorklog } from '@/lib/jiraApiEnhanced'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { Developer } from '@/lib/types'
import JiraTestPanel from './JiraTestPanel'
import PDFExportService from '@/lib/pdfExportService'
import JiraSetupModal from './JiraSetupModal'

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

export interface DashboardProps {
  selectedDateRange: string
  onDateRangeChange: (range: string) => void
  showTestPanel: boolean
  onToggleTestPanel: () => void
  isExportModalOpen: boolean
  onOpenExportModal: () => void
  onCloseExportModal: () => void
}

export default function Dashboard(props: DashboardProps) {
  const {
    selectedDateRange,
    showTestPanel,
    isExportModalOpen,
    onCloseExportModal
  } = props
  
  const { data: session } = useSession()
  const user = session?.user
  const [isLoading, setIsLoading] = useState(true)
  const [hasJiraCredentials, setHasJiraCredentials] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    developers: [] as Developer[],
    totalHours: 0,
    activeDevelopers: 0,
    tasksCompleted: 0
  })
  const [worklogs, setWorklogs] = useState<JiraWorklog[]>([])
  const [isJiraSetupModalOpen, setIsJiraSetupModalOpen] = useState(false)

  // Check if user has Jira credentials
  useEffect(() => {
    const checkJiraCredentials = async () => {
      const userWithJira = user as typeof user & { jiraOrganization?: { domain: string; email: string; apiToken: string } } // Type assertion for NextAuth extended user
      if (userWithJira?.jiraOrganization) {
        setHasJiraCredentials(true)
        // Set credentials in Jira API service
        await jiraApi.setCredentialsFromUser(userWithJira)
      } else {
        setHasJiraCredentials(false)
        setIsLoading(false)
      }
    }

    if (user) {
      checkJiraCredentials()
    }
  }, [user])

  // Fetch data based on date range
  useEffect(() => {
    const fetchData = async () => {
      if (!hasJiraCredentials) return

      try {
        setIsLoading(true)
        
        // Get date range
        let startDate: string, endDate: string
        const now = new Date()
        
        console.log('Dashboard: Selected date range:', selectedDateRange)
        
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
          case 'last-month':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            startDate = format(lastMonth, 'yyyy-MM-dd')
            endDate = format(new Date(now.getFullYear(), now.getMonth(), 0), 'yyyy-MM-dd')
            break
          case 'yesterday':
            const yesterday = subDays(now, 1)
            startDate = format(yesterday, 'yyyy-MM-dd')
            endDate = format(yesterday, 'yyyy-MM-dd')
            break
          case 'today':
            startDate = format(now, 'yyyy-MM-dd')
            endDate = format(now, 'yyyy-MM-dd')
            break
          default:
            startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        }
        
        console.log('Dashboard: Date range calculated:', { startDate, endDate })

        // Fetch worklogs
        const worklogData = await jiraApi.getWorklogs(startDate, endDate)
        setWorklogs(worklogData)
        
        // Process worklogs for dashboard
        const processed = processWorklogs(worklogData)
        
        console.log('Dashboard: Processed data:', {
          developersCount: processed.developers.length,
          totalHours: processed.totalHours,
          dateRange: { startDate, endDate }
        })
        
        setDashboardData({
          developers: processed.developers,
          totalHours: processed.totalHours,
          activeDevelopers: processed.developers.length,
          tasksCompleted: processed.developers.reduce((sum, dev) => sum + dev.tasks, 0)
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set empty data on error
        setDashboardData({
          developers: [],
          totalHours: 0,
          activeDevelopers: 0,
          tasksCompleted: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (hasJiraCredentials) {
      fetchData()
    }
  }, [selectedDateRange, hasJiraCredentials])

  const handleJiraSetup = async (credentials: { domain: string; email: string; apiToken: string }) => {
    try {
      // Update user's Jira organization in the database
      const response = await fetch('/api/user/jira-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        throw new Error('Failed to update Jira organization')
      }

      // Set credentials in Jira API service
      await jiraApi.setCredentialsFromUser({
        jiraOrganization: credentials
      })

      // Update local state
      setHasJiraCredentials(true)
      
      // Refresh user data to get updated Jira organization
      // This would typically trigger a refresh of the auth context
      window.location.reload()
    } catch (error) {
      console.error('Error setting up Jira integration:', error)
      throw error
    }
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
        const endTime = exportOptions.exportTimestamp.getTime()
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
    <div className="max-w-7xl mx-auto">
      {/* Jira Setup Message */}
      {!hasJiraCredentials && !isLoading && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Jira Integration Required
              </h3>
              <p className="text-blue-700 mb-4">
                To view dashboard data, you need to set up your Jira organization credentials. 
                This will allow the system to fetch worklog data from your Jira instance.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsJiraSetupModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Set Up Jira Integration
                </button>
                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          value={!hasJiraCredentials ? "N/A" : isLoading ? "..." : Math.round(dashboardData.totalHours).toString()}
          change=""
          changeType="neutral"
          icon={Clock}
          description={!hasJiraCredentials ? "Jira not configured" : "Logged this period"}
        />
        <StatsCard
          title="Active Developers"
          value={!hasJiraCredentials ? "N/A" : isLoading ? "..." : dashboardData.activeDevelopers.toString()}
          change=""
          changeType="neutral"
          icon={Users}
          description={!hasJiraCredentials ? "Jira not configured" : "With logged time"}
        />
        <StatsCard
          title="Tasks Worked On"
          value={!hasJiraCredentials ? "N/A" : isLoading ? "..." : dashboardData.tasksCompleted.toString()}
          change=""
          changeType="neutral"
          icon={Calendar}
          description={!hasJiraCredentials ? "Jira not configured" : "Unique issues"}
        />
        <StatsCard
          title="Average Hours"
          value={!hasJiraCredentials ? "N/A" : isLoading ? "..." : dashboardData.activeDevelopers > 0 ? Math.round(dashboardData.totalHours / dashboardData.activeDevelopers).toString() : "0"}
          change=""
          changeType="neutral"
          icon={TrendingUp}
          description={!hasJiraCredentials ? "Jira not configured" : "Per developer"}
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
            {!hasJiraCredentials ? (
              <div className="text-center py-12 text-gray-500">
                <p>Configure Jira integration to view weekly hours data</p>
              </div>
            ) : (
              <WeeklyChart 
                developers={dashboardData.developers} 
                isLoading={isLoading}
                dateRange={selectedDateRange as 'this-week' | 'last-week' | 'this-month'}
              />
            )}
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

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={onCloseExportModal}
        worklogs={worklogs}
        onExport={handleExport}
      />

      <JiraSetupModal
        isOpen={isJiraSetupModalOpen}
        onClose={() => setIsJiraSetupModalOpen(false)}
        onSetup={handleJiraSetup}
      />
    </div>
  )
} 