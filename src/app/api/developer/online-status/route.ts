import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import OnlineStatus from '@/models/OnlineStatus'
import User from '@/models/User'
import Organization from '@/models/Organization'
import { getCurrentDateLocal, getDateDaysAgoLocal } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
  try {

    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Optional: get specific date, defaults to today

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

    const targetDate = date || getCurrentDateLocal()

    // Get today's check-in status
    
    const todayCheckIn = await OnlineStatus.findOne({
      userId: (user._id as any).toString(),
      date: targetDate
    })

    // Get check-in history for the last 30 days
    const thirtyDaysAgoStr = getDateDaysAgoLocal(30)

 
    const checkInHistory = await OnlineStatus.find({
      userId: (user._id as any).toString(),
      date: { $gte: thirtyDaysAgoStr }
    }).sort({ date: -1 }).limit(30)

    // Calculate statistics
    const totalCheckIns = checkInHistory.length
    const presentDays = checkInHistory.filter(checkIn => checkIn.status === 'present').length
    const attendanceRate = totalCheckIns > 0 ? Math.round((presentDays / totalCheckIns) * 100) : 0

    // Calculate current streak
    let currentStreak = 0
    const sortedHistory = checkInHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    for (const checkIn of sortedHistory) {
      if (checkIn.status === 'present') {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    for (const checkIn of sortedHistory) {
      if (checkIn.status === 'present') {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Calculate punctuality stats
    const punctualityStats = {
      early: checkInHistory.filter(checkIn => checkIn.checkInType === 'early').length,
      onTime: checkInHistory.filter(checkIn => checkIn.checkInType === 'on-time').length,
      late: checkInHistory.filter(checkIn => checkIn.checkInType === 'late').length,
      total: totalCheckIns
    }

    // Get organization check-in window
    const checkInWindow = organization.checkInWindow || {
      startTime: '08:00',
      endTime: '10:00',
      timezone: 'UTC+3'
    }

    return NextResponse.json({
      success: true,
      data: {
        todayStatus: todayCheckIn ? {
          status: todayCheckIn.status,
          mood: todayCheckIn.mood,
          description: todayCheckIn.description,
          time: todayCheckIn.time,
          checkInType: todayCheckIn.checkInType,
          isEdited: todayCheckIn.isEdited
        } : null,
        stats: {
          currentStreak,
          longestStreak,
          totalDaysPresent: presentDays,
          totalDaysTracked: totalCheckIns,
          attendanceRate
        },
        punctualityStats,
        organizationCheckInWindow: checkInWindow,
        recentActivity: checkInHistory.slice(0, 10).map(checkIn => ({
          date: checkIn.date,
          time: checkIn.time,
          status: checkIn.status,
          mood: checkIn.mood,
          description: checkIn.description,
          checkInType: checkIn.checkInType,
          isEdited: checkIn.isEdited
        }))
      }
    })

  } catch (error) {
    console.error('Get online status error:', error)
    return NextResponse.json(
      { error: 'Failed to get online status' },
      { status: 500 }
    )
  }
}
