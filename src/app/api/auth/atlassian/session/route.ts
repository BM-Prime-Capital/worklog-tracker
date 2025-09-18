import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    console.log("Session endpoint called with userId:", userId)
    
    if (!userId) {
      console.log("No userId provided, redirecting to login")
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_user', req.url)
      )
    }

    // Connect to database
    await dbConnect()

    // Find the user
    const user = await User.findById(userId)
    console.log("Found user:", user ? user.email : "null")
    
    if (!user) {
      console.log("User not found, redirecting to login")
      return NextResponse.redirect(
        new URL('/auth/login?error=user_not_found', req.url)
      )
    }

    // Type assertion for _id to handle Mongoose typing
    const userIdString = (user._id as { toString(): string }).toString()

    // For Atlassian OAuth users, we need to set a temporary password
    // so they can use the credentials provider
    let tempPassword = user.password // Check if user already has a password
    
    if (!tempPassword) {
      // Generate a temporary password for Atlassian OAuth users
      tempPassword = `atlassian_${userIdString}_${Date.now()}` // Unique temporary password
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      
      // Update user with temporary password and add 'password' to authMethods
      await User.findByIdAndUpdate(user._id, { 
        password: hashedPassword,
        authMethods: [...(user.authMethods || []), 'password'] // Add password to existing auth methods
      })
    }

    // Redirect to success page without password in URL
    // The success page will call our API to get credentials securely
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = NextResponse.redirect(
      new URL(`/auth/atlassian-success?userId=${userIdString}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&role=${user.role}`, baseUrl)
    )

    console.log("Redirecting to success page for user:", user.email)
    return response

  } catch (error) {
    console.error('Session creation error:', error)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      new URL('/auth/login?error=session_creation_failed', baseUrl)
    )
  }
}
