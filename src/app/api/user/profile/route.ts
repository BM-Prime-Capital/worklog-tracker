import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function PUT(req: NextRequest) {
  try {
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName } = await req.json()
    
    if (!firstName || !lastName) {
      return NextResponse.json({ 
        error: 'First name and last name are required' 
      }, { status: 400 })
    }

    await dbConnect()
    
    const user = await User.findByIdAndUpdate(
      (session.user as any).id,
      { 
        firstName: firstName.trim(),
        lastName: lastName.trim()
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
