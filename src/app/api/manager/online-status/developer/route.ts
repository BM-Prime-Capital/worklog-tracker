import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import OnlineStatus from '@/models/OnlineStatus'
import User from '@/models/User'
import { getDateDaysAgoLocal } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
  try {
    
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developerId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!developerId) {
      return NextResponse.json({ error: 'Developer ID is required' }, { status: 400 })
    }

    await dbConnect()

    
    const user = await User.findById((session.user as any).id)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User is not associated with an organization' }, { status: 400 })
    }

    // Get the developer
   
    const developer = await User.findOne({
      _id: developerId,
      organizationId: user.organizationId,
      role: 'DEVELOPER'
    }).select('_id firstName lastName email atlassianAccountId atlassianDisplayName')

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Get date range
    const startDate = getDateDaysAgoLocal(days)

    // Get online status records for the developer
    
    const onlineStatusRecords = await OnlineStatus.find({
      userId: developerId,
      organizationId: user.organizationId,
      date: { $gte: startDate }
    }).sort({ date: -1, time: -1 })

    // Calculate statistics
    const totalDays = days
    const presentDays = onlineStatusRecords.filter(record => record.status === 'present').length
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

    // Calculate current streak
    let currentStreak = 0
    const sortedRecords = onlineStatusRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    for (const record of sortedRecords) {
      if (record.status === 'present') {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    for (const record of sortedRecords) {
      if (record.status === 'present') {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Calculate punctuality stats
    const punctualityStats = {
      early: onlineStatusRecords.filter(record => record.checkInType === 'early').length,
      onTime: onlineStatusRecords.filter(record => record.checkInType === 'on-time').length,
      late: onlineStatusRecords.filter(record => record.checkInType === 'late').length,
      total: onlineStatusRecords.length
    }

    // Construct name from firstName + lastName, with fallbacks
    let developerName = ''
    if (developer.firstName && developer.lastName) {
      developerName = `${developer.firstName} ${developer.lastName}`
    } else if (developer.atlassianDisplayName) {
      developerName = developer.atlassianDisplayName
    } else if (developer.firstName) {
      developerName = developer.firstName
    } else if (developer.lastName) {
      developerName = developer.lastName
    } else {
      developerName = 'Unknown Developer'
    }

    return NextResponse.json({
      success: true,
      data: {
        developer: {
          id: developer._id,
          name: developerName,
          email: developer.email,
          atlassianAccountId: developer.atlassianAccountId
        },
        stats: {
          currentStreak,
          longestStreak,
          totalDaysPresent: presentDays,
          totalDaysTracked: totalDays,
          attendanceRate
        },
        punctualityStats,
        records: onlineStatusRecords.map(record => ({
          id: record._id,
          status: record.status,
          mood: record.mood,
          description: record.description,
          date: record.date,
          time: record.time,
          checkInType: record.checkInType,
          isEdited: record.isEdited,
          editedBy: record.editedBy,
          editedAt: record.editedAt,
          editReason: record.editReason,
          originalStatus: record.originalStatus,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        }))
      }
    })

  } catch (error) {
    console.error('Get developer online status error:', error)
    return NextResponse.json(
      { error: 'Failed to get developer status' },
      { status: 500 }
    )
  }
}
