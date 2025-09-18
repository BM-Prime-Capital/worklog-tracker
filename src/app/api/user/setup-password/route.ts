import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newPassword } = await req.json()
    
    if (!newPassword) {
      return NextResponse.json({ 
        error: 'New password is required' 
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 })
    }

    await dbConnect()
    
    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json({ 
        error: 'Password already set for this account' 
      }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user with password and add 'password' to authMethods
    await User.findByIdAndUpdate(
      (session.user as any).id,
      { 
        password: hashedPassword,
        authMethods: [...(user.authMethods || []), 'password'] // Add password to existing auth methods
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Password setup successful'
    })

  } catch (error) {
    console.error('Password setup error:', error)
    return NextResponse.json({ 
      error: 'Failed to setup password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
