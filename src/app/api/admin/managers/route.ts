import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'

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
        { success: false, message: 'Only admins can access this resource' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'active', 'inactive', or null
    const department = searchParams.get('department')

    // Build filter object
    const filter: any = { role: 'MANAGER' }
    
    if (status) {
      filter.isActive = status === 'active'
    }
    
    if (department) {
      filter.department = department
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get managers with pagination
    const managers = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get total count for pagination
    const total = await User.countDocuments(filter)

    // Transform managers data
    const transformedManagers = managers.map(manager => ({
      id: manager._id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      department: manager.department,
      isActive: manager.isActive,
      lastLogin: manager.lastLogin,
      createdAt: manager.createdAt,
      managedTeams: 0, // TODO: Calculate from actual data
      managedDevelopers: 0, // TODO: Calculate from actual data
      permissions: ['team-management', 'project-oversight', 'reporting'] // TODO: Get from actual permissions
    }))

    return NextResponse.json({
      success: true,
      managers: transformedManagers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching managers:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch managers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
        { success: false, message: 'Only admins can create managers' },
        { status: 403 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { firstName, lastName, email, department } = body

    // Validation
    if (!firstName || !lastName || !email || !department) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: firstName, lastName, email, department' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new manager
    const newManager = new User({
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'MANAGER',
      department: department,
      isEmailVerified: false,
      isActive: true,
      createdBy: (session as SessionWithUser).user.id,
      updatedBy: (session as SessionWithUser).user.id
    })

    await newManager.save()

    // Return success response (don't include password)
    return NextResponse.json({
      success: true,
      message: 'Manager created successfully',
      manager: {
        id: newManager._id,
        email: newManager.email,
        firstName: newManager.firstName,
        lastName: newManager.lastName,
        role: newManager.role,
        department: newManager.department,
        isActive: newManager.isActive,
        createdAt: newManager.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating manager:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create manager' },
      { status: 500 }
    )
  }
}
