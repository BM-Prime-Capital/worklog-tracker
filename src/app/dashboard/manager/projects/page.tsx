'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { jiraApiEnhanced as jiraApi } from '@/lib/jiraApiEnhanced'
import {
  FolderOpen,
  Clock,
  Users,
  Calendar,
  ExternalLink,
  Search,
  Activity,
  MoreVertical,
  CheckCircle,
  Archive
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Project {
  id: string
  key: string
  name: string
  description?: string
  lead?: {
    displayName: string
    emailAddress: string
  }
  projectTypeKey: string
  simplified: boolean
  style: string
  isPrivate: boolean
  issueTypes?: unknown[]
  components?: unknown[]
  roles?: unknown[]
  avatarUrls?: {
    '16x16': string
    '24x24': string
    '32x32': string
    '48x48': string
  }
  projectCategory?: {
    name: string
    description: string
  }
  projectKeys?: string[]
  archived?: boolean
  archivedDate?: string
  archivedBy?: {
    displayName: string
  }
  totalIssues?: number
  doneIssues?: number
  progressPercentage?: number
}

interface Issue {
  id: string
  key: string
  fields: {
    summary: string
    status: {
      name: string
      statusCategory: {
        name: string
        key: string
      }
    }
    assignee?: {
      displayName: string
      emailAddress: string
    }
    reporter?: {
      displayName: string
      emailAddress: string
    }
    created: string
    updated: string
    priority?: {
      name: string
      iconUrl: string
    }
    issuetype: {
      name: string
      iconUrl: string
    }
    project: {
      key: string
      name: string
    }
  }
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [recentIssues, setRecentIssues] = useState<Issue[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'key' | 'updated'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch projects and recent issues from Jira
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDataLoading(true)

        // Fetch projects
        const projectsData = await jiraApi.getProjects()
        console.log('Projects data:', projectsData)

        // Fetch recent issues (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Try to get issues from all projects
        let issuesData = await jiraApi.getIssues([], 50) // Get up to 50 recent issues
        console.log('Raw Issues data from getIssues:', issuesData)
        console.log('Issues data type:', typeof issuesData)
        console.log('Issues data length:', Array.isArray(issuesData) ? issuesData.length : 'Not an array')

        // If no issues found, try the new recent issues method
        if (!Array.isArray(issuesData) || issuesData.length === 0) {
          console.log('No issues from getIssues, trying getRecentIssues...')
          try {
            issuesData = await jiraApi.getRecentIssues(50)
            console.log('Raw Issues data from getRecentIssues:', issuesData)
          } catch (recentError) {
            console.error('Error fetching recent issues:', recentError)
            issuesData = []
          }
        }

        if (Array.isArray(issuesData) && issuesData.length > 0) {
          console.log('First issue structure:', issuesData[0])
        }

                // Validate and filter data
        const validProjects = Array.isArray(projectsData) ? projectsData.filter(project => {
          if (project && typeof project === 'object' && project !== null) {
            const projectObj = project as { id?: string; key?: string; name?: string }
            return projectObj.id && projectObj.key && projectObj.name
          }
          return false
        }) : []

        // Fetch comprehensive stats for each project
        console.log('Fetching project stats...')
        const projectsWithStats = await Promise.all(
          validProjects.map(async (project) => {
            const projectObj = project as { id: string; key: string; name: string; [key: string]: unknown }
            try {
              const stats = await jiraApi.getProjectStats(projectObj.key)
              return {
                ...projectObj,
                totalIssues: stats.totalIssues,
                doneIssues: stats.doneIssues,
                progressPercentage: stats.progressPercentage
              }
            } catch (error) {
              console.error(`Error fetching stats for project ${projectObj.key}:`, error)
              return {
                ...projectObj,
                totalIssues: 0,
                doneIssues: 0,
                progressPercentage: 0
              }
            }
          })
        )

        let validIssues = Array.isArray(issuesData) ? issuesData.filter(issue => {
          if (issue && typeof issue === 'object' && issue !== null) {
            const issueObj = issue as { id?: string; key?: string; fields?: unknown }
            return issueObj.id && issueObj.key && issueObj.fields
          }
          return false
        }) : []

        // If no issues found, try to get issues from worklogs
        if (validIssues.length === 0) {
          console.log('No issues found, trying to get issues from worklogs...')
          try {
            const today = new Date()
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(today.getDate() - 30)

            const worklogs = await jiraApi.getWorklogs(
              thirtyDaysAgo.toISOString().split('T')[0],
              today.toISOString().split('T')[0]
            )

            console.log('Worklogs data:', worklogs)

            // Extract unique issues from worklogs
            const issueMap = new Map()
            worklogs.forEach(worklog => {
              if (worklog.issueKey && !issueMap.has(worklog.issueKey)) {
                issueMap.set(worklog.issueKey, {
                  id: worklog.issueId || worklog.issueKey,
                  key: worklog.issueKey,
                  fields: {
                    summary: worklog.summary,
                    status: {
                      name: 'In Progress',
                      statusCategory: {
                        name: 'In Progress',
                        key: 'indeterminate'
                      }
                    },
                    assignee: {
                      displayName: worklog.author.displayName,
                      emailAddress: worklog.author.emailAddress
                    },
                    created: worklog.started,
                    updated: worklog.started,
                    project: {
                      key: worklog.issueKey.split('-')[0], // Extract project key from issue key
                      name: worklog.issueKey.split('-')[0] // Use project key as name for now
                    }
                  }
                })
              }
            })

            validIssues = Array.from(issueMap.values())
            console.log('Issues extracted from worklogs:', validIssues)
          } catch (worklogError) {
            console.error('Error fetching worklogs as fallback:', worklogError)
          }
        }

        setProjects(projectsWithStats as Project[])
        setRecentIssues(validIssues as Issue[])
      } catch (error) {
        console.error('Error fetching projects data:', error)
        setProjects([])
        setRecentIssues([])
      } finally {
        setIsDataLoading(false)
      }
    }

    if (session?.user) {
      fetchData()
    }
  }, [session])

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesProject = projectFilter === 'all' ||
        (projectFilter === 'active' && !project.archived) ||
        (projectFilter === 'archived' && project.archived)

      return matchesSearch && matchesProject
    })
    .sort((a, b) => {
      let aValue: string, bValue: string

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'key':
          aValue = a.key.toLowerCase()
          bValue = b.key.toLowerCase()
          break
        case 'updated':
          aValue = a.archivedDate || ''
          bValue = b.archivedDate || ''
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }



      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })

  // Simple recent issues display - no filtering
  const displayIssues = recentIssues.slice(0, 10) // Show only top 10 recent issues



  const translateStatus = (statusCategory: string, statusName?: string): string => {
    // If status is done, return as is
    if (statusCategory === 'done') {
      return 'Done'
    }
    
    // Check status name for Spanish translations
    if (statusName) {
      if (statusName === 'En revisión') {
        return 'In Review'
      }
      if (statusName === 'En curso') {
        return 'In Progress'
      }
    }
    
    // Fallback to status category
    switch (statusCategory) {
      case 'new': return 'To Do'
      case 'indeterminate': return 'In Progress'
      default: return 'Unknown'
    }
  }

  const getStatusBadgeStyle = (statusText: string, size: 'sm' | 'xs' = 'sm') => {
    const baseClasses = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-2 py-1 text-xs'
    
    switch (statusText) {
      case 'Done':
        return `${baseClasses} font-medium bg-green-100 text-green-800 border border-green-200 rounded-full`
      case 'In Progress':
        return `${baseClasses} font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full`
      case 'In Review':
        return `${baseClasses} font-medium bg-purple-100 text-purple-800 border border-purple-200 rounded-full`
      case 'To Do':
        return `${baseClasses} font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-full`
      default:
        return `${baseClasses} font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded-full`
    }
  }

  const getProjectTypeColor = (projectType: string) => {
    switch (projectType) {
      case 'software': return 'bg-blue-100 text-blue-800'
      case 'service_desk': return 'bg-purple-100 text-purple-800'
      case 'business': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



    const getProjectStats = (projectKey: string) => {
    const project = projects.find(p => p.key === projectKey)
    const total = project?.totalIssues || 0
    const done = project?.doneIssues || 0
    const progressPercentage = project?.progressPercentage || 0

    return { total, done, progressPercentage }
  }

  const openProjectModal = (project: Project) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  const closeProjectModal = () => {
    setSelectedProject(null)
    setIsModalOpen(false)
  }

  const getRecentTasksForProject = (projectKey: string) => {
    console.log('getRecentTasksForProject called with:', projectKey)
    console.log('recentIssues available:', recentIssues.length)

    if (recentIssues.length === 0) {
      console.log('No recent issues available')
      return []
    }

    // Filter issues by project key - try multiple matching strategies
    const projectIssues = recentIssues.filter(issue => {
      const issueProjectKey = issue?.fields?.project?.key
      const issueKey = issue?.key

      // Check if issue key starts with project key (e.g., "PROJ-123" for project "PROJ")
      const keyMatches = issueKey && issueKey.startsWith(projectKey + '-')
      // Check if project key matches exactly
      const projectMatches = issueProjectKey === projectKey

      const matches = keyMatches || projectMatches
      console.log(`Issue ${issueKey}: project key=${issueProjectKey}, key starts with ${projectKey}-=${keyMatches}, project matches=${projectMatches}, final match=${matches}`)

      return matches
    })

    console.log(`Found ${projectIssues.length} issues for project ${projectKey}`)

    if (projectIssues.length === 0) {
      // If no issues found by project key, try to find issues that might be related
      console.log('No direct project matches, checking for related issues...')
      const relatedIssues = recentIssues.filter(issue => {
        const issueKey = issue?.key
        return issueKey && issueKey.includes(projectKey)
      })
      console.log(`Found ${relatedIssues.length} potentially related issues`)
      return relatedIssues.slice(0, 10)
    }

    // Sort by creation date (most recent first) and take first 10
    const sortedIssues = projectIssues.sort((a, b) => {
      const dateA = new Date(a?.fields?.created || 0)
      const dateB = new Date(b?.fields?.created || 0)
      return dateB.getTime() - dateA.getTime() // Most recent first
    })

    const result = sortedIssues.slice(0, 10)
    console.log(`Returning ${result.length} most recent issues for project ${projectKey}`)

    return result
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeProjectModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  // Handle click outside modal to close
  const handleModalBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      closeProjectModal()
    }
  }

  return (
    <ProtectedRoute allowedRoles={['MANAGER']}>
      <DashboardLayout
      title="Projects"
      subtitle="Manage and view all Jira projects and recent tasks"
      actions={
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            New Project
          </button>
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => !p.archived).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Issues</p>
                <p className="text-2xl font-bold text-gray-900">{recentIssues.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Project Types</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(projects.map(p => p.projectTypeKey)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects and issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Projects</option>
                <option value="active">Active Only</option>
                <option value="archived">Archived Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'key' | 'updated')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="key">Sort by Key</option>
                <option value="updated">Sort by Updated</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isDataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredAndSortedProjects.map((project) => {
              const stats = getProjectStats(project.key)

              return (
                <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        {project.archived && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Archive className="w-3 h-3 mr-1" />
                            Archived
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {project.key}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProjectTypeColor(project.projectTypeKey)}`}>
                          {project.projectTypeKey}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                                    {/* Project Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-xs text-gray-600">Total Issues</p>
                      <p className="text-xs text-gray-500">(All time)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.done}</p>
                      <p className="text-xs text-gray-600">Completed</p>
                      <p className="text-xs text-gray-500">(All time)</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{stats.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Project Lead */}
                  {project.lead && (
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>Project Lead:</span>
                      <span className="font-medium">{project.lead.displayName}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => openProjectModal(project)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent Issues */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Issues</h2>
            <p className="text-sm text-gray-600">Latest issues across all projects</p>
            <div className="mt-2 text-xs text-gray-500">
              Total issues: {recentIssues.length} | Showing: {displayIssues.length}
            </div>
          </div>

          <div className="p-6">
            {/*/!* Debug: Show first 3 issues without filtering *!/*/}
            {/*{recentIssues.length > 0 && (*/}
            {/*  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">*/}
            {/*    <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug: First 3 Issues (Unfiltered)</h3>*/}
            {/*    {recentIssues.slice(0, 3).map((issue, index) => (*/}
            {/*      <div key={index} className="text-xs text-yellow-700 mb-2">*/}
            {/*        <strong>Issue {index + 1}:</strong> {issue?.key} - {issue?.fields?.summary}*/}
            {/*        <br />*/}
            {/*        <span className="text-yellow-600">*/}
            {/*          Fields: {JSON.stringify(issue?.fields, null, 2)}*/}
            {/*        </span>*/}
            {/*      </div>*/}
            {/*    ))}*/}
            {/*  </div>*/}
            {/*)}*/}

            {displayIssues.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent issues found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayIssues.map((issue: Issue) => (
                  <div key={issue.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                    {/* Header with Issue Key and Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {issue.key}
                        </span>
                        <span className={`inline-flex items-center ${getStatusBadgeStyle(translateStatus(issue?.fields?.status?.statusCategory?.key || 'unknown', issue?.fields?.status?.name))}`}>
                          {translateStatus(issue?.fields?.status?.statusCategory?.key || 'unknown', issue?.fields?.status?.name)}
                        </span>
                      </div>
                      <button className="text-gray-400 hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title - Primary Information */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                        {issue?.fields?.summary || 'No title'}
                      </h3>
                    </div>

                    {/* Secondary Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assignee</p>
                          <p className="text-sm font-medium text-gray-900">
                            {issue?.fields?.assignee?.displayName || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</p>
                          <p className="text-sm font-medium text-gray-900">
                            {issue?.fields?.created ? formatDate(issue.fields.created) : 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Updated</p>
                          <p className="text-sm font-medium text-gray-900">
                            {issue?.fields?.updated ? formatDate(issue.fields.updated) : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer with Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Issue ID: {issue.id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                          View Details
                        </button>
                        <button className="text-xs text-gray-600 hover:text-gray-700 font-medium transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Details Modal */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={handleModalBackdropClick}>
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                <p className="text-gray-600">Project Details & Recent Tasks</p>
                <p className="text-xs text-gray-500 mt-1">
                  {recentIssues.length} total issues available
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                  title="Refresh data"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={closeProjectModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Project Overview */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Project Overview</h3>
                    <p className="text-sm text-blue-700">
                      {selectedProject.description || 'No description available'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">{selectedProject.key}</div>
                    <div className="text-sm text-blue-600">{selectedProject.projectTypeKey}</div>
                  </div>
                </div>
              </div>

              {/* Project Summary Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Project Key & Type */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                        {selectedProject.key}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProjectTypeColor(selectedProject.projectTypeKey)}`}>
                        {selectedProject.projectTypeKey}
                      </span>
                    </div>
                    {selectedProject.description && (
                      <p className="text-sm text-gray-600 mt-2">{selectedProject.description}</p>
                    )}
                  </div>

                  {/* Project Stats */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{selectedProject.totalIssues || 0}</p>
                        <p className="text-xs text-gray-600">Total Issues</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{selectedProject.doneIssues || 0}</p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{selectedProject.progressPercentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedProject.progressPercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Project Lead */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Project Lead</h4>
                    {selectedProject.lead ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedProject.lead.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedProject.lead.displayName}</p>
                          <p className="text-xs text-gray-600">{selectedProject.lead.emailAddress}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No project lead assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Tasks Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent Issues for {selectedProject.key}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        const recentTasks = getRecentTasksForProject(selectedProject.key)
                        if (recentTasks.length > 0) {
                          const firstIssue = recentTasks[0]
                          const issueKey = firstIssue?.key
                          const projectKey = firstIssue?.fields?.project?.key

                          if (projectKey === selectedProject.key) {
                            return `${recentTasks.length} project-specific issues found`
                          } else if (issueKey && issueKey.startsWith(selectedProject.key + '-')) {
                            return `${recentTasks.length} issues with matching key pattern found`
                          } else {
                            return `${recentTasks.length} related issues found`
                          }
                        } else {
                          return 'No issues found for this project'
                        }
                      })()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getRecentTasksForProject(selectedProject.key).length} issues
                    </span>
                  </div>
                </div>
                {(() => {
                  const recentTasks = getRecentTasksForProject(selectedProject.key)
                  console.log(`Recent tasks for ${selectedProject.key}:`, recentTasks) // Debug log

                  if (recentTasks.length > 0) {
                    return (
                      <div className="space-y-4">
                        {recentTasks.map((task, index) => (
                          <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-3">
                                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                    {task.key}
                                  </span>
                                  <span className={`inline-flex items-center ${getStatusBadgeStyle(translateStatus(task?.fields?.status?.statusCategory?.key || 'unknown', task?.fields?.status?.name), 'xs')}`}>
                                    {translateStatus(task?.fields?.status?.statusCategory?.key || 'unknown', task?.fields?.status?.name)}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">#{index + 1}</span>
                                  {task?.fields?.project?.key && task?.fields?.project?.key !== selectedProject.key && (
                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full border border-orange-200">
                                      From: {task.fields.project.key}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-base font-semibold text-gray-900 mb-2 leading-tight">
                                  {task?.fields?.summary || 'No title'}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">
                                      <span className="font-medium">Assignee:</span> {task?.fields?.assignee?.displayName || 'Unassigned'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">
                                      <span className="font-medium">Created:</span> {task?.fields?.created ? formatDate(task.fields.created) : 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">
                                      <span className="font-medium">Updated:</span> {task?.fields?.updated ? formatDate(task.fields.updated) : 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button className="text-gray-400 hover:text-blue-600 transition-colors ml-3 p-2 hover:bg-blue-50 rounded-lg">
                                <ExternalLink className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  } else {
                    return (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Issues Found</h4>
                        <p className="text-gray-500 mb-4">
                          No recent issues found for project <span className="font-medium">{selectedProject.key}</span>
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                          Total issues available: {recentIssues.length} |
                          Project key: {selectedProject.key}
                        </p>

                        {/* Show sample of available issues for debugging */}
                        {recentIssues.length > 0 && (
                          <div className="mt-6 text-left max-w-2xl mx-auto">
                            <p className="text-sm font-medium text-gray-700 mb-3 text-center">Available Issues (Sample)</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto bg-white p-3 rounded-lg border">
                              {recentIssues.slice(0, 8).map((issue, index) => (
                                <div key={index} className="text-xs bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-blue-700">{issue?.key}</span>
                                    <span className="text-gray-500">
                                      Project: {issue?.fields?.project?.key || 'Unknown'}
                                    </span>
                                  </div>
                                  <p className="text-gray-600 mt-1 line-clamp-2">
                                    {issue?.fields?.summary || 'No summary'}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              This shows all available issues to help debug the filtering
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  }
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeProjectModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}