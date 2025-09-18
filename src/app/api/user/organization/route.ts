import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'

export async function GET(req: NextRequest) {
  try {
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    // Get user with organization data
    const user = await User.findById((session.user as any).id).populate('organizationId')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ 
        error: 'No organization assigned',
        message: 'You are not assigned to any organization'
      }, { status: 404 })
    }

    // Get organization details
    const organization = await Organization.findById(user.organizationId)
    if (!organization) {
      return NextResponse.json({ 
        error: 'Organization not found',
        message: 'Your assigned organization could not be found'
      }, { status: 404 })
    }

    // Return organization data
    return NextResponse.json({
      success: true,
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        domain: organization.jiraOrganization?.domain,
        email: organization.jiraOrganization?.email,
        settings: {
          timezone: organization.settings.timezone,
          workingDays: organization.settings.workingDays,
          workingHours: organization.settings.workingHours
        },
        subscription: {
          plan: organization.subscription.plan,
          status: organization.subscription.status,
          maxUsers: organization.subscription.maxUsers
        }
      }
    })

  } catch (error) {
    console.error('Organization fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch organization data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
