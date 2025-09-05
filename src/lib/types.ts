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

export type UserRole = "ADMIN" | "MANAGER" | "DEVELOPER"

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
  accountId?: string // Jira account ID for integration
  jiraId?: string // Jira user ID for better matching
  
  // Personal Information
  firstName: string
  lastName: string
  displayName: string
  email: string
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  dateOfBirth?: Date
  phoneNumber?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }
  
  // Professional Information
  role: string
  title: string
  department: 'software-engineering' | 'venture-capital' | 'graphic-design' | 'communication'
  employmentType: 'intern' | 'permanent' | 'contractor' | 'consultant'
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'resigned' | 'on-leave'
  hireDate: Date
  probationEndDate?: Date
  contractEndDate?: Date
  managerId?: string
  directReports?: string[]
  
  // Remote Work & Location
  workLocation: 'remote' | 'hybrid' | 'office'
  country: string
  city: string
  timezone: string
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  
  // System Access & Permissions
  permissions: UserPermission[]
  accessLevel: 'basic' | 'standard' | 'admin' | 'super-admin'
  isActive: boolean
  lastLogin?: Date
  
  // Integration Status
  jiraEnabled: boolean
  jiraUsername?: string
  slackEnabled?: boolean
  slackUsername?: string
  githubEnabled?: boolean
  githubUsername?: string
  
  // Working Hours & Schedule
  workingHours: WorkingHours
  preferredWorkingHours?: {
    startTime: string // HH:mm format
    endTime: string // HH:mm format
    timezone: string
  }
  
  // Performance & Skills
  performanceMetrics: PerformanceMetrics
  skills: Skill[]
  certifications: Certification[]
  languages: Array<{
    language: string
    proficiency: 'basic' | 'intermediate' | 'fluent' | 'native'
  }>
  
  // Compensation & Benefits
  salary?: {
    amount: number
    currency: string
    frequency: 'monthly' | 'yearly'
    effectiveDate: Date
  }
  benefits?: string[]
  
  // HR & Administrative
  employeeId: string
  taxId?: string
  socialSecurityNumber?: string
  passportNumber?: string
  visaStatus?: string
  visaExpiryDate?: Date
  
  // System Metadata
  createdBy: string
  createdAt: Date
  updatedBy: string
  updatedAt: Date
  version: number
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
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  role: string
  title: string
  department: 'software-engineering' | 'venture-capital' | 'graphic-design' | 'communication'
  employmentType: 'intern' | 'permanent' | 'contractor' | 'consultant'
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'resigned' | 'on-leave'
  hireDate: Date
  workLocation: 'remote' | 'hybrid' | 'office'
  country: string
  city: string
  timezone: string
  employeeId: string
  jiraId?: string
  accountId?: string
  phoneNumber?: string
  probationEndDate?: Date
  contractEndDate?: Date
  managerId?: string
  permissions?: UserPermission[]
  accessLevel?: 'basic' | 'standard' | 'admin' | 'super-admin'
  workingHours?: WorkingHours
  skills?: Skill[]
  languages?: Array<{
    language: string
    proficiency: 'basic' | 'intermediate' | 'fluent' | 'native'
  }>
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  role?: string
  title?: string
  department?: 'software-engineering' | 'venture-capital' | 'graphic-design' | 'communication'
  employmentType?: 'intern' | 'permanent' | 'contractor' | 'consultant'
  employmentStatus?: 'active' | 'inactive' | 'terminated' | 'resigned' | 'on-leave'
  hireDate?: Date
  workLocation?: 'remote' | 'hybrid' | 'office'
  country?: string
  city?: string
  timezone?: string
  employeeId?: string
  jiraId?: string
  accountId?: string
  phoneNumber?: string
  probationEndDate?: Date
  contractEndDate?: Date
  managerId?: string
  permissions?: UserPermission[]
  accessLevel?: 'basic' | 'standard' | 'admin' | 'super-admin'
  workingHours?: WorkingHours
  skills?: Skill[]
  languages?: Array<{
    language: string
    proficiency: 'basic' | 'intermediate' | 'fluent' | 'native'
  }>
  isActive?: boolean
  jiraEnabled?: boolean
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