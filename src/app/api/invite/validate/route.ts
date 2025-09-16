import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Invitation token is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Find user with the invitation token
    const user = await User.findOne({
      invitationToken: token,
      status: 'invited'
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    if (user.invitationExpires && new Date() > user.invitationExpires) {
      return NextResponse.json(
        { success: false, message: 'Invitation has expired' },
        { status: 410 }
      )
    }

    // Return success with user info
    return NextResponse.json({
      success: true,
      message: 'Invitation is valid',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        invitedAt: user.invitedAt
      }
    })

  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}
