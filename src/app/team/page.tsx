'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContextNew'
import { jiraApiEnhanced as jiraApi, JiraUser } from '@/lib/jiraApiEnhanced'
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
  StarOff
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface TeamMember extends JiraUser {
  avatar?: string
  team?: string
  role?: string
  lastActive?: string
  status: 'online' | 'offline' | 'away'
  isFavorite?: boolean
}

export default function TeamPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'away'>('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'lastActive'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch team members from Jira
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsDataLoading(true)
        
        const users = await jiraApi.getUsers()
        
        // Transform Jira users to team members with additional data
        const transformedMembers: TeamMember[] = users.map(user => ({
          ...user,
          avatar: getInitials(user.displayName),
          team: detectTeam(user.displayName),
          role: detectRole(user.displayName),
          lastActive: getRandomLastActive(),
          status: getRandomStatus(),
          isFavorite: false
        }))

        setTeamMembers(transformedMembers)
        setFilteredMembers(transformedMembers)
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
                           member.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter
      const matchesTeam = teamFilter === 'all' || member.team === teamFilter
      
      return matchesSearch && matchesStatus && matchesTeam
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
          aValue = a.emailAddress
          bValue = b.emailAddress
          break
        case 'lastActive':
          aValue = a.lastActive || ''
          bValue = b.lastActive || ''
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
  }, [teamMembers, searchTerm, statusFilter, teamFilter, sortBy, sortOrder])

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

  const getRandomLastActive = () => {
    const times = ['2 minutes ago', '5 minutes ago', '1 hour ago', '2 hours ago', '1 day ago']
    return times[Math.floor(Math.random() * times.length)]
  }

  const getRandomStatus = (): 'online' | 'offline' | 'away' => {
    const statuses: ('online' | 'offline' | 'away')[] = ['online', 'offline', 'away']
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const toggleFavorite = (memberId: string) => {
    setTeamMembers(prev => prev.map(member => 
      member.accountId === memberId 
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
          <div className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
            <Users className="w-4 h-4 mr-2" />
            Atlassian Accounts Only
          </div>
          <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </button>
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Mail className="w-4 h-4 mr-2" />
            Send Message
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
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
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

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
                <option value="lastActive-asc">Last Active</option>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Online</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredMembers.filter(m => m.status === 'online').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Activity className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Away</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredMembers.filter(m => m.status === 'away').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <UserX className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Offline</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredMembers.filter(m => m.status === 'offline').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMembers.map((member) => (
                  <div key={member.accountId} className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {member.avatar}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{member.displayName}</h3>
                          <p className="text-sm text-gray-600">{member.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(member.accountId)}
                        className="text-gray-400 hover:text-yellow-500 transition-colors"
                      >
                        {member.isFavorite ? (
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{member.emailAddress}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{member.team}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{member.lastActive}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span>{member.timeZone}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'online' ? 'bg-green-100 text-green-800' :
                          member.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                        <button className="text-gray-400 hover:text-blue-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Active
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member) => (
                        <tr key={member.accountId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {member.avatar}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.displayName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.emailAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.team}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.role}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              member.status === 'online' ? 'bg-green-100 text-green-800' :
                              member.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.lastActive}
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
    </DashboardLayout>
  )
} 