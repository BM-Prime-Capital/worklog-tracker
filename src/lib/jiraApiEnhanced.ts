import axios, { AxiosInstance, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'

export interface JiraCredentials {
  domain: string
  email: string
  apiToken: string
}

export interface JiraWorklog {
  id: string
  issueId: string
  issueKey: string
  summary: string
  author: {
    accountId?: string
    displayName: string
    emailAddress: string
  }
  timeSpentSeconds: number
  timeSpent: string
  started: string
  comment?: string
  attachments?: JiraAttachment[]
}

export interface JiraAttachment {
  id: string
  filename: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
}

export interface JiraIssue {
  id: string
  key: string
  summary: string
  status: {
    name: string
    statusCategory: {
      name: string
    }
  }
  assignee?: {
    displayName: string
    emailAddress: string
  }
  worklog: {
    worklogs: JiraWorklog[]
    total: number
  }
}

export interface JiraUser {
  accountId: string
  displayName: string
  emailAddress: string
  active: boolean
  timeZone: string
  accountType?: string
}

export interface DeveloperData {
  id: string
  name: string
  email: string
  avatar: string
  team: string
  hours: number
  tasks: number
  completed: number
  productivity: number
  trend: 'up' | 'down' | 'stable'
  lastActive: string
  status: 'online' | 'offline'
  worklogs: JiraWorklog[]
}

export interface DashboardData {
  developers: DeveloperData[]
  teamHours: Record<string, number>
  totalHours: number
  issueDetails: Record<string, { summary: string; status: string }>
}

class JiraApiService {
  private api: AxiosInstance
  private credentials: JiraCredentials | null = null

  constructor() {
    this.api = axios.create({
      timeout: 10000,
    })

    // Add request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        if (this.credentials) {
          const auth = Buffer.from(
            `${this.credentials.email}:${this.credentials.apiToken}`
          ).toString('base64')
          config.headers.Authorization = `Basic ${auth}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearCredentials()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Authentication methods
  setCredentials(credentials: JiraCredentials): void {
    this.credentials = credentials
    Cookies.set('jira_credentials', JSON.stringify(credentials), { expires: 7 })
  }

  async getCredentials(): Promise<JiraCredentials | null> {
    if (!this.credentials) {
      // Try to load from database first
      const loaded = await this.loadCredentialsFromDatabase()
      if (!loaded) {
        // Fallback to cookies (for backward compatibility)
        const saved = Cookies.get('jira_credentials')
        if (saved) {
          this.credentials = JSON.parse(saved)
        }
      }
    }
    return this.credentials
  }

  getCredentialsSync(): JiraCredentials | null {
    return this.credentials
  }

  clearCredentials(): void {
    this.credentials = null
    Cookies.remove('jira_credentials')
  }

  async isAuthenticated(): Promise<boolean> {
    const credentials = await this.getCredentials()
    return !!credentials
  }

  isAuthenticatedSync(): boolean {
    return !!this.getCredentialsSync()
  }

  // Jira API methods
  async testConnection(): Promise<boolean> {
    try {
      const credentials = await this.getCredentials()
      if (!credentials) return false

      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-connection',
          credentials
        })
      })

      if (!response.ok) return false
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Jira connection test failed:', error)
      return false
    }
  }

  async getCurrentUser(): Promise<JiraUser> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    const response = await fetch('/api/jira', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test-connection',
        credentials
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get current user')
    }

    const data = await response.json()
    return data.user
  }

  async getWorklogs(
    startDate: string,
    endDate: string,
    projectKeys?: string[]
  ): Promise<JiraWorklog[]> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-worklogs',
          credentials,
          params: { startDate, endDate, projectKeys }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch worklogs')
      }

      const data = await response.json()
      return data.worklogs
    } catch (error) {
      console.error('Error fetching worklogs:', error)
      throw error
    }
  }

  async getUsers(): Promise<JiraUser[]> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-users',
          credentials
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      return data.users
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getProjects(): Promise<unknown[]> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-projects',
          credentials
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      return data.projects
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  async getIssues(projectKeys?: string[], maxResults: number = 50): Promise<unknown[]> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-issues',
          credentials,
          params: { projectKeys, maxResults }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch issues')
      }

      const data = await response.json()
      console.log('Jira API getIssues response:', data)
      return data.issues || []
    } catch (error) {
      console.error('Error fetching issues:', error)
      throw error
    }
  }

  async getRecentIssues(maxResults: number = 50): Promise<unknown[]> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-recent-issues',
          credentials,
          params: { maxResults }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recent issues')
      }

      const data = await response.json()
      console.log('Jira API getRecentIssues response:', data)
      return data.issues || []
    } catch (error) {
      console.error('Error fetching recent issues:', error)
      throw error
    }
  }

  async getProjectIssueCount(projectKey: string): Promise<number> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-project-issue-count',
          credentials,
          params: { projectKey }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project issue count')
      }

      const data = await response.json()
      console.log(`Jira API getProjectIssueCount response for ${projectKey}:`, data)
      return data.total || 0
    } catch (error) {
      console.error(`Error fetching issue count for project ${projectKey}:`, error)
      return 0
    }
  }

  async getProjectDoneIssuesCount(projectKey: string): Promise<number> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-project-done-issues-count',
          credentials,
          params: { projectKey }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project done issues count')
      }

      const data = await response.json()
      console.log(`Jira API getProjectDoneIssuesCount response for ${projectKey}:`, data)
      return data.total || 0
    } catch (error) {
      console.error(`Error fetching done issues count for project ${projectKey}:`, error)
      return 0
    }
  }

  async getProjectStats(projectKey: string): Promise<{
    totalIssues: number
    doneIssues: number
    progressPercentage: number
  }> {
    const credentials = await this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-project-stats',
          credentials,
          params: { projectKey }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project stats')
      }

      const data = await response.json()
      console.log(`Jira API getProjectStats response for ${projectKey}:`, data)
      return {
        totalIssues: data.totalIssues || 0,
        doneIssues: data.doneIssues || 0,
        progressPercentage: data.progressPercentage || 0
      }
    } catch (error) {
      console.error(`Error fetching project stats for ${projectKey}:`, error)
      return {
        totalIssues: 0,
        doneIssues: 0,
        progressPercentage: 0
      }
    }
  }

  // Enhanced data transformation methods
  transformWorklogsToDashboardData(worklogs: JiraWorklog[]): DashboardData {
    const developers = new Map<string, {
      id: string
      name: string
      email: string
      avatar: string
      team: string
      hours: number
      tasks: Set<string>
      completed: number
      productivity: number
      trend: 'up' | 'down' | 'stable'
      lastActive: string
      status: 'online' | 'offline'
      worklogs: JiraWorklog[]
    }>()
    
    const teamHours = new Map<string, number>()
    const issueDetails = new Map<string, { summary: string; status: string }>()
    
    // Process each worklog entry
    worklogs.forEach(worklog => {
      const author = worklog.author.displayName
      const authorEmail = worklog.author.emailAddress
      const hours = worklog.timeSpentSeconds / 3600

      console.log("Worklog ===>", worklog)
      
      // Store issue details for reference
      if (!issueDetails.has(worklog.issueKey)) {
        issueDetails.set(worklog.issueKey, {
          summary: worklog.summary,
          status: 'In Progress' // Default status, could be enhanced with actual issue status
        })
      }
      
      // Aggregate by developer
      if (!developers.has(author)) {
        developers.set(author, {
          id: worklog.author.accountId || `dev-${Date.now()}-${Math.random()}`,
          name: author,
          email: authorEmail,
          avatar: this.getInitials(author),
          team: this.detectTeam(author),
          hours: 0,
          tasks: new Set(),
          completed: 0,
          productivity: 0,
          trend: 'stable',
          lastActive: worklog.started,
          status: 'online',
          worklogs: []
        })
      }
      
      const dev = developers.get(author)!
      dev.hours += hours
      dev.tasks.add(worklog.issueKey)
      dev.worklogs.push(worklog)
      
      // Update last active time
      const worklogDate = new Date(worklog.started)
      const lastActiveDate = new Date(dev.lastActive)
      if (worklogDate > lastActiveDate) {
        dev.lastActive = worklog.started
      }
      
      // Aggregate by team
      const team = dev.team
      teamHours.set(team, (teamHours.get(team) || 0) + hours)
    })
    
    // Calculate additional metrics and convert to array
    const developersArray: DeveloperData[] = Array.from(developers.values()).map(dev => {
      // Calculate productivity based on hours worked vs expected (40 hours/week)
      const expectedHours = 40 // Could be configurable per developer
      const productivity = Math.min(100, Math.max(0, (dev.hours / expectedHours) * 100))
      
      // Determine trend based on recent activity
      const recentWorklogs = dev.worklogs
        .filter(w => {
          const worklogDate = new Date(w.started)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return worklogDate > weekAgo
        })
        .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
      
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (recentWorklogs.length >= 2) {
        const recentHours = recentWorklogs.slice(0, 3).reduce((sum, w) => sum + (w.timeSpentSeconds / 3600), 0)
        const olderHours = recentWorklogs.slice(3, 6).reduce((sum, w) => sum + (w.timeSpentSeconds / 3600), 0)
        
        if (recentHours > olderHours * 1.1) trend = 'up'
        else if (recentHours < olderHours * 0.9) trend = 'down'
      }
      
      // Determine status based on last activity
      const lastActiveDate = new Date(dev.lastActive)
      const now = new Date()
      const hoursSinceLastActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60)
      const status: 'online' | 'offline' = hoursSinceLastActive < 4 ? 'online' : 'offline'
      
      return {
        id: dev.id,
        name: dev.name,
        email: dev.email,
        avatar: dev.avatar,
        team: dev.team,
        hours: Math.round(dev.hours * 100) / 100, // Round to 2 decimal places
        tasks: dev.tasks.size,
        completed: dev.tasks.size, // Assuming all logged work is completed
        productivity: Math.round(productivity * 100) / 100,
        trend,
        lastActive: this.formatLastActive(dev.lastActive),
        status,
        worklogs: dev.worklogs
      }
    })
    
    // Sort developers by hours worked (descending)
    developersArray.sort((a, b) => b.hours - a.hours)
    
    return {
      developers: developersArray,
      teamHours: Object.fromEntries(teamHours),
      totalHours: Array.from(teamHours.values()).reduce((sum, hours) => sum + hours, 0),
      issueDetails: Object.fromEntries(issueDetails)
    }
  }

  private formatLastActive(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  private detectTeam(name: string): string {
    // This is a simple heuristic - you might want to maintain a proper team mapping
    const teams = ['Frontend', 'Backend', 'Mobile', 'QA']
    const randomTeam = teams[Math.floor(Math.random() * teams.length)]
    return randomTeam
  }

  async setCredentialsFromUser(user: { jiraOrganization?: { domain: string; email: string; apiToken: string } }) {
    try {
      if (user.jiraOrganization) {
        this.setCredentials({
          domain: user.jiraOrganization.domain,
          email: user.jiraOrganization.email,
          apiToken: user.jiraOrganization.apiToken
        })
      }
    } catch (error) {
      console.error('Error setting credentials from user:', error)
      throw error
    }
  }

  async loadCredentialsFromDatabase(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user && data.user.jiraOrganization) {
          this.setCredentials({
            domain: data.user.jiraOrganization.domain,
            email: data.user.jiraOrganization.email,
            apiToken: data.user.jiraOrganization.apiToken
          })
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error loading credentials from database:', error)
      return false
    }
  }
}

export const jiraApiEnhanced = new JiraApiService() 