import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface SessionWithUser {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isEmailVerified: boolean
    organizationId?: string
    jiraOrganization?: {
      domain: string
      email: string
      apiToken: string
    }
  }
}

export async function GET() {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions as any)

    if (!session || !(session as SessionWithUser).user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Return user information from session
    const user = (session as SessionWithUser).user
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        jiraOrganization: user.jiraOrganization
      }
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 