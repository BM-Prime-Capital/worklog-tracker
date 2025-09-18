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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build filter query
    const filter: any = {}
    
    if (role && role !== 'all') {
      filter.role = role
    }
    
    if (status && status !== 'all') {
      filter.isActive = status === 'active'
    }
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch users with pagination and population
    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .populate('organizationId', 'name slug')
        .select('-password -emailVerificationToken -resetPasswordToken -atlassianAccessToken -atlassianRefreshToken -invitationToken -oauthState')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        }
      }
    })

  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
