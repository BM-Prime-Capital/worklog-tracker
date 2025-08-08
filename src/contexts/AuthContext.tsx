'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { jiraApiEnhanced as jiraApi } from '@/lib/jiraApiEnhanced'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isEmailVerified: boolean
  jiraOrganization?: {
    organizationName: string
    domain: string
    email: string
    apiToken: string
  }
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
        
        // Load Jira credentials from user profile
        if (data.user && data.user.jiraOrganization) {
          await jiraApi.setCredentialsFromUser(data.user)
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setIsAuthenticated(true)
        
        // Load Jira credentials from user profile
        if (data.user && data.user.jiraOrganization) {
          await jiraApi.setCredentialsFromUser(data.user)
        }
        
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'An error occurred during login' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      jiraApi.clearCredentials()
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
        
        // Load Jira credentials from user profile
        if (data.user && data.user.jiraOrganization) {
          await jiraApi.setCredentialsFromUser(data.user)
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setIsAuthenticated(false)
      setUser(null)
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