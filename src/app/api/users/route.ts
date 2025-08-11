import { NextRequest, NextResponse } from 'next/server'
import { CreateUserRequest, UpdateUserRequest, User } from '@/lib/types'

// In-memory storage for development - in production this would be a real database
const users: User[] = []

// GET /api/users - Get all users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const department = searchParams.get('department')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    // Filter users
    let filteredUsers = [...users]

    if (department) {
      filteredUsers = filteredUsers.filter(user => user.department === department)
    }

    if (isActive !== null) {
      const isActiveBool = isActive === 'true'
      filteredUsers = filteredUsers.filter(user => user.isActive === isActiveBool)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.displayName.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const total = filteredUsers.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json()
    
    // Validation
    if (!body.firstName || !body.lastName || !body.email || !body.department || !body.employmentType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = users.find(user => user.email === body.email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      accountId: `mock-account-${Date.now()}`,
      email: body.email,
      username: body.email.split('@')[0],
      firstName: body.firstName,
      lastName: body.lastName,
      displayName: `${body.firstName} ${body.lastName}`,
      department: body.department,
      employmentType: body.employmentType,
      role: body.role || 'Team Member',
      title: body.title || 'Team Member',
      managerId: body.managerId,
      isActive: true,
      isAdmin: false,
      permissions: [], // Start with no permissions, can be added later
      accessLevel: 'basic' as const,
      jiraEnabled: false, // Will be enabled after Jira sync
      otherTools: [],
      timezone: 'America/New_York', // Default timezone
      workingHours: {
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'America/New_York',
        workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[],
        breakDuration: 60
      },
      currentProjects: [],
      skills: [],
      certifications: [],
      performanceMetrics: {
        overallScore: 0,
        productivityScore: 0,
        qualityScore: 0,
        collaborationScore: 0,
        innovationScore: 0,
        evaluationPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly'
      },
      worklogStats: {
        totalHoursLogged: 0,
        averageDailyHours: 0,
        mostActiveDay: '',
        mostActiveProject: '',
        weeklyAverage: 0,
        monthlyAverage: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system' // In production, this would be the current user's ID
    }

    users.push(newUser)

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PUT /api/users - Bulk update users
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.userIds && body.updates) {
      // Bulk update
      const { userIds, updates } = body
      const results = []

      for (const userId of userIds) {
        const userIndex = users.findIndex(user => user.id === userId)
        if (userIndex !== -1) {
          users[userIndex] = {
            ...users[userIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: 'system'
          }
          results.push({
            success: true,
            user: users[userIndex],
            message: 'User updated successfully'
          })
        } else {
          results.push({
            success: false,
            message: 'User not found'
          })
        }
      }

      return NextResponse.json({
        success: true,
        results
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error bulk updating users:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to bulk update users' },
      { status: 500 }
    )
  }
} 