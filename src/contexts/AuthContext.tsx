'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { jiraApiEnhanced as jiraApi, JiraCredentials, JiraUser } from '@/lib/jiraApiEnhanced'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: JiraUser | null
  login: (credentials: JiraCredentials) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<JiraUser | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const authenticated = jiraApi.isAuthenticated()
      setIsAuthenticated(authenticated)
      
      if (authenticated) {
        await refreshUser()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: JiraCredentials): Promise<boolean> => {
    try {
      setIsLoading(true)
      jiraApi.setCredentials(credentials)
      
      const isConnected = await jiraApi.testConnection()
      if (isConnected) {
        setIsAuthenticated(true)
        await refreshUser()
        return true
      } else {
        jiraApi.clearCredentials()
        return false
      }
    } catch (error) {
      console.error('Login failed:', error)
      jiraApi.clearCredentials()
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    jiraApi.clearCredentials()
    setIsAuthenticated(false)
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      if (jiraApi.isAuthenticated()) {
        const currentUser = await jiraApi.getCurrentUser()
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      logout()
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 