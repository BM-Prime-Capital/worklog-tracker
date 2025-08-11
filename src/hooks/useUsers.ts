import { useState, useEffect, useCallback } from 'react'
import { userService } from '@/lib/userService'
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserResponse, 
  UsersResponse 
} from '@/lib/types'

interface UseUsersOptions {
  autoFetch?: boolean
  initialPage?: number
  initialLimit?: number
  initialFilters?: {
    department?: string
    isActive?: boolean
    search?: string
  }
}

interface UseUsersReturn {
  // State
  users: User[]
  currentUser: User | null
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  
  // Pagination
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  
  // Filters
  filters: {
    department: string
    isActive: boolean | null
    search: string
  }
  
  // Actions
  createUser: (userData: CreateUserRequest) => Promise<UserResponse>
  updateUser: (userId: string, userData: UpdateUserRequest) => Promise<UserResponse>
  deleteUser: (userId: string) => Promise<UserResponse>
  fetchUsers: (page?: number, limit?: number) => Promise<void>
  searchUsers: (query: string) => Promise<void>
  setFilters: (filters: Partial<UseUsersReturn['filters']>) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  
  // Utilities
  getUserById: (userId: string) => User | undefined
  refreshUsers: () => Promise<void>
  clearError: () => void
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const {
    autoFetch = true,
    initialPage = 1,
    initialLimit = 10,
    initialFilters = {}
  } = options

  // State
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  })

  // Filters
  const [filters, setFiltersState] = useState({
    department: initialFilters.department || '',
    isActive: initialFilters.isActive ?? null,
    search: initialFilters.search || ''
  })

  // Fetch users
  const fetchUsers = useCallback(async (page?: number, limit?: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const currentPage = page ?? pagination.page
      const currentLimit = limit ?? pagination.limit

      const response = await userService.getUsers({
        page: currentPage,
        limit: currentLimit,
        department: filters.department || undefined,
        isActive: filters.isActive ?? undefined,
        search: filters.search || undefined
      })

      if (response.success) {
        setUsers(response.users)
        setPagination(prev => ({
          ...prev,
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: Math.ceil(response.total / response.limit)
        }))
      } else {
        setError(response.message || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, filters])

  // Create user
  const createUser = useCallback(async (userData: CreateUserRequest): Promise<UserResponse> => {
    try {
      setIsCreating(true)
      setError(null)

      const response = await userService.createUser(userData)

      if (response.success && response.user) {
        setUsers(prev => [response.user!, ...prev])
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1,
          totalPages: Math.ceil((prev.total + 1) / prev.limit)
        }))
      } else {
        setError(response.message || 'Failed to create user')
      }

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setIsCreating(false)
    }
  }, [])

  // Update user
  const updateUser = useCallback(async (userId: string, userData: UpdateUserRequest): Promise<UserResponse> => {
    try {
      setIsUpdating(true)
      setError(null)

      const response = await userService.updateUser(userId, userData)

      if (response.success && response.user) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? response.user! : user
        ))
        
        // Update current user if it's the one being updated
        if (currentUser?.id === userId) {
          setCurrentUser(response.user)
        }
      } else {
        setError(response.message || 'Failed to update user')
      }

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setIsUpdating(false)
    }
  }, [currentUser])

  // Delete user
  const deleteUser = useCallback(async (userId: string): Promise<UserResponse> => {
    try {
      setIsDeleting(true)
      setError(null)

      const response = await userService.deleteUser(userId)

      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== userId))
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1,
          totalPages: Math.ceil((prev.total - 1) / prev.limit)
        }))
      } else {
        setError(response.message || 'Failed to delete user')
      }

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await userService.searchUsers(query, {
        department: filters.department || undefined,
        isActive: filters.isActive ?? undefined
      })

      if (response.success) {
        setUsers(response.users)
        setPagination(prev => ({
          ...prev,
          page: 1, // Reset to first page on search
          total: response.total,
          totalPages: Math.ceil(response.total / response.limit)
        }))
      } else {
        setError(response.message || 'Failed to search users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Set filters
  const setFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filters change
  }, [])

  // Set page
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  // Set limit
  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 })) // Reset to first page when limit changes
  }, [])

  // Get user by ID
  const getUserById = useCallback((userId: string): User | undefined => {
    return users.find(user => user.id === userId)
  }, [users])

  // Refresh users
  const refreshUsers = useCallback(async () => {
    await fetchUsers()
  }, [fetchUsers])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchUsers()
    }
  }, [autoFetch, filters.department, filters.isActive, filters.search])

  // Fetch users when pagination changes
  useEffect(() => {
    if (autoFetch) {
      fetchUsers()
    }
  }, [pagination.page, pagination.limit])

  return {
    // State
    users,
    currentUser,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    
    // Pagination
    pagination,
    
    // Filters
    filters,
    
    // Actions
    createUser,
    updateUser,
    deleteUser,
    fetchUsers,
    searchUsers,
    setFilters,
    setPage,
    setLimit,
    
    // Utilities
    getUserById,
    refreshUsers,
    clearError
  }
} 