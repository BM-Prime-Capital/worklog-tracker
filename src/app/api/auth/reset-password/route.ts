import { NextRequest, NextResponse } from 'next/server'
import { resetPasswordSchema } from '@/lib/validation'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const validationResult = resetPasswordSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { token, password } = validationResult.data

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Update password and clear reset token
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return NextResponse.json({
      message: 'Password reset successful'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 