import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'

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
    // @ts-ignore - NextAuth.js v4 type compatibility issue
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
        { success: false, message: 'Only admins can access this resource' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Get user counts by role
    const totalUsers = await User.countDocuments({})
    const totalManagers = await User.countDocuments({ role: 'MANAGER' })
    const totalDevelopers = await User.countDocuments({ role: 'DEVELOPER' })
    const activeUsers = await User.countDocuments({ isActive: true })

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })

    // System health check (basic implementation)
    let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy'
    
    // Check if there are any inactive users (could indicate issues)
    const inactiveUsers = await User.countDocuments({ isActive: false })
    if (inactiveUsers > totalUsers * 0.1) { // More than 10% inactive
      systemHealth = 'warning'
    }

    // Check for users without email verification (could indicate email issues)
    const unverifiedUsers = await User.countDocuments({ isEmailVerified: false })
    if (unverifiedUsers > totalUsers * 0.2) { // More than 20% unverified
      systemHealth = 'warning'
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalManagers,
        totalDevelopers,
        activeUsers,
        recentSignups,
        systemHealth
      }
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}
