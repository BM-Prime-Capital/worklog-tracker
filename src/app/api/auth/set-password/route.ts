import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Find user with this reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Update user's password and clear reset token
    user.password = password // This will be hashed by the User model pre-save middleware
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.isEmailVerified = true // Mark email as verified since they've set a password

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. Your account is now activated.',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      }
    })

  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to set password' },
      { status: 500 }
    )
  }
}




