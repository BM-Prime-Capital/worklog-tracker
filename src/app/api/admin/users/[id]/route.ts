import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params

    // Fetch user with full details
    const user = await User.findById(userId)
      .populate('organizationId', 'name slug jiraOrganization')
      .populate('invitedBy', 'firstName lastName email')
      .select('-password -emailVerificationToken -resetPasswordToken -atlassianAccessToken -atlassianRefreshToken -invitationToken -oauthState')
      .lean()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get additional user statistics
    const userStats = await getUserStats(userId)

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats: userStats
      }
    })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch user details',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, message: 'Only administrators can modify user data' },
        { status: 403 }
      )
    }

    await dbConnect()

    const { id: userId } = await params
    const updateData = await request.json()

    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { password, atlassianAccessToken, atlassianRefreshToken, ...safeUpdateData } = updateData

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      safeUpdateData,
      { new: true, runValidators: true }
    )
    .populate('organizationId', 'name slug')
    .select('-password -emailVerificationToken -resetPasswordToken -atlassianAccessToken -atlassianRefreshToken -invitationToken -oauthState')
    .lean()

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, message: 'Only administrators can delete users' },
        { status: 403 }
      )
    }

    await dbConnect()

    const { id: userId } = await params

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === (session as SessionWithUser).user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Soft delete - mark as inactive instead of hard delete
    await User.findByIdAndUpdate(userId, { 
      isActive: false,
      status: 'suspended'
    })

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function getUserStats(userId: string) {
  try {
    // This would typically include more detailed statistics
    // For now, return basic info
    return {
      lastLoginDays: 0, // Would calculate from lastLogin
      totalWorklogs: 0, // Would count from worklogs
      projectsCount: 0, // Would count from projects
      isOnline: false // Would check from session data
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      lastLoginDays: 0,
      totalWorklogs: 0,
      projectsCount: 0,
      isOnline: false
    }
  }
}
