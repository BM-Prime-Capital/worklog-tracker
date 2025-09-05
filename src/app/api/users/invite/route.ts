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

    // Generate a temporary password (user will change this)
    const tempPassword = crypto.randomBytes(8).toString('hex')
    
    // Generate password reset token for invitation
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create new user with DEVELOPER role
    const newUser = new User({
      email: body.email.toLowerCase(),
      password: tempPassword, // This will be hashed by the User model pre-save middleware
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      role: 'DEVELOPER', // Always set as DEVELOPER for invited users
      isEmailVerified: false, // Will be verified when they set their password
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpiry,
      // Additional fields can be added here as needed
    })

    await newUser.save()

    // Generate invitation link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/auth/set-password?token=${resetToken}`

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

    // Return success response (don't include the temp password)
    return NextResponse.json({
      success: true,
      message: 'User invited successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        createdAt: newUser.createdAt
      },
      emailSent
    }, { status: 201 })

  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to invite user' },
      { status: 500 }
    )
  }
}


