import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserResponse, 
  UsersResponse,
  UserPermission,
  WorkingHours,
  PerformanceMetrics,
  WorklogStats
} from './types'

class UserService {
  private baseUrl = '/api/users'

  // Create a new user
  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user')
      }

      return data
    } catch (error) {
      console.error('Error creating user:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create user',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  // Get all users with pagination and filtering
  async getUsers(params?: {
    page?: number
    limit?: number
    department?: string
    isActive?: boolean
    search?: string
  }): Promise<UsersResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.department) searchParams.append('department', params.department)
      if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())
      if (params?.search) searchParams.append('search', params.search)

      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users')
      }

      return data
    } catch (error) {
      console.error('Error fetching users:', error)
      return {
        success: false,
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        message: error instanceof Error ? error.message : 'Failed to fetch users'
      }
    }
  }

  // Get a single user by ID
  async getUserById(userId: string): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user')
      }

      return data
    } catch (error) {
      console.error('Error fetching user:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user'
      }
    }
  }

  // Update an existing user
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user')
      }

      return data
    } catch (error) {
      console.error('Error updating user:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user'
      }
    }
  }

  // Delete a user (soft delete - set isActive to false)
  async deleteUser(userId: string): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user')
      }

      return data
    } catch (error) {
      console.error('Error deleting user:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user'
      }
    }
  }

  // Sync user data with Jira
  async syncWithJira(userId: string): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/sync-jira`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync with Jira')
      }

      return data
    } catch (error) {
      console.error('Error syncing with Jira:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync with Jira'
      }
    }
  }

  // Get user performance metrics
  async getUserPerformance(userId: string): Promise<PerformanceMetrics | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/performance`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch performance metrics')
      }

      return data.performanceMetrics
    } catch (error) {
      console.error('Error fetching performance metrics:', error)
      return null
    }
  }

  // Get user worklog statistics
  async getUserWorklogStats(userId: string): Promise<WorklogStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/worklog-stats`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch worklog stats')
      }

      return data.worklogStats
    } catch (error) {
      console.error('Error fetching worklog stats:', error)
      return null
    }
  }

  // Update user permissions
  async updateUserPermissions(userId: string, permissions: Partial<UserPermission>[]): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update permissions')
      }

      return data
    } catch (error) {
      console.error('Error updating permissions:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update permissions'
      }
    }
  }

  // Update user working hours
  async updateWorkingHours(userId: string, workingHours: WorkingHours): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/working-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workingHours }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update working hours')
      }

      return data
    } catch (error) {
      console.error('Error updating working hours:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update working hours'
      }
    }
  }

  // Bulk operations
  async bulkUpdateUsers(userIds: string[], updates: Partial<UpdateUserRequest>): Promise<UserResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, updates }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to bulk update users')
      }

      return data.results
    } catch (error) {
      console.error('Error bulk updating users:', error)
      return userIds.map(() => ({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user'
      }))
    }
  }

  // Search users
  async searchUsers(query: string, filters?: {
    department?: string
    isActive?: boolean
    role?: string
  }): Promise<UsersResponse> {
    try {
      const searchParams = new URLSearchParams({ query })
      if (filters?.department) searchParams.append('department', filters.department)
      if (filters?.isActive !== undefined) searchParams.append('isActive', filters.isActive.toString())
      if (filters?.role) searchParams.append('role', filters.role)

      const response = await fetch(`${this.baseUrl}/search?${searchParams.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search users')
      }

      return data
    } catch (error) {
      console.error('Error searching users:', error)
      return {
        success: false,
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        message: error instanceof Error ? error.message : 'Failed to search users'
      }
    }
  }
}

export const userService = new UserService() 