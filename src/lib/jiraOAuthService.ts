import axios, { AxiosInstance } from 'axios'
import { IUser } from '@/models/User'

export interface JiraOAuthCredentials {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
}

export interface JiraUser {
  accountId: string
  email: string
  displayName: string
  avatarUrl: string
  active: boolean
}

export interface JiraWorklog {
  id: string
  issueId: string
  author: {
    accountId: string
    displayName: string
    email: string
  }
  comment?: string
  timeSpent: string
  timeSpentSeconds: number
  started: string
  created: string
  updated: string
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
    accountId: string
    displayName: string
    email: string
  }
  project: {
    key: string
    name: string
  }
}

class JiraOAuthService {
  private api: AxiosInstance
  private credentials: JiraOAuthCredentials | null = null

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.atlassian.com',
      timeout: 10000,
    })

    // Add request interceptor for OAuth authentication
    this.api.interceptors.request.use(
      (config) => {
        if (this.credentials?.accessToken) {
          config.headers.Authorization = `Bearer ${this.credentials.accessToken}`
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
      async (error) => {
        if (error.response?.status === 401 && this.credentials?.refreshToken) {
          // Try to refresh the token
          try {
            await this.refreshAccessToken()
            // Retry the original request
            const originalRequest = error.config
            originalRequest.headers.Authorization = `Bearer ${this.credentials?.accessToken}`
            return this.api(originalRequest)
          } catch (refreshError) {
            console.error('Failed to refresh access token:', refreshError)
            // Clear credentials and redirect to login
            this.clearCredentials()
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Set OAuth credentials
  setCredentials(credentials: JiraOAuthCredentials): void {
    this.credentials = credentials
  }

  // Set credentials from user model
  setCredentialsFromUser(user: IUser): void {
    if (user.atlassianAccessToken) {
      this.setCredentials({
        accessToken: user.atlassianAccessToken,
        refreshToken: user.atlassianRefreshToken,
        expiresAt: user.atlassianTokenExpires
      })
    }
  }

  // Clear credentials
  clearCredentials(): void {
    this.credentials = null
  }

  // Check if token is valid
  isTokenValid(): boolean {
    if (!this.credentials?.accessToken) return false
    if (!this.credentials?.expiresAt) return true // No expiration set
    
    const now = new Date()
    const expiresAt = new Date(this.credentials.expiresAt)
    return now < new Date(expiresAt.getTime() - 60000) // 1 minute buffer
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post('https://auth.atlassian.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: process.env.ATLASSIAN_CLIENT_ID,
        client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
        refresh_token: this.credentials.refreshToken
      })

      this.credentials = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || this.credentials.refreshToken,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
      }
    } catch (error) {
      console.error('Error refreshing access token:', error)
      throw error
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<JiraUser> {
    const response = await this.api.get('/ex/jira/rest/api/3/myself')
    return response.data
  }

  // Get user's worklogs
  async getUserWorklogs(accountId: string, from?: Date, to?: Date): Promise<JiraWorklog[]> {
    const params: any = {
      expand: 'changelog'
    }

    if (from) {
      params.startedAfter = Math.floor(from.getTime() / 1000) * 1000
    }
    if (to) {
      params.startedBefore = Math.floor(to.getTime() / 1000) * 1000
    }

    const response = await this.api.get(`/ex/jira/rest/api/3/worklog/updated`, {
      params
    })

    // Filter worklogs by the specific user
    const allWorklogs = response.data.values || []
    const userWorklogs = allWorklogs.filter((worklog: JiraWorklog) => 
      worklog.author.accountId === accountId
    )

    return userWorklogs
  }

  // Get worklogs for specific issues
  async getIssueWorklogs(issueKeys: string[]): Promise<JiraWorklog[]> {
    if (issueKeys.length === 0) return []

    const response = await this.api.post('/ex/jira/rest/api/3/worklog/list', {
      issueIds: issueKeys
    })

    return response.data.values || []
  }

  // Get issues assigned to user
  async getUserIssues(accountId: string, projectKeys?: string[]): Promise<JiraIssue[]> {
    let jql = `assignee = "${accountId}" AND status != "Done"`
    
    if (projectKeys && projectKeys.length > 0) {
      const projectFilter = projectKeys.map(key => `project = "${key}"`).join(' OR ')
      jql += ` AND (${projectFilter})`
    }

    const response = await this.api.post('/ex/jira/rest/api/3/search', {
      jql,
      fields: ['id', 'key', 'summary', 'status', 'assignee', 'project'],
      maxResults: 100
    })

    return response.data.issues || []
  }

  // Get worklogs for a specific date range
  async getWorklogsByDateRange(accountId: string, from: Date, to: Date): Promise<JiraWorklog[]> {
    const response = await this.api.get(`/ex/jira/rest/api/3/worklog/updated`, {
      params: {
        since: Math.floor(from.getTime() / 1000) * 1000,
        expand: 'changelog'
      }
    })

    const allWorklogs = response.data.values || []
    const userWorklogs = allWorklogs.filter((worklog: JiraWorklog) => 
      worklog.author.accountId === accountId &&
      new Date(worklog.started) >= from &&
      new Date(worklog.started) <= to
    )

    return userWorklogs
  }

  // Get projects accessible to user
  async getUserProjects(): Promise<any[]> {
    const response = await this.api.get('/ex/jira/rest/api/3/project')
    return response.data || []
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string; user?: JiraUser }> {
    try {
      if (!this.isTokenValid()) {
        return {
          success: false,
          message: 'Access token is invalid or expired'
        }
      }

      const user = await this.getCurrentUser()
      return {
        success: true,
        message: 'Connection successful',
        user
      }
    } catch (error: any) {
      console.error('Jira OAuth connection test failed:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to connect to Jira'
      }
    }
  }
}

// Export singleton instance
export const jiraOAuthService = new JiraOAuthService()
export default jiraOAuthService
