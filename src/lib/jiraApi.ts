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
    displayName: string
    emailAddress: string
  }
  timeSpentSeconds: number
  timeSpent: string
  started: string
  comment?: string
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

  getCredentials(): JiraCredentials | null {
    if (!this.credentials) {
      const saved = Cookies.get('jira_credentials')
      if (saved) {
        this.credentials = JSON.parse(saved)
      }
    }
    return this.credentials
  }

  clearCredentials(): void {
    this.credentials = null
    Cookies.remove('jira_credentials')
  }

  isAuthenticated(): boolean {
    return !!this.getCredentials()
  }

  // Jira API methods
  async testConnection(): Promise<boolean> {
    try {
      const credentials = this.getCredentials()
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
    const credentials = this.getCredentials()
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
    const credentials = this.getCredentials()
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

  async getIssues(projectKeys?: string[], maxResults: number = 50): Promise<any[]> {
    const credentials = this.getCredentials()
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
      return data.issues
    } catch (error) {
      console.error('Error fetching issues:', error)
      throw error
    }
  }

  async getUsers(): Promise<JiraUser[]> {
    const credentials = this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await this.api.get(
        `https://${credentials.domain}/rest/api/3/users/search`,
        {
          params: {
            maxResults: 1000
          }
        }
      )
      return response.data.filter((user: JiraUser) => user.active)
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getProjects(): Promise<any[]> {
    const credentials = this.getCredentials()
    if (!credentials) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await this.api.get(
        `https://${credentials.domain}/rest/api/3/project`
      )
      return response.data
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  private buildWorklogJQL(startDate: string, endDate: string, projectKeys?: string[]): string {
    let jql = `worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`
    
    if (projectKeys && projectKeys.length > 0) {
      const projectClause = projectKeys.map(key => `project = ${key}`).join(' OR ')
      jql += ` AND (${projectClause})`
    }
    
    return jql
  }

  // Data transformation methods
  transformWorklogsToDashboardData(worklogs: JiraWorklog[]) {
    const developers = new Map<string, unknown>()
    const teamHours = new Map<string, number>()
    
    worklogs.forEach(worklog => {
      const author = worklog.author.displayName
      const hours = worklog.timeSpentSeconds / 3600
      
      // Aggregate by developer
      if (!developers.has(author)) {
        developers.set(author, {
          name: author,
          avatar: this.getInitials(author),
          team: this.detectTeam(author), // You might want to maintain a team mapping
          hours: 0,
          tasks: new Set(),
          completed: 0,
          productivity: 0,
          trend: 'stable',
          lastActive: worklog.started,
          status: 'online'
        })
      }
      
      const dev = developers.get(author)!
      dev.hours += hours
      dev.tasks.add(worklog.issueKey)
      
      // Aggregate by team
      const team = dev.team
      teamHours.set(team, (teamHours.get(team) || 0) + hours)
    })
    
    // Convert to array and calculate additional metrics
    const developersArray = Array.from(developers.values()).map(dev => ({
      ...dev,
      tasks: dev.tasks.size,
      completed: dev.tasks.size, // Assuming all logged work is completed
      productivity: Math.min(100, (dev.hours / 40) * 100) // Simple productivity calculation
    }))
    
    return {
      developers: developersArray,
      teamHours: Object.fromEntries(teamHours),
      totalHours: Array.from(teamHours.values()).reduce((sum, hours) => sum + hours, 0)
    }
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
}

export const jiraApi = new JiraApiService() 