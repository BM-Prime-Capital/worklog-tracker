import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Organization from '@/models/Organization'
import User from '@/models/User'

// Type for session with user
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

// POST /api/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    if (!(session as SessionWithUser)?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { name, description, jiraOrganization } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Organization name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Check if user already has an organization
    const existingUser = await User.findById((session as SessionWithUser).user.id)
    console.log('🔧 API: Checking user organizationId:', existingUser?.organizationId)
    console.log('🔧 API: User data:', { id: existingUser?._id, email: existingUser?.email, organizationId: existingUser?.organizationId })
    
    if (existingUser?.organizationId) {
      console.log('🔧 API: User already has organization, returning error')
      return NextResponse.json(
        { success: false, message: 'User already belongs to an organization' },
        { status: 400 }
      )
    }

    // Create organization
    const organization = new Organization({
      name: name.trim(),
      description: description?.trim(),
      ownerId: (session as SessionWithUser).user.id,
      jiraOrganization: jiraOrganization ? {
        organizationName: jiraOrganization.organizationName?.trim(),
        domain: jiraOrganization.domain?.trim(),
        email: jiraOrganization.email?.trim(),
        apiToken: jiraOrganization.apiToken?.trim()
      } : undefined,
      subscription: {
        plan: 'free',
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        maxUsers: 5,
        features: ['basic_worklog_tracking', 'team_management']
      }
    })

    await organization.save()

    // Update user with organizationId
    await User.findByIdAndUpdate((session as SessionWithUser).user.id, {
      organizationId: organization._id
      // role remains 'MANAGER' - no change needed
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Organization created successfully',
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          description: organization.description,
          jiraOrganization: organization.jiraOrganization,
          settings: organization.settings,
          subscription: organization.subscription
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Organization creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create organization' },
      { status: 500 }
    )
  }
}

// GET /api/organizations - Get user's organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions as any)
    
    if (!(session as SessionWithUser)?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const user = await User.findById((session as SessionWithUser).user.id).populate('organizationId')
    
    if (!user?.organizationId) {
      return NextResponse.json(
        { success: false, message: 'User does not belong to any organization' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        organization: user.organizationId
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Organization fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}