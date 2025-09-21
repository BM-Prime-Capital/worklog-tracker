import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import OnlineStatus from '@/models/OnlineStatus'
import User from '@/models/User'
import Organization from '@/models/Organization'
import { getCurrentDateLocal, formatTimeLocal } from '@/lib/dateUtils'

export async function POST(request: NextRequest) {
  try {
    
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mood, description } = await request.json()

    await dbConnect()

    // Get user details
   
    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User not assigned to an organization' }, { status: 400 })
    }

    // Get organization details for check-in window
    const organization = await Organization.findById(user.organizationId)
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get organization check-in window (default if not set)
    const checkInWindow = organization.checkInWindow || {
      startTime: '08:00',
      endTime: '10:00',
      timezone: 'UTC+3'
    }

    // Calculate current time and check-in type
    const now = new Date()
    const currentTime = formatTimeLocal(now) // HH:MM format
    const currentDate = getCurrentDateLocal() // YYYY-MM-DD format (local timezone)

    let checkInType: 'early' | 'on-time' | 'late' = 'on-time'
    if (currentTime < checkInWindow.startTime) {
      checkInType = 'early'
    } else if (currentTime > checkInWindow.endTime) {
      checkInType = 'late'
    }

    // Check if user already checked in today
    
    const existingCheckIn = await OnlineStatus.findOne({
      userId: (user._id as any).toString(),
      date: currentDate
    })

    if (existingCheckIn) {
      return NextResponse.json({ 
        error: 'Already checked in today',
        checkIn: existingCheckIn 
      }, { status: 400 })
    }

    // Create new check-in record
    
    const onlineStatus = new OnlineStatus({
      userId: (user._id as any).toString(),
      atlassianAccountId: user.atlassianAccountId,
      organizationId: user.organizationId,
      status: 'present',
      mood: mood || 'present',
      description: description || '',
      date: currentDate,
      time: currentTime,
      checkInType,
      organizationCheckInWindow: checkInWindow
    })

    await onlineStatus.save()

    return NextResponse.json({
      success: true,
      checkIn: {
        id: onlineStatus._id,
        status: onlineStatus.status,
        mood: onlineStatus.mood,
        description: onlineStatus.description,
        date: onlineStatus.date,
        time: onlineStatus.time,
        checkInType: onlineStatus.checkInType,
        organizationCheckInWindow: onlineStatus.organizationCheckInWindow
      }
    })

  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to check in' },
      { status: 500 }
    )
  }
}
