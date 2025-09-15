/**
 * Admin Service - Handles admin-specific data operations
 */

export interface AdminStats {
  totalUsers: number
  totalManagers: number
  totalDevelopers: number
  activeUsers: number
  recentSignups: number
  totalOrganizations: number
  systemHealth: 'healthy' | 'warning' | 'error'
  recentActivity: RecentActivity[]
}

export interface RecentActivity {
  type: 'user_signup' | 'organization_created' | 'system_event'
  title: string
  description: string
  timestamp: string
  icon: 'user' | 'building' | 'activity'
}

export interface AdminUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER'
  department?: string
  employmentType?: string
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: string
  createdAt: string
  organizationId?: {
    _id: string
    name: string
    slug: string
  }
  invitedBy?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  stats?: {
    lastLoginDays: number
    totalWorklogs: number
    projectsCount: number
    isOnline: boolean
  }
}

export interface UsersResponse {
  success: boolean
  data?: {
    users: AdminUser[]
    pagination: {
      currentPage: number
      totalPages: number
      totalCount: number
      hasNextPage: boolean
      hasPrevPage: boolean
      limit: number
    }
  }
  message?: string
  error?: string
}

export interface UserDetailsResponse {
  success: boolean
  data?: AdminUser
  message?: string
  error?: string
}

export interface AdminSettings {
  systemStats: {
    totalUsers: number
    totalOrganizations: number
    activeUsers: number
    recentSignups: number
    systemHealth: 'healthy' | 'warning' | 'error'
  }
  platformConfig: {
    maintenanceMode: boolean
    registrationEnabled: boolean
    emailNotifications: boolean
    maxUsersPerOrganization: number
    sessionTimeout: number
    passwordMinLength: number
    requireEmailVerification: boolean
  }
  securitySettings: {
    twoFactorEnabled: boolean
    passwordExpiryDays: number
    maxLoginAttempts: number
    lockoutDuration: number
    sessionSecurity: string
  }
  notificationSettings: {
    emailNotifications: boolean
    systemAlerts: boolean
    userActivityLogs: boolean
    errorReporting: boolean
    maintenanceNotifications: boolean
  }
  integrationSettings: {
    jiraIntegration: boolean
    slackIntegration: boolean
    emailService: string
    analyticsEnabled: boolean
    backupEnabled: boolean
  }
}

export interface SettingsResponse {
  success: boolean
  data?: AdminSettings
  message?: string
  error?: string
}

export interface UpdateSettingsResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export interface ProfileUpdateResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export interface PasswordUpdateResponse {
  success: boolean
  message?: string
  error?: string
}

export interface AdminStatsResponse {
  success: boolean
  data?: AdminStats
  message?: string
  error?: string
}

class AdminService {
  private baseUrl = '/api/admin'

  /**
   * Fetch admin dashboard statistics
   */
  async getStats(): Promise<AdminStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch admin statistics')
      }

      return data
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch admin statistics'
      }
    }
  }

  /**
   * Get system health status
   */
  getSystemHealthStatus(health: 'healthy' | 'warning' | 'error') {
    switch (health) {
      case 'healthy':
        return {
          color: 'text-green-600 bg-green-100',
          icon: 'check-circle',
          label: 'System Healthy'
        }
      case 'warning':
        return {
          color: 'text-yellow-600 bg-yellow-100',
          icon: 'alert-triangle',
          label: 'System Warning'
        }
      case 'error':
        return {
          color: 'text-red-600 bg-red-100',
          icon: 'alert-circle',
          label: 'System Error'
        }
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: 'activity',
          label: 'Unknown Status'
        }
    }
  }

  /**
   * Format activity timestamp for display
   */
  formatActivityTime(timestamp: string): string {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMs = now.getTime() - activityTime.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return `${diffInDays}d ago`
    }
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: string): string {
    switch (type) {
      case 'user_signup':
        return 'user'
      case 'organization_created':
        return 'building'
      case 'system_event':
        return 'activity'
      default:
        return 'activity'
    }
  }

  /**
   * Fetch users with pagination and filtering
   */
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    status?: string
    search?: string
  }): Promise<UsersResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.role) queryParams.append('role', params.role)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.search) queryParams.append('search', params.search)

      const response = await fetch(`${this.baseUrl}/users?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users')
      }

      return data
    } catch (error) {
      console.error('Error fetching users:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch users'
      }
    }
  }

  /**
   * Fetch individual user details
   */
  async getUserDetails(userId: string): Promise<UserDetailsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user details')
      }

      return data
    } catch (error) {
      console.error('Error fetching user details:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user details'
      }
    }
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, updateData: Partial<AdminUser>): Promise<UserDetailsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
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

  /**
   * Delete/deactivate user
   */
  async deleteUser(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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

  /**
   * Get department display name
   */
  getDepartmentName(department: string): string {
    const departments: Record<string, string> = {
      'software-engineering': 'Software Engineering',
      'venture-capital': 'Venture Capital',
      'graphic-design': 'Graphic Design',
      'communication': 'Communication'
    }
    return departments[department] || department
  }

  /**
   * Get role display info
   */
  getRoleInfo(role: string): { icon: string; color: string; label: string } {
    switch (role) {
      case 'ADMIN':
        return { icon: 'shield', color: 'bg-red-100 text-red-800', label: 'Admin' }
      case 'MANAGER':
        return { icon: 'user-cog', color: 'bg-purple-100 text-purple-800', label: 'Manager' }
      case 'DEVELOPER':
        return { icon: 'code', color: 'bg-blue-100 text-blue-800', label: 'Developer' }
      default:
        return { icon: 'user', color: 'bg-gray-100 text-gray-800', label: 'Unknown' }
    }
  }

  /**
   * Format last login time
   */
  formatLastLogin(lastLogin?: string): string {
    if (!lastLogin) return 'Never'
    
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  /**
   * Format creation date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  /**
   * Fetch admin settings
   */
  async getSettings(): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch admin settings')
      }

      return data
    } catch (error) {
      console.error('Error fetching admin settings:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch admin settings'
      }
    }
  }

  /**
   * Update admin settings
   */
  async updateSettings(section: string, settings: any): Promise<UpdateSettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section, settings }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update settings')
      }

      return data
    } catch (error) {
      console.error('Error updating admin settings:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update settings'
      }
    }
  }

  /**
   * Get system health status info
   */
  getSystemHealthInfo(health: 'healthy' | 'warning' | 'error') {
    switch (health) {
      case 'healthy':
        return {
          color: 'text-green-600 bg-green-100',
          icon: 'check-circle',
          label: 'System Healthy',
          description: 'All systems are operating normally'
        }
      case 'warning':
        return {
          color: 'text-yellow-600 bg-yellow-100',
          icon: 'alert-triangle',
          label: 'System Warning',
          description: 'Some issues detected, monitoring required'
        }
      case 'error':
        return {
          color: 'text-red-600 bg-red-100',
          icon: 'alert-circle',
          label: 'System Error',
          description: 'Critical issues detected, immediate attention required'
        }
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: 'activity',
          label: 'Unknown Status',
          description: 'System status unknown'
        }
    }
  }

  /**
   * Validate settings before update
   */
  validateSettings(section: string, settings: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    switch (section) {
      case 'platform':
        if (settings.maxUsersPerOrganization && (settings.maxUsersPerOrganization < 1 || settings.maxUsersPerOrganization > 1000)) {
          errors.push('Max users per organization must be between 1 and 1000')
        }
        if (settings.sessionTimeout && (settings.sessionTimeout < 1 || settings.sessionTimeout > 168)) {
          errors.push('Session timeout must be between 1 and 168 hours')
        }
        if (settings.passwordMinLength && (settings.passwordMinLength < 6 || settings.passwordMinLength > 32)) {
          errors.push('Password minimum length must be between 6 and 32 characters')
        }
        break

      case 'security':
        if (settings.passwordExpiryDays && (settings.passwordExpiryDays < 30 || settings.passwordExpiryDays > 365)) {
          errors.push('Password expiry days must be between 30 and 365')
        }
        if (settings.maxLoginAttempts && (settings.maxLoginAttempts < 3 || settings.maxLoginAttempts > 10)) {
          errors.push('Max login attempts must be between 3 and 10')
        }
        if (settings.lockoutDuration && (settings.lockoutDuration < 5 || settings.lockoutDuration > 60)) {
          errors.push('Lockout duration must be between 5 and 60 minutes')
        }
        break

      default:
        // No specific validation for other sections
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: any): Promise<ProfileUpdateResponse> {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }

      return data
    } catch (error) {
      console.error('Error updating profile:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile'
      }
    }
  }

  /**
   * Update user password
   */
  async updatePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<PasswordUpdateResponse> {
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password')
      }

      return data
    } catch (error) {
      console.error('Error updating password:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update password'
      }
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    requirements: {
      length: boolean
      uppercase: boolean
      lowercase: boolean
      number: boolean
      special: boolean
    }
  } {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const score = Object.values(requirements).filter(Boolean).length
    const isValid = score >= 4 && password.length >= 8

    return {
      isValid,
      score,
      requirements
    }
  }

  /**
   * Get employment type display name
   */
  getEmploymentTypeName(employmentType: string): string {
    const types: Record<string, string> = {
      'permanent': 'Permanent',
      'intern': 'Intern',
      'contractor': 'Contractor',
      'consultant': 'Consultant'
    }
    return types[employmentType] || employmentType
  }
}

export const adminService = new AdminService()
