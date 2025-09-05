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

export async function POST(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions as any)

    if (!session || !(session as SessionWithUser).user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    await dbConnect()

    // Get request body
    const { domain, email, apiToken } = await request.json()

    if (!domain || !email || !apiToken) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, email, apiToken' },
        { status: 400 }
      )
    }

    // Update user's Jira organization
    const updatedUser = await User.findByIdAndUpdate(
      (session as SessionWithUser).user.id,
      {
        jiraOrganization: {
          domain,
          email,
          apiToken
        }
      },
      { new: true, select: '-password' }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Jira organization updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        jiraOrganization: updatedUser.jiraOrganization
      }
    })

  } catch (error) {
    console.error('Jira organization update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 