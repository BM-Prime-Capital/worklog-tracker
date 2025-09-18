import { useState, useEffect, useCallback } from 'react'
import { adminService, AdminUser } from '@/lib/adminService'

interface UseAdminUsersParams {
  page?: number
  limit?: number
  role?: string
  status?: string
  search?: string
}

interface UseAdminUsersReturn {
  users: AdminUser[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
  } | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateFilters: (newParams: Partial<UseAdminUsersParams>) => void
}

export function useAdminUsers(initialParams?: UseAdminUsersParams): UseAdminUsersReturn {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<UseAdminUsersReturn['pagination']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<UseAdminUsersParams>({
    page: 1,
    limit: 50,
    role: 'all',
    status: 'all',
    search: '',
    ...initialParams
  })

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await adminService.getUsers(params)
      
      if (response.success && response.data) {
        setUsers(response.data.users)
        setPagination(response.data.pagination)
      } else {
        setError(response.message || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [params])

  const refetch = useCallback(async () => {
    await fetchUsers()
  }, [fetchUsers])

  const updateFilters = useCallback((newParams: Partial<UseAdminUsersParams>) => {
    setParams(prev => ({
      ...prev,
      ...newParams,
      // Reset to page 1 when filters change
      page: newParams.page || 1
    }))
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    pagination,
    isLoading,
    error,
    refetch,
    updateFilters
  }
}

interface UseUserDetailsReturn {
  user: AdminUser | null
  isLoading: boolean
  error: string | null
  fetchUser: (userId: string) => Promise<void>
  updateUser: (userId: string, updateData: Partial<AdminUser>) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
}

export function useUserDetails(): UseUserDetailsReturn {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await adminService.getUserDetails(userId)
      
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        setError(response.message || 'Failed to fetch user details')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback(async (userId: string, updateData: Partial<AdminUser>): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await adminService.updateUser(userId, updateData)
      
      if (response.success && response.data) {
        setUser(response.data)
        return true
      } else {
        setError(response.message || 'Failed to update user')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await adminService.deleteUser(userId)
      
      if (response.success) {
        setUser(null)
        return true
      } else {
        setError(response.message || 'Failed to delete user')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    user,
    isLoading,
    error,
    fetchUser,
    updateUser,
    deleteUser
  }
}
