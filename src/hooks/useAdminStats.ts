import { useState, useEffect, useCallback } from 'react'
import { adminService, AdminStats } from '@/lib/adminService'

interface UseAdminStatsReturn {
  stats: AdminStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  systemHealthStatus: {
    color: string
    icon: string
    label: string
  }
}

export function useAdminStats(): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await adminService.getStats()
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.message || 'Failed to fetch admin statistics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const systemHealthStatus = stats 
    ? adminService.getSystemHealthStatus(stats.systemHealth)
    : { color: 'text-gray-600 bg-gray-100', icon: 'activity', label: 'Unknown Status' }

  return {
    stats,
    isLoading,
    error,
    refetch,
    systemHealthStatus
  }
}
