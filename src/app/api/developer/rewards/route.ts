import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'
import { jiraApiEnhanced } from '@/lib/jiraApiEnhanced'
import { format, startOfWeek, endOfWeek } from 'date-fns'

export async function GET() {
  try {
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    // Get user with organization details
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has an organization
    if (!user.organizationId) {
      return NextResponse.json({ 
        error: 'No organization assigned',
        message: 'Please contact your manager to assign you to an organization.'
      }, { status: 400 })
    }

    // Get organization's Jira settings
    const organization = await Organization.findById(user.organizationId)
    if (!organization || !organization.jiraOrganization) {
      return NextResponse.json({ 
        error: 'No Jira integration configured',
        message: 'Your organization has not configured Jira integration yet.'
      }, { status: 400 })
    }

    // Set up Jira credentials using organization settings
    await jiraApiEnhanced.setCredentialsFromOrganization(organization)

    // Calculate current week
    const now = new Date()
    const startDate = startOfWeek(now, { weekStartsOn: 1 })
    const endDate = endOfWeek(now, { weekStartsOn: 1 })

    // Fetch worklogs using organization credentials
    const worklogs = await jiraApiEnhanced.getWorklogs(
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )

    // Process worklogs to extract developer data (same as manager rewards)
    const processWorklogs = (worklogs: Array<{
      author: { displayName: string; emailAddress: string; accountId?: string }
      timeSpentSeconds: number
      issueKey: string
      summary: string
      started: string
    }>) => {
      const developers = new Map<string, {
        id: string
        name: string
        email: string
        hours: number
        tasks: Set<string>
        worklogs: typeof worklogs
      }>()

      worklogs.forEach(worklog => {
        const author = worklog.author.displayName
        const authorEmail = worklog.author.emailAddress
        const hours = worklog.timeSpentSeconds / 3600

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

      return Array.from(developers.values()).map(dev => ({
        id: dev.id,
        name: dev.name,
        email: dev.email,
        hours: Math.round(dev.hours * 100) / 100,
        tasks: dev.tasks.size,
        worklogs: dev.worklogs
      }))
    }

    // Generate rewards and rankings (same as manager rewards)
    const generateRewards = (developers: Array<{id: string, name: string, email: string, hours: number, tasks: number, worklogs: unknown[]}>, currentUserAtlassianAccountId?: string) => {
      const sortedDevelopers = [...developers].sort((a, b) => b.hours - a.hours)

      return sortedDevelopers.map((dev, index) => {
        const rank = index + 1
        const isCurrentUser = currentUserAtlassianAccountId && dev.id === currentUserAtlassianAccountId
        
        let reward = ''
        let rewardIcon = 'Trophy'
        let rewardColor = 'text-yellow-500'
        let badge = ''
        let badgeColor = 'bg-gray-100'
        let performance: 'excellent' | 'good' | 'average' | 'needs-improvement' = 'average'
        let achievements: string[] = []

        // Generate rewards based on rank and hours
        if (rank === 1) {
          reward = '🏆 Weekly Champion'
          rewardIcon = 'Crown'
          rewardColor = 'text-yellow-500'
          badge = '👑'
          badgeColor = 'bg-yellow-100'
          performance = 'excellent'
          achievements = ['First Place', 'Over 40h this week', 'Team Leader']
        } else if (rank === 2) {
          reward = '🥈 Silver Star'
          rewardIcon = 'Star'
          rewardColor = 'text-gray-400'
          badge = '⭐'
          badgeColor = 'bg-gray-100'
          performance = 'excellent'
          achievements = ['Second Place', 'Consistent Performer', 'High Achiever']
        } else if (rank === 3) {
          reward = '🥉 Bronze Medal'
          rewardIcon = 'Medal'
          rewardColor = 'text-orange-500'
          badge = '🏅'
          badgeColor = 'bg-orange-100'
          performance = 'good'
          achievements = ['Third Place', 'Solid Performance', 'Reliable Worker']
        } else if (dev.hours >= 35) {
          reward = '⚡ High Performer'
          rewardIcon = 'Zap'
          rewardColor = 'text-blue-500'
          badge = '⚡'
          badgeColor = 'bg-blue-100'
          performance = 'good'
          achievements = ['Over 35h', 'Dedicated Worker', 'Team Player']
        } else if (dev.hours >= 25) {
          reward = '🎯 On Target'
          rewardIcon = 'Target'
          rewardColor = 'text-green-500'
          badge = '🎯'
          badgeColor = 'bg-green-100'
          performance = 'average'
          achievements = ['On Target', 'Steady Progress', 'Contributor']
        } else if (dev.hours >= 15) {
          reward = '🌱 Growing'
          rewardIcon = 'TrendingUp'
          rewardColor = 'text-purple-500'
          badge = '🌱'
          badgeColor = 'bg-purple-100'
          performance = 'needs-improvement'
          achievements = ['Getting Started', 'Learning Phase', 'Newcomer']
        } else {
          reward = '💪 Keep Going!'
          rewardIcon = 'Heart'
          rewardColor = 'text-pink-500'
          badge = '💪'
          badgeColor = 'bg-pink-100'
          performance = 'needs-improvement'
          achievements = ['Getting Started', 'Room for Growth', 'Early Days']
        }

        return {
          ...dev,
          rank,
          reward,
          rewardIcon,
          rewardColor,
          badge,
          badgeColor,
          performance,
          achievements,
          isCurrentUser
        }
      })
    }

    const developers = processWorklogs(worklogs)
    const ranked = generateRewards(developers, user.atlassianAccountId)

    // Find current user's data
    const currentUser = ranked.find(dev => dev.isCurrentUser)
    const currentUserRank = currentUser?.rank || 0
    const currentUserHours = currentUser?.hours || 0

    // Calculate weekly stats
    const totalHours = ranked.reduce((sum, dev) => sum + dev.hours, 0)
    const averageHours = ranked.length > 0 ? totalHours / ranked.length : 0

    return NextResponse.json({
      success: true,
      data: {
        rankedDevelopers: ranked,
        weeklyStats: {
          totalHours,
          averageHours,
          topPerformer: ranked.length > 0 ? ranked[0] : null,
          totalDevelopers: ranked.length,
          currentUserRank,
          currentUserHours
        }
      }
    })

  } catch (error) {
    console.error('Developer rewards API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch rewards data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
