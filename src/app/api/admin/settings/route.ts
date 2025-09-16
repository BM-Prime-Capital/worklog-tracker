import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'

interface SessionWithUser {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isEmailVerified: boolean
    organizationId?: string
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is an admin
    if ((session as SessionWithUser).user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can access this data' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Get system statistics
    const [
      totalUsers,
      totalOrganizations,
      activeUsers,
      recentSignups,
      systemHealth
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      getSystemHealth()
    ])

    // Get platform configuration
    const platformConfig = {
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
      emailNotifications: process.env.EMAIL_NOTIFICATIONS !== 'false',
      maxUsersPerOrganization: parseInt(process.env.MAX_USERS_PER_ORG || '100'),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '24'),
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false'
    }

    // Get security settings
    const securitySettings = {
      twoFactorEnabled: process.env.TWO_FACTOR_ENABLED === 'true',
      passwordExpiryDays: parseInt(process.env.PASSWORD_EXPIRY_DAYS || '90'),
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '30'),
      sessionSecurity: process.env.SESSION_SECURITY || 'standard'
    }

    // Get notification settings
    const notificationSettings = {
      emailNotifications: process.env.EMAIL_NOTIFICATIONS !== 'false',
      systemAlerts: process.env.SYSTEM_ALERTS !== 'false',
      userActivityLogs: process.env.USER_ACTIVITY_LOGS !== 'false',
      errorReporting: process.env.ERROR_REPORTING !== 'false',
      maintenanceNotifications: process.env.MAINTENANCE_NOTIFICATIONS !== 'false'
    }

    // Get integration settings
    const integrationSettings = {
      jiraIntegration: process.env.JIRA_INTEGRATION_ENABLED !== 'false',
      slackIntegration: process.env.SLACK_INTEGRATION_ENABLED === 'true',
      emailService: process.env.EMAIL_SERVICE || 'smtp',
      analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false',
      backupEnabled: process.env.BACKUP_ENABLED !== 'false'
    }

    const settings = {
      systemStats: {
        totalUsers,
        totalOrganizations,
        activeUsers,
        recentSignups,
        systemHealth
      },
      platformConfig,
      securitySettings,
      notificationSettings,
      integrationSettings
    }

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch admin settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is an admin
    if ((session as SessionWithUser).user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can modify settings' },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    const { section, settings } = updateData

    // Validate section
    const validSections = ['platform', 'security', 'notifications', 'integrations']
    if (!validSections.includes(section)) {
      return NextResponse.json(
        { success: false, message: 'Invalid settings section' },
        { status: 400 }
      )
    }

    // Update environment variables (in a real app, you'd want to persist these to a database)
    // For now, we'll just validate and return success
    const updatedSettings = await updateSettings(section, settings)

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating admin settings:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function getSystemHealth(): Promise<'healthy' | 'warning' | 'error'> {
  try {
    // Simple health check - in a real app, you'd check database connectivity, external services, etc.
    return 'healthy'
  } catch (error) {
    console.error('System health check failed:', error)
    return 'error'
  }
}

async function updateSettings(section: string, settings: any) {
  // In a real application, you would:
  // 1. Validate the settings
  // 2. Update them in a database or configuration store
  // 3. Apply the changes to the running application
  // 4. Log the changes for audit purposes
  
  // For now, we'll just return the settings as if they were updated
  return {
    section,
    settings,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin'
  }
}
