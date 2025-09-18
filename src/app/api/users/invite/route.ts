import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import { emailService } from '@/lib/emailService'
import crypto from 'crypto'

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

interface InviteUserRequest {
  firstName: string
  lastName: string
  email: string
  department?: string
  employmentType?: 'permanent' | 'intern'
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a manager
    if ((session as SessionWithUser).user?.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, message: 'Only managers can invite new users' },
        { status: 403 }
      )
    }

    await dbConnect()

    const body: InviteUserRequest = await request.json()
    
    // Validation
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: firstName, lastName, email' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate invitation token for Atlassian OAuth flow
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Get the manager's organization ID
    const manager = await User.findById((session as SessionWithUser).user.id)
    if (!manager || !manager.organizationId) {
      return NextResponse.json(
        { success: false, message: 'Manager must have an organization to invite users' },
        { status: 400 }
      )
    }

    // Create pending user with DEVELOPER role (no password needed for Atlassian OAuth)
    const newUser = new User({
      email: body.email.toLowerCase(),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      role: 'DEVELOPER', // Always set as DEVELOPER for invited users
      status: 'invited', // Pending invitation status
      organizationId: manager.organizationId, // Inherit organization from manager
      invitedBy: (session as SessionWithUser).user.id,
      invitedAt: new Date(),
      invitationToken: invitationToken,
      invitationExpires: invitationExpires,
      authMethods: ['atlassian'], // Start with Atlassian OAuth only
      isEmailVerified: false, // Will be verified when they complete OAuth
      department: body.department, // Save department from invitation
      employmentType: body.employmentType, // Save employment type from invitation
    })

    console.log('Creating user with data:', {
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      status: newUser.status,
      organizationId: newUser.organizationId,
      department: newUser.department,
      employmentType: newUser.employmentType,
      authMethods: newUser.authMethods,
      hasPassword: !!newUser.password
    })

    await newUser.save()

    // Generate invitation link for Atlassian OAuth flow
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/invite/accept?token=${invitationToken}`

    // Send invitation email
    const emailSent = await emailService.sendInvitationEmail({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      invitationLink,
      companyName: process.env.COMPANY_NAME || 'BM Prime Capital'
    })

    if (!emailSent) {
      console.warn(`Failed to send invitation email to ${body.email}`)
      // Don't fail the request if email fails, but log it
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Developer invitation sent successfully. They will receive an email to complete their Atlassian OAuth setup.',
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        status: newUser.status,
        invitedAt: newUser.invitedAt,
        createdAt: newUser.createdAt
      },
      emailSent
    }, { status: 201 })

  } catch (error) {
    console.error('Error inviting user:', error)
    
    // Log detailed validation errors
    if (error instanceof Error && 'errors' in error) {
      console.error('Validation errors:', (error as any).errors)
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to invite user',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


