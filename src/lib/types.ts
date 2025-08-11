export interface Developer {
  id: string
  name: string
  email?: string
  hours: number
  tasks: number
  worklogs?: {
    author: { displayName: string; emailAddress: string; accountId?: string }
    timeSpentSeconds: number
    issueKey: string
    summary: string
    started: string
  }[]
}

export interface TeamData {
  name: string
  value: number
  color: string
}

export interface ProductivityData {
  name: string
  value: number
  color: string
}

export interface WeeklyData {
  day: string
  Frontend: number
  Backend: number
  Mobile: number
  Total: number
}

export interface StatsCardData {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  description: string
}

export interface User {
  // Core Identity
  id: string
  accountId: string // Jira account ID
  email: string
  username: string // @bmprimecapital.com username part
  
  // Personal Information
  firstName: string
  lastName: string
  displayName: string
  avatar?: string
  phoneNumber?: string
  
  // Professional Details
  department: 'software-engineering' | 'venture-capital' | 'graphic-design' | 'communication'
  employmentType: 'intern' | 'permanent'
  role: string
  title: string
  employeeId?: string
  hireDate?: string
  managerId?: string
  
  // System Access & Permissions
  isActive: boolean
  isAdmin: boolean
  permissions: UserPermission[]
  accessLevel: 'basic' | 'manager' | 'admin' | 'super-admin'
  
  // Integration Status
  jiraEnabled: boolean
  jiraLastSync?: string
  otherTools: IntegrationStatus[]
  
  // Work & Activity
  timezone: string
  workingHours: WorkingHours
  currentProjects: string[] // Project IDs
  skills: Skill[]
  certifications: Certification[]
  
  // Performance & Metrics
  performanceMetrics: PerformanceMetrics
  worklogStats: WorklogStats
  
  // System Metadata
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  lastActivityAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface UserPermission {
  id: string
  name: string
  description: string
  resource: 'projects' | 'users' | 'reports' | 'settings' | 'integrations'
  actions: ('read' | 'write' | 'delete' | 'admin')[]
  grantedAt: string
  grantedBy: string
}

export interface IntegrationStatus {
  tool: 'jira' | 'slack' | 'github' | 'figma' | 'notion' | 'asana'
  isEnabled: boolean
  lastSync?: string
  syncStatus: 'success' | 'failed' | 'pending' | 'disabled'
  errorMessage?: string
  config?: Record<string, string | number | boolean>
}

export interface WorkingHours {
  startTime: string // "09:00"
  endTime: string // "17:00"
  timezone: string
  workDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]
  breakDuration: number // minutes
}

export interface Skill {
  id: string
  name: string
  category: 'technical' | 'soft' | 'domain' | 'tool'
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  verified: boolean
  verifiedAt?: string
  verifiedBy?: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  issuedAt: string
  expiresAt?: string
  credentialId?: string
  verificationUrl?: string
}

export interface PerformanceMetrics {
  overallScore: number // 0-100
  productivityScore: number
  qualityScore: number
  collaborationScore: number
  innovationScore: number
  lastEvaluationAt?: string
  evaluationPeriod: 'monthly' | 'quarterly' | 'yearly'
}

export interface WorklogStats {
  totalHoursLogged: number
  averageDailyHours: number
  mostActiveDay: string
  mostActiveProject: string
  lastWorklogAt?: string
  weeklyAverage: number
  monthlyAverage: number
}

// API Request/Response Types
export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  department: User['department']
  employmentType: User['employmentType']
  role?: string
  title?: string
  managerId?: string
  permissions?: Partial<UserPermission>[]
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  department?: User['department']
  employmentType?: User['employmentType']
  role?: string
  title?: string
  managerId?: string
  isActive?: boolean
  permissions?: Partial<UserPermission>[]
}

export interface UserResponse {
  success: boolean
  user?: User
  message?: string
  errors?: string[]
}

export interface UsersResponse {
  success: boolean
  users: User[]
  total: number
  page: number
  limit: number
  message?: string
} 