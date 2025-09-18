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

    const { emailNotifications, worklogReminders, projectUpdates, weeklyReports } = await req.json()
    
    await dbConnect()
    
    const user = await User.findByIdAndUpdate(
      (session.user as any).id,
      { 
        notificationSettings: {
          emailNotifications: Boolean(emailNotifications),
          worklogReminders: Boolean(worklogReminders),
          projectUpdates: Boolean(projectUpdates),
          weeklyReports: Boolean(weeklyReports)
        }
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: user.notificationSettings
    })

  } catch (error) {
    console.error('Notification settings update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update notification settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      settings: user.notificationSettings || {
        emailNotifications: true,
        worklogReminders: true,
        projectUpdates: true,
        weeklyReports: false
      }
    })

  } catch (error) {
    console.error('Get notification settings error:', error)
    return NextResponse.json({ 
      error: 'Failed to get notification settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
