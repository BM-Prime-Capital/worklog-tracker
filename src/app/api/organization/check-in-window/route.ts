import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import Organization from '@/models/Organization'
import User from '@/models/User'

export async function PUT(request: NextRequest) {
  try {
  
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Get user details
   
    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User not assigned to an organization' }, { status: 400 })
    }

    // Check if user is a manager or admin
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { startTime, endTime, timezone } = await request.json()

    // Validate input
    if (!startTime || !endTime || !timezone) {
      return NextResponse.json({ 
        error: 'Start time, end time, and timezone are required' 
      }, { status: 400 })
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({ 
        error: 'Invalid time format. Use HH:MM format (e.g., 08:00)' 
      }, { status: 400 })
    }

    // Validate that start time is before end time
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])
    
    if (startMinutes >= endMinutes) {
      return NextResponse.json({ 
        error: 'Start time must be before end time' 
      }, { status: 400 })
    }

    // Update organization check-in window
    const organization = await Organization.findByIdAndUpdate(
      user.organizationId,
      {
        checkInWindow: {
          startTime,
          endTime,
          timezone
        }
      },
      { new: true }
    )

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in window updated successfully',
      checkInWindow: organization.checkInWindow
    })

  } catch (error) {
    console.error('Update check-in window error:', error)
    return NextResponse.json(
      { error: 'Failed to update check-in window' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
  
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Get user details
   
    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User not assigned to an organization' }, { status: 400 })
    }

    // Get organization details
    const organization = await Organization.findById(user.organizationId)
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      checkInWindow: organization.checkInWindow || {
        startTime: '08:00',
        endTime: '10:00',
        timezone: 'UTC+3'
      }
    })

  } catch (error) {
    console.error('Get check-in window error:', error)
    return NextResponse.json(
      { error: 'Failed to get check-in window' },
      { status: 500 }
    )
  }
}
