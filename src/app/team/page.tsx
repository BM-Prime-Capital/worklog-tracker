'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContextNew'
import { jiraApiEnhanced as jiraApi, JiraUser } from '@/lib/jiraApiEnhanced'
import { userService } from '@/lib/userService'
import { User } from '@/lib/types'
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Clock,
  Calendar,
  UserPlus,
  UserCheck,
  UserX,
  Activity,
  Globe,
  Phone,
  Building,
  Star,
  StarOff,
  Edit3,
  MessageSquare,
  Database,
  Cloud,
  RefreshCw
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface TeamMember extends Partial<JiraUser> {
  // Core fields that exist in both Jira and database users
  id: string
  accountId?: string // Jira users have this, database users might not
  email: string
  displayName: string
  
  // Additional fields
  avatar?: string
  team?: string
  role?: string
  department?: string
  employmentType?: 'intern' | 'permanent'
  lastActivity?: {
    issueKey: string
    summary: string
    action: string
    timestamp: string
    timeAgo: string
  }
  isFavorite?: boolean
  
  // Source tracking
  source: 'jira' | 'database'
  isActive?: boolean
  jiraEnabled?: boolean
}

export default function TeamPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activityFilter, setActivityFilter] = useState<'all' | 'recent' | 'active' | 'inactive'>('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'jira' | 'database'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'lastActivity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [newMemberForm, setNewMemberForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    employmentType: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<{
    jira: 'success' | 'error' | 'loading'
    database: 'success' | 'error' | 'loading'
  }>({
    jira: 'loading',
    database: 'loading'
  })

  // Fetch team members from both Jira and database
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsDataLoading(true)

        // Fetch users from both sources concurrently
        const [jiraUsers, databaseUsers] = await Promise.all([
          jiraApi.getUsers().then(users => {
            setSyncStatus(prev => ({ ...prev, jira: 'success' }))
            return users
          }).catch(error => {
            console.error('Error fetching Jira users:', error)
            setSyncStatus(prev => ({ ...prev, jira: 'error' }))
            return []
          }),
          userService.getUsers().then(response => {
            setSyncStatus(prev => ({ ...prev, database: 'success' }))
            return response
          }).catch(error => {
            console.error('Error fetching database users:', error)
            setSyncStatus(prev => ({ ...prev, database: 'error' }))
            return { success: false, users: [], total: 0 }
          })
        ])

        // Update last refresh time
        setLastRefreshTime(new Date())

        // Transform Jira users to team members
        const transformedJiraMembers: TeamMember[] = jiraUsers.map(user => ({
          id: user.accountId || `jira-${user.displayName}`,
          accountId: user.accountId,
          email: user.emailAddress,
          displayName: user.displayName,
          avatar: getInitials(user.displayName),
          team: detectTeam(user.displayName),
          role: detectRole(user.displayName),
          lastActivity: undefined, // Will be populated with real data
          isFavorite: false,
          source: 'jira' as const,
          jiraEnabled: true
        }))

        // Transform database users to team members
        const transformedDatabaseMembers: TeamMember[] = databaseUsers.success 
          ? databaseUsers.users.map(dbUser => ({
              id: dbUser.id,
              accountId: dbUser.accountId,
              email: dbUser.email,
              displayName: dbUser.displayName,
              avatar: getInitials(dbUser.displayName),
              team: dbUser.department ? detectTeam(dbUser.department) : detectTeam(dbUser.displayName),
              role: dbUser.role || detectRole(dbUser.displayName),
              department: dbUser.department,
              employmentType: dbUser.employmentType,
              lastActivity: undefined, // Will be populated with real data
              isFavorite: false,
              source: 'database' as const,
              isActive: dbUser.isActive,
              jiraEnabled: dbUser.jiraEnabled
            }))
          : []

        // Merge users, prioritizing database users for duplicates
        const mergedMembers = [...transformedJiraMembers]
        
        transformedDatabaseMembers.forEach(dbMember => {
          const existingIndex = mergedMembers.findIndex(jiraMember => 
            jiraMember.email === dbMember.email || 
            jiraMember.accountId === dbMember.accountId
          )
          
          if (existingIndex !== -1) {
            // Update existing Jira member with database info
            mergedMembers[existingIndex] = {
              ...mergedMembers[existingIndex],
              ...dbMember,
              source: 'database' as const,
              // Keep Jira-specific fields if they exist
              accountId: dbMember.accountId || mergedMembers[existingIndex].accountId
            }
          } else {
            // Add new database member
            mergedMembers.push(dbMember)
          }
        })

        // Fetch recent activity for all users
        const membersWithActivity = await Promise.all(
          mergedMembers.map(async (member) => {
            try {
              if (member.accountId) {
                // Get worklogs for the last 30 days to find user activity
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                
                const worklogs = await jiraApi.getWorklogs(
                  thirtyDaysAgo.toISOString().split('T')[0],
                  new Date().toISOString().split('T')[0]
                )
                
                const userActivity = findUserLastActivity(worklogs, member.accountId)
                return {
                  ...member,
                  lastActivity: userActivity
                }
              }
              return member
            } catch (error) {
              console.error(`Error fetching worklogs for ${member.displayName}:`, error)
              return member
            }
          })
        )

        setTeamMembers(membersWithActivity)
        setFilteredMembers(membersWithActivity)
      } catch (error) {
        console.error('Error fetching team members:', error)
        setTeamMembers([])
        setFilteredMembers([])
      } finally {
        setIsDataLoading(false)
      }
    }

    if (user) {
      fetchTeamMembers()
    }
  }, [user])

  // Filter and sort team members
  useEffect(() => {
    const filtered = teamMembers.filter(member => {
      const matchesSearch = member.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTeam = teamFilter === 'all' || member.team === teamFilter
      const matchesSource = sourceFilter === 'all' || member.source === sourceFilter
      
      // Activity filter
      let matchesActivity = true
      if (activityFilter === 'recent') {
        matchesActivity = member.lastActivity ? isRecentActivity(member.lastActivity.timestamp) : false
      } else if (activityFilter === 'active') {
        matchesActivity = member.lastActivity ? isActiveUser(member.lastActivity.timestamp) : false
      } else if (activityFilter === 'inactive') {
        matchesActivity = !member.lastActivity || !isActiveUser(member.lastActivity.timestamp)
      }

      return matchesSearch && matchesTeam && matchesSource && matchesActivity
    })

    // Sort members
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sortBy) {
        case 'name':
          aValue = a.displayName
          bValue = b.displayName
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'lastActivity':
          aValue = a.lastActivity?.timestamp || ''
          bValue = b.lastActivity?.timestamp || ''
          break
        default:
          aValue = a.displayName
          bValue = b.displayName
      }

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })

    setFilteredMembers(sorted)
  }, [teamMembers, searchTerm, activityFilter, teamFilter, sortBy, sortOrder])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const detectTeam = (name: string) => {
    const teams = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'QA', 'Design', 'Product']
    return teams[Math.floor(Math.random() * teams.length)]
  }

  const detectRole = (name: string) => {
    const roles = ['Developer', 'Senior Developer', 'Lead Developer', 'Architect', 'Manager']
    return roles[Math.floor(Math.random() * roles.length)]
  }

  const findUserLastActivity = (worklogs: Array<{
    author: { displayName: string; emailAddress: string; accountId?: string }
    timeSpentSeconds: number
    issueKey: string
    summary: string
    started: string
  }>, accountId: string) => {
    // Find the most recent worklog entry by this user
    const userWorklogs = worklogs.filter(worklog => 
      worklog.author.accountId === accountId
    )

    if (userWorklogs.length === 0) return undefined

    const mostRecent = userWorklogs.reduce((latest, current) => {
      const latestDate = new Date(latest.started)
      const currentDate = new Date(current.started)
      return currentDate > latestDate ? current : latest
    })

    const timestamp = mostRecent.started
    const timeAgo = getTimeAgo(timestamp)
    
    return {
      issueKey: mostRecent.issueKey,
      summary: mostRecent.summary,
      action: `Last logged ${Math.round(mostRecent.timeSpentSeconds / 3600 * 10) / 10}h`,
      timestamp,
      timeAgo
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffInMs = now.getTime() - date.getTime()
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

  const isRecentActivity = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    return diffInHours < 24 // Last 24 hours
  }

  const isActiveUser = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    return diffInDays < 7 // Last 7 days
  }

  const getActivityColor = (timestamp: string) => {
    if (isRecentActivity(timestamp)) return 'text-green-600'
    if (isActiveUser(timestamp)) return 'text-yellow-600'
    return 'text-gray-500'
  }

  const toggleFavorite = (memberId: string) => {
    setTeamMembers(prev => prev.map(member =>
      member.id === memberId
        ? { ...member, isFavorite: !member.isFavorite }
        : member
    ))
  }

  const toggleMemberSelection = (memberId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMembers(newSelected)
  }

  const getUniqueTeams = () => {
    const teams = teamMembers.map(member => member.team).filter(Boolean)
    return Array.from(new Set(teams))
  }

  const openAddMemberModal = () => {
    setIsAddMemberModalOpen(true)
    setNewMemberForm({ firstName: '', lastName: '', email: '', department: '', employmentType: '' })
  }

  const closeAddMemberModal = () => {
    setIsAddMemberModalOpen(false)
    setNewMemberForm({ firstName: '', lastName: '', email: '', department: '', employmentType: '' })
    setIsSubmitting(false)
  }

  const handleFormChange = (field: 'firstName' | 'lastName' | 'email' | 'department' | 'employmentType', value: string) => {
    setNewMemberForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Create user using the user service
      const userData = {
        firstName: newMemberForm.firstName,
        lastName: newMemberForm.lastName,
        email: `${newMemberForm.email}@bmprimecapital.com`,
        department: newMemberForm.department as 'software-engineering' | 'venture-capital' | 'graphic-design' | 'communication',
        employmentType: newMemberForm.employmentType as 'permanent' | 'intern'
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Refresh the team members list
        window.location.reload()
      } else {
        console.error('Failed to create user:', result.message)
        // TODO: Show error message to user
      }
      
      closeAddMemberModal()
    } catch (error) {
      console.error('Error adding member:', error)
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Team Management"
      subtitle="Manage and view Atlassian account team members from Jira"
      actions={
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
          <button 
            onClick={openAddMemberModal}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              {/* Activity Filter */}
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value as 'all' | 'recent' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Activity</option>
                <option value="recent">Recent (24h)</option>
                <option value="active">Active (7d)</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Team Filter */}
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Teams</option>
                {getUniqueTeams().map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as 'all' | 'jira' | 'database')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Sources</option>
                <option value="jira">Jira</option>
                <option value="database">Database</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as 'name' | 'email' | 'lastActivity')
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
                <option value="lastActivity-desc">Last Activity</option>
              </select>

              {/* View Mode */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <div className="space-y-1 w-4 h-4">
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Sync Status */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Data Sources:</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        syncStatus.jira === 'success' ? 'bg-green-500' : 
                        syncStatus.jira === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className={`text-sm ${
                        syncStatus.jira === 'success' ? 'text-green-600' : 
                        syncStatus.jira === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        Jira {syncStatus.jira === 'success' ? '✓' : syncStatus.jira === 'error' ? '✗' : '⋯'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        syncStatus.database === 'success' ? 'bg-green-500' : 
                        syncStatus.database === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className={`text-sm ${
                        syncStatus.database === 'success' ? 'text-green-600' : 
                        syncStatus.database === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        Database {syncStatus.database === 'success' ? '✓' : syncStatus.database === 'error' ? '✗' : '⋯'}
                      </span>
                    </div>
                  </div>
                </div>
                {lastRefreshTime && (
                  <div className="text-sm text-gray-500">
                    Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        {isDataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Atlassian account team members found</h3>
            <p className="text-gray-500">Only users with Atlassian account types are displayed. Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredMembers.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Cloud className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">From Jira</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredMembers.filter(m => m.source === 'jira').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Database className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">From Database</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredMembers.filter(m => m.source === 'database').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recently Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredMembers.filter(m => m.lastActivity && isRecentActivity(m.lastActivity.timestamp)).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active This Week</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredMembers.filter(m => m.lastActivity && isActiveUser(m.lastActivity.timestamp)).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {member.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{member.displayName}</h3>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              member.employmentType === 'permanent' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {member.employmentType === 'permanent' ? 'Permanent' : 'Intern'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              member.source === 'jira' 
                                ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {member.source === 'jira' ? (
                                <>
                                  <Cloud className="w-3 h-3 mr-1" />
                                  Jira
                                </>
                              ) : (
                                <>
                                  <Database className="w-3 h-3 mr-1" />
                                  Database
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/*<button*/}
                      {/*  onClick={() => toggleFavorite(member.accountId)}*/}
                      {/*  className="text-gray-400 hover:text-yellow-500 transition-colors"*/}
                      {/*>*/}
                      {/*  {member.isFavorite ? (*/}
                      {/*    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />*/}
                      {/*  ) : (*/}
                      {/*    <StarOff className="w-5 h-5" />*/}
                      {/*  )}*/}
                      {/*</button>*/}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{member.team}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{member.role}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span>{member.timeZone}</span>
                      </div>
                    </div>

                    {/* Last Activity Section */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {member.lastActivity ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Last Activity</span>
                            <span className={`text-xs font-medium ${getActivityColor(member.lastActivity.timestamp)}`}>
                              {member.lastActivity.timeAgo}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Edit3 className="w-3 h-3 text-blue-500" />
                              <span className="text-xs font-medium text-gray-700">{member.lastActivity.issueKey}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{member.lastActivity.summary}</p>
                            <p className="text-xs text-blue-600 font-medium mt-1">{member.lastActivity.action}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-400">No recent activity</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employment Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {member.avatar}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.displayName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.team}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.role}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.employmentType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.source === 'jira' ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                <Cloud className="w-3 h-3 mr-1" />
                                Jira
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                <Database className="w-3 h-3 mr-1" />
                                Database
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {member.lastActivity ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm font-medium ${getActivityColor(member.lastActivity.timestamp)}`}>
                                    {member.lastActivity.timeAgo}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">{member.lastActivity.issueKey}</span>
                                  <span className="ml-1">- {member.lastActivity.summary}</span>
                                </div>
                                <div className="text-xs text-blue-600 font-medium">
                                  {member.lastActivity.action}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No recent activity</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Mail className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Team Member</h2>
                <p className="text-sm text-gray-600">Create a new team member account</p>
              </div>
              <button
                onClick={closeAddMemberModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    required
                    value={newMemberForm.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    required
                    value={newMemberForm.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="email"
                      required
                      value={newMemberForm.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="username"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">@bmprimecapital.com</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Just enter the username part. The @bmprimecapital.com domain will be added automatically.
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    id="department"
                    required
                    value={newMemberForm.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a department</option>
                    <option value="software-engineering">Software Engineering</option>
                    <option value="venture-capital">Venture Capital</option>
                    <option value="graphic-design">Graphic Design</option>
                    <option value="communication">Communication</option>
                  </select>
                </div>

                {/* Employment Type */}
                <div>
                  <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <select
                    id="employmentType"
                    required
                    value={newMemberForm.employmentType}
                    onChange={(e) => handleFormChange('employmentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select employment type</option>
                    <option value="permanent">Permanent</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                {/* Preview */}
                {newMemberForm.email && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Full email:</span> {newMemberForm.email}@bmprimecapital.com
                    </p>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={closeAddMemberModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !newMemberForm.firstName || !newMemberForm.lastName || !newMemberForm.email || !newMemberForm.department || !newMemberForm.employmentType}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Member'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
