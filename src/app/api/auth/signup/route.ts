import { NextRequest, NextResponse } from 'next/server'
import { signUpSchema } from '@/lib/validation'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const validationResult = signUpSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName } = validationResult.data

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create new user - password will be automatically hashed by User model pre-save middleware
    const user = new User({
      email: email.toLowerCase(),
      password, // Plain password - will be hashed automatically
      firstName,
      lastName,
      isEmailVerified: false,
      role: 'MANAGER', // Self-registered users are MANAGERs (changed from DEVELOPER)
      emailVerificationToken,
      emailVerificationExpires,
      // organizationId will be set during onboarding
    })

    await user.save()

    // TODO: Send verification email here
    // For now, we'll simulate email verification by setting it to true
    user.isEmailVerified = true
    await user.save()

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email to verify your account.',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          role: user.role, // Will be 'MANAGER'
          // organizationId will be set during onboarding
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}