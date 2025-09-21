'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, TrendingUp, Code, Users, Target, Award, AlertCircle } from 'lucide-react'
import StatsCard from './StatsCard'
import WeeklyHoursChart from './WeeklyHoursChart'
import { formatHours } from '@/lib/timeUtils'

interface DeveloperData {
  personal: {
    name: string
    role: string
    avatar: string
    team: string
    joinDate: string
    currentStreak: number
    totalContributions: number
  }
  stats: {
    totalHoursThisWeek: number
    totalHoursLastWeek: number
    hoursChange: string
    tasksCompletedThisWeek: number
    tasksCompletedLastWeek: number
    tasksChange: string
    codeReviews: number
    codeReviewsLastWeek: number
    reviewsChange: string
    projectsActive: number
  }
  projects: Array<{
    id: string
    name: string
    key: string
    role: string
    hoursThisWeek: number
    hoursLastWeek: number
    tasksCompleted: number
    tasksInProgress: number
    priority: string
    status: string
    lastActivity: string
  }>
  recentActivity: Array<{
    id: string
    type: string
    project: string
    title: string
    timestamp: string
    hours: number
  }>
  weeklyBreakdown: Array<{
    day: string
    hours: number
    tasks: number
  }>
  skills: Array<{
    name: string
    level: number
    projects: number
  }>
}

interface DeveloperDashboardProps {
  selectedDateRange?: string
}

export default function DeveloperDashboard({ selectedDateRange = 'this-week' }: DeveloperDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [developerData, setDeveloperData] = useState<DeveloperData | null>(null)

  // Fetch developer data from API
  useEffect(() => {
    const fetchDeveloperData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/developer/dashboard?dateRange=${selectedDateRange}`)
        const data = await response.json()
        
        if (data.success) {
          setDeveloperData(data.data)
        } else {
          // Handle specific error cases
          if (data.error === 'No Atlassian account linked') {
            setError('No Atlassian account linked. Please complete OAuth setup.')
          } else if (data.error === 'No organization assigned') {
            setError('You need to be assigned to an organization to access Jira data. Please contact your manager.')
          } else if (data.error === 'No Jira integration configured') {
            setError('Your organization has not configured Jira integration yet. Please contact your manager.')
          } else {
            setError(data.message || 'Failed to fetch developer data')
          }
        }
      } catch (err) {
        console.error('Error fetching developer data:', err)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeveloperData()
  }, [selectedDateRange])

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Unable to load dashboard</h3>
              <p className="text-red-600 mt-1">{error}</p>
              {error.includes('organization') && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">What you can do:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Contact your manager to assign you to an organization</li>
                    <li>• Ask your manager to configure Jira integration for your organization</li>
                    <li>• Once assigned, you&apos;ll be able to see your Jira worklogs and project data</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'code_review': return <Code className="w-4 h-4 text-blue-600" />
      case 'task_started': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'meeting': return <Users className="w-4 h-4 text-purple-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Personal Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {isLoading ? (
              <div className="w-8 h-8 bg-white/30 rounded-full animate-pulse"></div>
            ) : (
              developerData?.personal.avatar || 'U'
            )}
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-white/30 rounded w-48 animate-pulse"></div>
                <div className="h-5 bg-white/20 rounded w-32 animate-pulse"></div>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <div className="h-4 bg-white/20 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <div className="h-4 bg-white/20 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <div className="h-4 bg-white/20 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">
                  {developerData?.personal.name || 'Developer'}
                </h1>
                <p className="text-blue-100">
                  {developerData?.personal.role || 'Developer'}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{developerData?.personal.team || 'Team'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>{developerData?.personal.totalContributions || 0} contributions</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span>{developerData?.personal.currentStreak || 0} day streak</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Hours This Week"
          value={isLoading ? '...' : formatHours(developerData?.stats.totalHoursThisWeek || 0)}
          change={isLoading ? '' : (developerData?.stats.hoursChange || '')}
          changeType={isLoading ? 'neutral' : (developerData?.stats.hoursChange?.startsWith('+') ? 'positive' : 'negative')}
          icon={Clock}
          description="vs last week"
          isLoading={isLoading}
        />
        <StatsCard
          title="Tasks Completed"
          value={isLoading ? '...' : (developerData?.stats.tasksCompletedThisWeek || 0).toString()}
          change={isLoading ? '' : (developerData?.stats.tasksChange || '')}
          changeType={isLoading ? 'neutral' : (developerData?.stats.tasksChange?.startsWith('+') ? 'positive' : 'negative')}
          icon={CheckCircle}
          description="vs last week"
          isLoading={isLoading}
        />
        <StatsCard
          title="Code Reviews"
          value={isLoading ? '...' : (developerData?.stats.codeReviews || 0).toString()}
          change={isLoading ? '' : (developerData?.stats.reviewsChange || '')}
          changeType={isLoading ? 'neutral' : (developerData?.stats.reviewsChange?.startsWith('+') ? 'positive' : 'negative')}
          icon={Code}
          description="vs last week"
          isLoading={isLoading}
        />
        <StatsCard
          title="Active Projects"
          value={isLoading ? '...' : (developerData?.stats.projectsActive || 0).toString()}
          change=""
          changeType="neutral"
          icon={TrendingUp}
          description="currently working on"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Overview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Projects</h2>
              <span className="text-sm text-gray-500">
                {isLoading ? '...' : `${developerData?.projects.length || 0} active`}
              </span>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                // Skeleton loader for projects
                [...Array(3)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : developerData?.projects && developerData.projects.length > 0 ? (
                developerData.projects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {project.key}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">{project.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Hours This Week</p>
                      <p className="font-medium">{formatHours(project.hoursThisWeek)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tasks Completed</p>
                      <p className="font-medium">{project.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Activity</p>
                      <p className="font-medium">{project.lastActivity}</p>
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No projects found for this period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {isLoading ? (
                // Skeleton loader for recent activity
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3 animate-pulse">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="flex items-center space-x-2">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : developerData?.recentActivity && developerData.recentActivity.length > 0 ? (
                developerData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.project}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                      {activity.hours > 0 && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatHours(activity.hours)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills and Weekly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills & Expertise</h2>
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton loader for skills
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                </div>
              ))
            ) : developerData?.skills && developerData.skills.length > 0 ? (
              developerData.skills.map((skill) => (
              <div key={skill.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                  <span className="text-xs text-gray-500">({skill.projects} projects)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{skill.level}%</span>
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Code className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No skill data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Hours Breakdown */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">This Week&apos;s Hours</h2>
            {isLoading ? (
              // Skeleton loader for weekly chart
              <div className="space-y-4 animate-pulse">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="flex-1 bg-gray-200 rounded h-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                ))}
              </div>
            ) : (
              <WeeklyHoursChart data={developerData?.weeklyBreakdown || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
