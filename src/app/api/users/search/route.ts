import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/lib/types'

// In-memory storage for development - in production this would be a real database
const users: User[] = []

// GET /api/users/search - Search users with advanced filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const department = searchParams.get('department')
    const isActive = searchParams.get('isActive')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      )
    }

    // Filter users based on search criteria
    const filteredUsers = users.filter(user => {
      // Text search across multiple fields
      const searchLower = query.toLowerCase()
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.displayName.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        user.title.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false

      // Department filter
      if (department && user.department !== department) return false

      // Active status filter
      if (isActive !== null) {
        const isActiveBool = isActive === 'true'
        if (user.isActive !== isActiveBool) return false
      }

      // Role filter
      if (role && user.role.toLowerCase() !== role.toLowerCase()) return false

      return true
    })

    // Sort by relevance (exact matches first, then partial matches)
    filteredUsers.sort((a, b) => {
      const aExactMatch = 
        a.firstName.toLowerCase() === query.toLowerCase() ||
        a.lastName.toLowerCase() === query.toLowerCase() ||
        a.email.toLowerCase() === query.toLowerCase()
      
      const bExactMatch = 
        b.firstName.toLowerCase() === query.toLowerCase() ||
        b.lastName.toLowerCase() === query.toLowerCase() ||
        b.email.toLowerCase() === query.toLowerCase()

      if (aExactMatch && !bExactMatch) return -1
      if (!aExactMatch && bExactMatch) return 1
      return 0
    })

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
      totalPages: Math.ceil(total / limit),
      query,
      filters: {
        department: department || null,
        isActive: isActive ? isActive === 'true' : null,
        role: role || null
      }
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to search users' },
      { status: 500 }
    )
  }
} 