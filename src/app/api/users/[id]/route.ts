import { NextRequest, NextResponse } from 'next/server'
import { UpdateUserRequest, User } from '@/lib/types'

// In-memory storage for development - in production this would be a real database
const users: User[] = []

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = users.find(u => u.id === id)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update a specific user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateUserRequest = await request.json()
    const userIndex = users.findIndex(u => u.id === id)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Update user with type-safe merge
    const updatedUser: User = {
      ...users[userIndex],
      // Handle non-permission fields
      firstName: body.firstName ?? users[userIndex].firstName,
      lastName: body.lastName ?? users[userIndex].lastName,
      department: body.department ?? users[userIndex].department,
      employmentType: body.employmentType ?? users[userIndex].employmentType,
      role: body.role ?? users[userIndex].role,
      title: body.title ?? users[userIndex].title,
      managerId: body.managerId ?? users[userIndex].managerId,
      isActive: body.isActive ?? users[userIndex].isActive,
      // Handle permissions separately to ensure type safety
      permissions: body.permissions ? body.permissions.map(perm => ({
        id: perm.id || `perm-${Date.now()}-${Math.random()}`,
        name: perm.name || 'default-permission',
        description: perm.description || 'Default permission',
        resource: perm.resource || 'projects',
        actions: perm.actions || ['read'],
        grantedAt: perm.grantedAt || new Date().toISOString(),
        grantedBy: perm.grantedBy || 'system'
      })) : users[userIndex].permissions,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    }

    users[userIndex] = updatedUser

    return NextResponse.json({
      success: true,
      user: users[userIndex],
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a specific user (soft delete)
export async function DELETE(
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

    // Soft delete - set isActive to false
    users[userIndex] = {
      ...users[userIndex],
      isActive: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 