'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContextNew'
import { jiraApiEnhanced as jiraApi } from '@/lib/jiraApiEnhanced'
import {
  FolderOpen,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  ExternalLink,
  Search,
  Filter,
  Activity,
  Star,
  StarOff,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Circle,
  Play,
  Pause,
  Archive
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

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
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [recentIssues, setRecentIssues] = useState<Issue[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'key' | 'updated'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

    if (user) {
      fetchData()
    }
  }, [user])

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

  const getStatusColor = (statusCategory: string) => {
    switch (statusCategory) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'indeterminate': return 'bg-yellow-100 text-yellow-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (statusCategory: string) => {
    switch (statusCategory) {
      case 'new': return <Circle className="w-4 h-4" />
      case 'indeterminate': return <Play className="w-4 h-4" />
      case 'done': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
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

  const getIssuesByProject = (projectKey: string) => {
    return recentIssues.filter(issue =>
      issue?.fields?.project?.key === projectKey
    )
  }

    const getProjectStats = (projectKey: string) => {
    const project = projects.find(p => p.key === projectKey)
    const total = project?.totalIssues || 0
    const done = project?.doneIssues || 0
    const progressPercentage = project?.progressPercentage || 0
    
    return { total, done, progressPercentage }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
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
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
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
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          issue?.fields?.status?.statusCategory?.key === 'done' ? 'bg-green-100 text-green-800 border border-green-200' :
                          issue?.fields?.status?.statusCategory?.key === 'indeterminate' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          issue?.fields?.status?.statusCategory?.key === 'new' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {issue?.fields?.status?.statusCategory?.key || 'Unknown'}
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
    </DashboardLayout>
  )
}
