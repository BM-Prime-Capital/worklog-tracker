import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'

interface Activity {
  type: 'user_signup' | 'organization_created' | 'system_event'
  title: string
  description: string
  timestamp: Date
  icon: string
}

interface SessionWithUser {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isEmailVerified: boolean
    organizationId?: string
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is an admin
    if ((session as SessionWithUser).user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can access this data' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Get current date for recent signups calculation (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch all users with role-based counts
    const [
      totalUsers,
      managers,
      developers,
      activeUsers,
      recentSignups,
      totalOrganizations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'MANAGER' }),
      User.countDocuments({ role: 'DEVELOPER' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ 
        createdAt: { $gte: sevenDaysAgo },
        role: { $in: ['MANAGER', 'DEVELOPER'] }
      }),
      Organization.countDocuments()
    ])

    // Calculate system health based on various factors
    const systemHealth = calculateSystemHealth({
      totalUsers,
      activeUsers,
      totalOrganizations,
      recentSignups
    })

    // Get recent activity data
    const recentActivity = await getRecentActivity()

    const stats = {
      totalUsers,
      totalManagers: managers,
      totalDevelopers: developers,
      activeUsers,
      recentSignups,
      totalOrganizations,
      systemHealth,
      recentActivity
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch admin statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function calculateSystemHealth(metrics: {
  totalUsers: number
  activeUsers: number
  totalOrganizations: number
  recentSignups: number
}): 'healthy' | 'warning' | 'error' {
  const { totalUsers, activeUsers, totalOrganizations, recentSignups } = metrics
  
  // Calculate active user percentage
  const activeUserPercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
  
  // System health criteria
  if (activeUserPercentage < 50) return 'error'
  if (activeUserPercentage < 80 || totalOrganizations === 0) return 'warning'
  return 'healthy'
}

async function getRecentActivity() {
  try {
    // Get recent user signups
    const recentUsers = await User.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      role: { $in: ['MANAGER', 'DEVELOPER'] }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName role createdAt')

    // Get recent organizations
    const recentOrgs = await Organization.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('name createdAt')

    const activities: Activity[] = []

    // Add user signup activities
    recentUsers.forEach(user => {
      activities.push({
        type: 'user_signup',
        title: `New ${user.role.toLowerCase()} registered`,
        description: `${user.firstName} ${user.lastName} joined as ${user.role}`,
        timestamp: user.createdAt,
        icon: 'user'
      })
    })

    // Add organization activities
    recentOrgs.forEach(org => {
      activities.push({
        type: 'organization_created',
        title: 'New organization created',
        description: `${org.name} organization was set up`,
        timestamp: org.createdAt,
        icon: 'building'
      })
    })

    // Sort by timestamp and return recent activities
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}