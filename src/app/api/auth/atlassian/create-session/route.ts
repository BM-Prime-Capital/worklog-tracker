import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Type assertion for _id to handle Mongoose typing
    const userIdString = (user._id as { toString(): string }).toString()

    // For Atlassian OAuth users, we need to set a temporary password
    // so they can use the credentials provider
    let tempPassword = user.password // Check if user already has a password
    
    if (!tempPassword) {
      // Generate a temporary password for Atlassian OAuth users
      tempPassword = `atlassian_${userIdString}_${Date.now()}` // Unique temporary password
      console.log('Generated temporary password:', tempPassword)
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      console.log('Hashed password length:', hashedPassword.length)
      
      // Update user with temporary password and add 'password' to authMethods
      await User.findByIdAndUpdate(user._id, { 
        password: hashedPassword,
        authMethods: [...(user.authMethods || []), 'password'] // Add password to existing auth methods
      })
      console.log('Updated user with temporary password')
    } else {
      console.log('User already has a password, using existing one')
      // For existing passwords, we need to return the plain text
      // This is a security concern, but necessary for OAuth flow
      // In production, consider using a different approach
      tempPassword = `atlassian_${userIdString}_${Date.now()}` // Generate new temp password
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      await User.findByIdAndUpdate(user._id, { 
        password: hashedPassword,
        authMethods: [...(user.authMethods || []), 'password']
      })
      console.log('Generated new temporary password for existing user')
    }

    // Return the credentials for the frontend to use with NextAuth
    const response = NextResponse.json({ 
      success: true,
      credentials: {
        email: user.email,
        password: tempPassword // Return the temporary password
      },
      user: { // Also return some user data for convenience
        id: userIdString,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role
      }
    })

    return response

  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}