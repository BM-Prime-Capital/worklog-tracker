import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import OnlineStatus from '@/models/OnlineStatus'
import User from '@/models/User'
import Organization from '@/models/Organization'
import { getCurrentDateLocal, getDateDaysAgoLocal, formatDateLocal } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
  try {
  
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Optional: get specific date, defaults to today
    const userId = searchParams.get('userId') // Optional: filter by specific user

    await dbConnect()

   
    const user = await User.findById((session.user as any).id)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User is not associated with an organization' }, { status: 400 })
    }

    // Get organization details
    const organization = await Organization.findById(user.organizationId)
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get all developers in the organization
   
    const developers = await User.find({ 
      organizationId: user.organizationId,
      role: 'DEVELOPER'
    }).select('_id firstName lastName email atlassianAccountId atlassianDisplayName')
    
    console.log('Raw developers from database:', developers)

    const targetDate = date || getCurrentDateLocal()
    console.log('Using target date:', targetDate)

    // Build query for online status records
    const query: any = {
      organizationId: user.organizationId
    }

    if (userId) {
      query.userId = userId
    }

    // Always get last 30 days of records for better visibility
    const thirtyDaysAgo = getDateDaysAgoLocal(30)
    query.date = { $gte: thirtyDaysAgo }
    
    console.log('Query for online status records:', query)
    console.log('Target date from frontend:', date)
    console.log('Current local date:', getCurrentDateLocal())
    console.log('Current UTC date:', new Date().toISOString().split('T')[0])
    console.log('Date difference (UTC vs Local):', new Date().toISOString().split('T')[0], 'vs', getCurrentDateLocal())
    console.log('Organization ID:', user.organizationId)

    // Get online status records with populated user data
  
    const onlineStatusRecords = await OnlineStatus.find(query)
      .populate('userId', 'firstName lastName email atlassianAccountId atlassianDisplayName')
      .sort({ date: -1, time: -1 })
    
    console.log('Found online status records:', onlineStatusRecords.length)
    console.log('Sample record:', onlineStatusRecords[0])
    
    // If no records found for last 30 days, try to get all records for debugging
    if (onlineStatusRecords.length === 0) {
      console.log('No records found for last 30 days, checking all records...')
      const allRecords = await OnlineStatus.find({ organizationId: user.organizationId }).limit(5)
      console.log('All records in database:', allRecords.length)
      console.log('Sample of all records:', allRecords[0])
      
      // If there are records but not in the last 30 days, use them anyway for testing
      if (allRecords.length > 0) {
        console.log('Using all records since no recent records found')
        const allRecordsWithUsers = await Promise.all(allRecords.map(async (record) => {
          if (!record.userId || typeof record.userId === 'string') {
            const user = await User.findById(record.userId).select('firstName lastName email atlassianAccountId atlassianDisplayName')
            if (user) {
              record.userId = user as any
            }
          }
          return record
        }))
        
        // Use all records instead of empty recent records
        onlineStatusRecords.push(...allRecordsWithUsers)
      }
    }

    // Fallback: If populate didn't work, manually fetch user data
    const recordsWithUsers = await Promise.all(onlineStatusRecords.map(async (record) => {
      let populatedUserId = record.userId
      
      if (!record.userId || typeof record.userId === 'string') {
        // If userId is not populated, fetch user data manually
        console.log('Fetching user data for userId:', record.userId)
        const user = await User.findById(record.userId).select('firstName lastName email atlassianAccountId atlassianDisplayName')
        console.log('Found user:', user)
        if (user) {
          populatedUserId = user as any // Store populated user data
        }
      }
      
      // Ensure we have a proper user object structure
      let userObject = null
      if (populatedUserId && typeof populatedUserId === 'object') {
        // Construct name from firstName + lastName, with fallbacks
        let name = ''
        if (populatedUserId.firstName && populatedUserId.lastName) {
          name = `${populatedUserId.firstName} ${populatedUserId.lastName}`
        } else if (populatedUserId.atlassianDisplayName) {
          name = populatedUserId.atlassianDisplayName
        } else if (populatedUserId.firstName) {
          name = populatedUserId.firstName
        } else if (populatedUserId.lastName) {
          name = populatedUserId.lastName
        } else {
          name = 'Unknown Developer'
        }
        
        userObject = {
          id: populatedUserId._id,
          name: name,
          email: populatedUserId.email,
          atlassianAccountId: populatedUserId.atlassianAccountId
        }
      }
      
      return {
        ...record.toObject(), // Convert Mongoose document to plain object
        userId: populatedUserId,
        user: userObject
      }
    }))

    // Get today's check-ins for all developers
    const todayCheckIns = await OnlineStatus.find({
      organizationId: user.organizationId,
      date: targetDate
    }).populate('userId', 'firstName lastName email atlassianAccountId atlassianDisplayName')

    // Calculate statistics
    const totalDevelopers = developers.length
    const presentToday = todayCheckIns.filter(record => record.status === 'present').length
    const absentToday = totalDevelopers - presentToday
    const attendanceRate = totalDevelopers > 0 ? Math.round((presentToday / totalDevelopers) * 100) : 0

    // Calculate punctuality stats for today
    const punctualityStats = {
      early: todayCheckIns.filter(record => record.checkInType === 'early').length,
      onTime: todayCheckIns.filter(record => record.checkInType === 'on-time').length,
      late: todayCheckIns.filter(record => record.checkInType === 'late').length,
      total: todayCheckIns.length
    }

    // Get daily presence data for the last 7 days
    const dailyPresenceData = []
    
    for (let i = 6; i >= 0; i--) {
      const currentDate = getDateDaysAgoLocal(i)
      const dayRecords = await OnlineStatus.find({
        organizationId: user.organizationId,
        date: currentDate
      })
      
      const presentCount = dayRecords.filter(record => record.status === 'present').length
      const totalHours = dayRecords.reduce((sum, record) => {
        // Calculate hours based on check-in time (simplified)
        const checkInTime = record.time.split(':')
        const hours = parseInt(checkInTime[0]) + parseInt(checkInTime[1]) / 60
        return sum + hours
      }, 0)
      
      dailyPresenceData.push({
        date: currentDate,
        onlineCount: presentCount,
        totalCount: totalDevelopers,
        averageHours: totalDevelopers > 0 ? totalHours / totalDevelopers : 0
      })
    }

    // Get organization check-in window
    const checkInWindow = organization.checkInWindow || {
      startTime: '08:00',
      endTime: '10:00',
      timezone: 'UTC+3'
    }

    const developersResponse = developers.map(dev => {
      // Construct name from firstName + lastName, with fallbacks
      let name = ''
      if (dev.firstName && dev.lastName) {
        name = `${dev.firstName} ${dev.lastName}`
      } else if (dev.atlassianDisplayName) {
        name = dev.atlassianDisplayName
      } else if (dev.firstName) {
        name = dev.firstName
      } else if (dev.lastName) {
        name = dev.lastName
      } else {
        name = 'Unknown Developer'
      }
      
      return {
        id: dev._id,
        name: name,
        email: dev.email,
        atlassianAccountId: dev.atlassianAccountId
      }
    })
    
    console.log('Developers response:', developersResponse)
    console.log('Final online status records count:', recordsWithUsers.length)
    console.log('Sample final record:', recordsWithUsers[0])
    console.log('Sample final record userId type:', typeof recordsWithUsers[0]?.userId)
    console.log('Sample final record userId:', recordsWithUsers[0]?.userId)
    console.log('Sample final record time:', recordsWithUsers[0]?.time)
    console.log('Sample final record date:', recordsWithUsers[0]?.date)
    console.log('Sample final record checkInType:', recordsWithUsers[0]?.checkInType)
    console.log('Sample final record status:', recordsWithUsers[0]?.status)
    console.log('Sample final record mood:', recordsWithUsers[0]?.mood)
    console.log('Sample final record description:', recordsWithUsers[0]?.description)
    console.log('Sample final record user object:', recordsWithUsers[0]?.user)
    console.log('Sample final record user name:', recordsWithUsers[0]?.user?.name)
    console.log('Sample final record user email:', recordsWithUsers[0]?.user?.email)

    // Group records by day for weekly view
    const weeklyRecords: { [key: string]: any } = {}
    const today = getCurrentDateLocal()
    
    // Get the start of the week (Monday)
    const todayDate = new Date(today)
    const dayOfWeek = todayDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Handle Sunday as start of previous week
    const startOfWeek = new Date(todayDate)
    startOfWeek.setDate(todayDate.getDate() + mondayOffset)
    
    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      const dateStr = formatDateLocal(currentDate)
      
      weeklyRecords[dateStr] = {
        date: dateStr,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        isToday: dateStr === today,
        records: []
      }
    }
    
    // Populate records for each day
    recordsWithUsers.forEach(record => {
      const recordDate = record.date
      if (weeklyRecords[recordDate]) {
        weeklyRecords[recordDate].records.push({
          id: record._id,
          userId: record.userId._id || record.userId,
          atlassianAccountId: record.atlassianAccountId,
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
          updatedAt: record.updatedAt,
          user: record.user
        })
      }
    })
    
    // Convert to array and sort by date (today first)
    const weeklyRecordsArray = Object.values(weeklyRecords).sort((a: any, b: any) => {
      if (a.isToday) return -1
      if (b.isToday) return 1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    return NextResponse.json({
      success: true,
      data: {
        developers: developersResponse,
        todayStatus: {
          present: presentToday,
          absent: absentToday,
          total: totalDevelopers,
          attendanceRate
        },
        punctualityStats,
        organizationCheckInWindow: checkInWindow,
        dailyPresenceData,
        weeklyRecords: weeklyRecordsArray,
        onlineStatusRecords: recordsWithUsers.map(record => {
          console.log('Mapping record for response:', {
            id: record._id,
            date: record.date,
            time: record.time,
            checkInType: record.checkInType,
            status: record.status
          })
          
          return {
            id: record._id,
            userId: record.userId._id || record.userId,
            atlassianAccountId: record.atlassianAccountId,
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
            updatedAt: record.updatedAt,
            // Include populated user data (already constructed in recordsWithUsers)
            user: record.user
          }
        })
      }
    })

  } catch (error) {
    console.error('Get manager online status error:', error)
    return NextResponse.json(
      { error: 'Failed to get online status data' },
      { status: 500 }
    )
  }
}
