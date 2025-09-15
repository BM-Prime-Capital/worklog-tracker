import { useState, useEffect, useCallback } from 'react'
import { adminService, AdminSettings } from '@/lib/adminService'

interface UseAdminSettingsReturn {
  settings: AdminSettings | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateSetting: (section: string, settings: any) => Promise<boolean>
  isUpdating: boolean
  updateError: string | null
}

export function useAdminSettings(): UseAdminSettingsReturn {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await adminService.getSettings()
      
      if (response.success && response.data) {
        setSettings(response.data)
      } else {
        setError(response.message || 'Failed to fetch admin settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSetting = useCallback(async (section: string, newSettings: any): Promise<boolean> => {
    try {
      setIsUpdating(true)
      setUpdateError(null)
      
      // Validate settings before sending
      const validation = adminService.validateSettings(section, newSettings)
      if (!validation.isValid) {
        setUpdateError(validation.errors.join(', '))
        return false
      }
      
      const response = await adminService.updateSettings(section, newSettings)
      
      if (response.success) {
        // Update local settings state
        setSettings(prev => {
          if (!prev) return prev
          
          return {
            ...prev,
            [section === 'platform' ? 'platformConfig' : 
             section === 'security' ? 'securitySettings' :
             section === 'notifications' ? 'notificationSettings' :
             section === 'integrations' ? 'integrationSettings' : 'platformConfig']: newSettings
          }
        })
        return true
      } else {
        setUpdateError(response.message || 'Failed to update settings')
        return false
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'An unexpected error occurred')
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    await fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSetting,
    isUpdating,
    updateError
  }
}
