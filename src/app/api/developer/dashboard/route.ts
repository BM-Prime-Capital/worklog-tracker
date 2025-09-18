import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'
import { jiraApiEnhanced } from '@/lib/jiraApiEnhanced'
import { roundHours } from '@/lib/timeUtils'

export async function GET(req: NextRequest) {
  try {
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateRange = searchParams.get('dateRange') || 'this-week'
    
    await dbConnect()
    
    // Get user with Atlassian account details
    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log("Developer dashboard - User data:")
    console.log("User ID:", user._id)
    console.log("User email:", user.email)
    console.log("Atlassian account ID:", user.atlassianAccountId)
    console.log("Atlassian email:", user.atlassianEmail)
    console.log("Atlassian display name:", user.atlassianDisplayName)
    console.log("Organization ID:", user.organizationId)
    console.log("Auth methods:", user.authMethods)

    // Check if user has Atlassian account ID
    if (!user.atlassianAccountId) {
      console.log("User does not have Atlassian account ID - redirecting to OAuth setup")
      return NextResponse.json({ 
        error: 'No Atlassian account linked',
        message: 'Please complete Atlassian OAuth setup'
      }, { status: 400 })
    }

    // Check if user has an organization
    if (!user.organizationId) {
      console.log("User does not have an organization assigned")
      return NextResponse.json({ 
        error: 'No organization assigned',
        message: 'Please contact your manager to assign you to an organization. You need to be part of an organization to access Jira data.',
        userData: {
          atlassianAccountId: user.atlassianAccountId,
          atlassianEmail: user.atlassianEmail,
          atlassianDisplayName: user.atlassianDisplayName
        }
      }, { status: 400 })
    }

    // Get organization's Jira settings
    const organization = await Organization.findById(user.organizationId)
    if (!organization || !organization.jiraOrganization) {
      return NextResponse.json({ 
        error: 'No Jira integration configured',
        message: 'Your organization has not configured Jira integration yet. Please contact your manager.'
      }, { status: 400 })
    }

    console.log("Organization Jira settings:")
    console.log("Domain:", organization.jiraOrganization.domain)
    console.log("Email:", organization.jiraOrganization.email)
    console.log("API Token length:", organization.jiraOrganization.apiToken?.length || 0)

    // Set up Jira credentials using organization settings
    await jiraApiEnhanced.setCredentialsFromOrganization(organization)

    // Calculate date range
    const now = new Date()
    let startDate: string
    let endDate: string

    switch (dateRange) {
      case 'this-week':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        startDate = startOfWeek.toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
      case 'last-week':
        const lastWeekStart = new Date(now)
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
        lastWeekStart.setHours(0, 0, 0, 0)
        startDate = lastWeekStart.toISOString().split('T')[0]
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
        endDate = lastWeekEnd.toISOString().split('T')[0]
        break
      case 'this-month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate = startOfMonth.toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
    }

    // Fetch worklogs for the developer
    const worklogs = await jiraApiEnhanced.getWorklogs(startDate, endDate)
    
    // Filter worklogs for this specific developer
    const developerWorklogs = worklogs.filter(worklog => 
      worklog.author.accountId === user.atlassianAccountId
    )

    // Get recent issues assigned to this developer
    const recentIssues = await jiraApiEnhanced.getRecentIssues(20)
    const assignedIssues = recentIssues.filter((issue: any) => 
      issue.assignee?.accountId === user.atlassianAccountId
    )

    // Get projects
    const projects = await jiraApiEnhanced.getProjects()
    
    // Transform data for dashboard
    const dashboardData = jiraApiEnhanced.transformWorklogsToDashboardData(developerWorklogs)
    
    // Get developer-specific data
    const developerData = dashboardData.developers.find(dev => dev.id === user.atlassianAccountId) || {
      id: user.atlassianAccountId,
      name: user.atlassianDisplayName || `${user.firstName} ${user.lastName}`,
      email: user.atlassianEmail || user.email,
      avatar: user.atlassianAvatarUrl || '',
      team: 'Development Team',
      hours: 0,
      tasks: 0,
      completed: 0,
      productivity: 0,
      trend: 'stable' as const,
      lastActive: 'Never',
      status: 'offline' as const,
      worklogs: []
    }

    // Calculate weekly breakdown
    const weeklyBreakdown = calculateWeeklyBreakdown(developerWorklogs, startDate, endDate)
    
    // Calculate project statistics
    const projectStats = await calculateProjectStats(assignedIssues, projects)
    
    // Get recent activity
    const recentActivity = generateRecentActivity(developerWorklogs, assignedIssues)

    return NextResponse.json({
      success: true,
      data: {
        personal: {
          name: developerData.name,
          role: 'Developer',
          avatar: developerData.avatar || getInitials(developerData.name),
          team: developerData.team,
          joinDate: user.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          currentStreak: calculateCurrentStreak(developerWorklogs),
          totalContributions: developerWorklogs.length
        },
        stats: {
          totalHoursThisWeek: roundHours(developerData.hours), // Round to whole number
          totalHoursLastWeek: roundHours(await calculateLastWeekHours(user.atlassianAccountId, startDate)),
          hoursChange: calculateChangePercentage(developerData.hours, await calculateLastWeekHours(user.atlassianAccountId, startDate)),
          tasksCompletedThisWeek: developerData.completed,
          tasksCompletedLastWeek: await calculateLastWeekTasks(user.atlassianAccountId, startDate),
          tasksChange: calculateChangePercentage(developerData.completed, await calculateLastWeekTasks(user.atlassianAccountId, startDate)),
          codeReviews: calculateCodeReviews(developerWorklogs),
          codeReviewsLastWeek: await calculateLastWeekCodeReviews(user.atlassianAccountId, startDate),
          reviewsChange: calculateChangePercentage(calculateCodeReviews(developerWorklogs), await calculateLastWeekCodeReviews(user.atlassianAccountId, startDate)),
          projectsActive: projectStats.length
        },
        projects: projectStats,
        recentActivity,
        weeklyBreakdown,
        skills: generateSkillsData(developerWorklogs)
      }
    })

  } catch (error) {
    console.error('Developer dashboard API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch developer data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper functions
function calculateWeeklyBreakdown(worklogs: any[], startDate: string, endDate: string) {
  const breakdown: WeeklyBreakdown[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dayWorklogs = worklogs.filter(w => {
      const worklogDate = new Date(w.started).toDateString()
      return worklogDate === d.toDateString()
    })
    
    const hours = dayWorklogs.reduce((sum, w) => sum + (w.timeSpentSeconds / 3600), 0)
    const tasks = new Set(dayWorklogs.map(w => w.issueKey)).size
    
    breakdown.push({
      day: dayName,
      hours: roundHours(hours), // Round to whole number for display
      tasks
    })
  }
  
  return breakdown
}

async function calculateProjectStats(issues: any[], projects: any[]) {
  const projectMap = new Map(projects.map((p: any) => [p.key, p]))
  const projectStats = new Map()
  
  issues.forEach((issue: any) => {
    const projectKey = issue.fields?.project?.key
    if (projectKey && projectMap.has(projectKey)) {
      const project = projectMap.get(projectKey)
      if (!projectStats.has(projectKey)) {
        projectStats.set(projectKey, {
          id: project.id,
          name: project.name,
          key: project.key,
          role: 'Developer',
          hoursThisWeek: 0,
          hoursLastWeek: 0,
          tasksCompleted: 0,
          tasksInProgress: 0,
          priority: 'Medium',
          status: 'Active',
          lastActivity: 'Recently'
        })
      }
      
      const stats = projectStats.get(projectKey)
      if (issue.fields?.status?.name === 'Done') {
        stats.tasksCompleted++
      } else {
        stats.tasksInProgress++
      }
    }
  })
  
  return Array.from(projectStats.values())
}

interface Activity {
  id: string
  type: string
  project: string
  title: string
  timestamp: string
  hours?: number
}

interface WeeklyBreakdown {
  day: string
  hours: number
  tasks: number
}

function generateRecentActivity(worklogs: any[], issues: any[]) {
  const activities: Activity[] = []
  
  // Add worklog activities
  worklogs.slice(0, 10).forEach(worklog => {
    activities.push({
      id: `worklog-${worklog.id}`,
      type: 'task_completed',
      project: worklog.issueKey.split('-')[0],
      title: worklog.summary,
      timestamp: formatTimestamp(worklog.started),
      hours: roundHours(worklog.timeSpentSeconds / 3600)
    })
  })
  
  // Add issue activities
  issues.slice(0, 5).forEach((issue: any) => {
    activities.push({
      id: `issue-${issue.id}`,
      type: 'task_started',
      project: issue.key.split('-')[0],
      title: issue.fields?.summary || 'Untitled',
      timestamp: formatTimestamp(issue.fields?.created),
      hours: 0
    })
  })
  
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
}

function generateSkillsData(worklogs: any[]) {
  // Simple skill detection based on worklog comments and issue types
  const skills = new Map()
  
  worklogs.forEach(worklog => {
    const comment = typeof worklog.comment === 'string' ? worklog.comment : ''
    const summary = typeof worklog.summary === 'string' ? worklog.summary : ''
    const text = (comment + ' ' + summary).toLowerCase()
    
    const skillMap = {
      'react': ['react', 'jsx', 'component'],
      'typescript': ['typescript', 'ts'],
      'node': ['node', 'nodejs', 'express'],
      'css': ['css', 'scss', 'sass', 'styling'],
      'git': ['git', 'commit', 'merge', 'branch']
    }
    
    Object.entries(skillMap).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        skills.set(skill, (skills.get(skill) || 0) + 1)
      }
    })
  })
  
  return Array.from(skills.entries()).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    level: Math.min(100, count * 10),
    projects: Math.min(5, count)
  }))
}

function calculateCurrentStreak(worklogs: any[]) {
  const dates = worklogs.map(w => new Date(w.started).toDateString()).sort()
  let streak = 0
  let currentDate = new Date()
  
  while (dates.includes(currentDate.toDateString())) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }
  
  return streak
}

async function calculateLastWeekHours(accountId: string, currentStartDate: string) {
  // This would need to be implemented to fetch last week's data
  // For now, return 0
  return 0
}

async function calculateLastWeekTasks(accountId: string, currentStartDate: string) {
  // This would need to be implemented to fetch last week's data
  // For now, return 0
  return 0
}

async function calculateLastWeekCodeReviews(accountId: string, currentStartDate: string) {
  // This would need to be implemented to fetch last week's data
  // For now, return 0
  return 0
}

function calculateCodeReviews(worklogs: any[]) {
  return worklogs.filter(w => {
    const comment = typeof w.comment === 'string' ? w.comment.toLowerCase() : ''
    const summary = typeof w.summary === 'string' ? w.summary.toLowerCase() : ''
    return comment.includes('review') || summary.includes('review')
  }).length
}

function calculateChangePercentage(current: number, previous: number) {
  if (previous === 0) return current > 0 ? '+100%' : '0%'
  const change = ((current - previous) / previous) * 100
  return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
