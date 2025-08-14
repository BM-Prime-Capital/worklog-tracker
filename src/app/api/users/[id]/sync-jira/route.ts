import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/lib/types'

// In-memory storage for development - in production this would be a real database
const users: User[] = []

// POST /api/users/[id]/sync-jira - Sync user data with Jira
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userIndex = users.findIndex(u => u.id === id)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[userIndex]

    // Simulate Jira sync process
    // In production, this would:
    // 1. Call Jira API to get user data
    // 2. Update user information
    // 3. Sync worklog data
    // 4. Update performance metrics

    // Mock Jira sync response
    const jiraData = {
      accountId: `jira-${Date.now()}`,
      displayName: user.displayName,
      emailAddress: user.email,
      timeZone: user.timezone,
      active: true
    }

    // Update user with Jira data
    users[userIndex] = {
      ...user,
      accountId: jiraData.accountId,
      jiraEnabled: true,
      updatedAt: new Date(),
      updatedBy: 'jira-sync'
    }

    return NextResponse.json({
      success: true,
      user: users[userIndex],
      message: 'User synced with Jira successfully',
      jiraData
    })
  } catch (error) {
    console.error('Error syncing user with Jira:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to sync with Jira' },
      { status: 500 }
    )
  }
} 