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