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

export async function PUT(request: NextRequest) {
  try {
    // Get session using NextAuth
    // @ts-ignore - NextAuth.js v4 type compatibility issue
    const session = await getServerSession(authOptions as any)

    if (!session || !(session as SessionWithUser).user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    await dbConnect()

    // Get request body
    const { firstName, lastName } = await request.json()

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName' },
        { status: 400 }
      )
    }

    // Update user's profile information
    const updatedUser = await User.findByIdAndUpdate(
      (session as SessionWithUser).user.id,
      {
        firstName,
        lastName
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
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        jiraOrganization: updatedUser.jiraOrganization
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
