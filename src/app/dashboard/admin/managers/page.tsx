'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  UserCog, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  Shield,
  CheckCircle,
  X,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  managedTeams: number
  managedDevelopers: number
  permissions: string[]
}

export default function AdminManagersPage() {
  const { data: session } = useSession()
  const [managers, setManagers] = useState<Manager[]>([])
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedManagers, setSelectedManagers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/managers')
        // const data = await response.json()
        
        // Mock data for now
        const mockManagers: Manager[] = [
          {
            id: '1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah.johnson@company.com',
            department: 'software-engineering',
            isActive: true,
            lastLogin: '2025-01-15T10:30:00Z',
            createdAt: '2024-06-15T09:00:00Z',
            managedTeams: 3,
            managedDevelopers: 12,
            permissions: ['team-management', 'project-oversight', 'reporting']
          },
          {
            id: '2',
            firstName: 'Michael',
            lastName: 'Chen',
            email: 'michael.chen@company.com',
            department: 'venture-capital',
            isActive: true,
            lastLogin: '2025-01-14T16:45:00Z',
            createdAt: '2024-08-20T14:30:00Z',
            managedTeams: 2,
            managedDevelopers: 8,
            permissions: ['team-management', 'reporting']
          },
          {
            id: '3',
            firstName: 'Emily',
            lastName: 'Rodriguez',
            email: 'emily.rodriguez@company.com',
            department: 'graphic-design',
            isActive: false,
            lastLogin: '2025-01-10T11:20:00Z',
            createdAt: '2024-09-10T10:15:00Z',
            managedTeams: 1,
            managedDevelopers: 4,
            permissions: ['team-management']
          }
        ]
        
        setManagers(mockManagers)
        setFilteredManagers(mockManagers)
      } catch (error) {
        console.error('Error fetching managers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchManagers()
    }
  }, [session])

  // Filter managers based on search and filters
  useEffect(() => {
    let filtered = managers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(manager =>
        manager.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(manager =>
        statusFilter === 'active' ? manager.isActive : !manager.isActive
      )
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(manager => manager.department === departmentFilter)
    }

    setFilteredManagers(filtered)
  }, [managers, searchTerm, statusFilter, departmentFilter])

  const getDepartmentName = (department: string) => {
    const departments: Record<string, string> = {
      'software-engineering': 'Software Engineering',
      'venture-capital': 'Venture Capital',
      'graphic-design': 'Graphic Design',
      'communication': 'Communication'
    }
    return departments[department] || department
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const toggleManagerSelection = (managerId: string) => {
    const newSelected = new Set(selectedManagers)
    if (newSelected.has(managerId)) {
      newSelected.delete(managerId)
    } else {
      newSelected.add(managerId)
    }
    setSelectedManagers(newSelected)
  }

  const getUniqueDepartments = () => {
    const departments = managers.map(manager => manager.department)
    return Array.from(new Set(departments))
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <DashboardLayout
          title="Manager Management"
          subtitle="Manage all platform managers"
        >
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading managers...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout
        title="Manager Management"
        subtitle="Manage all platform managers and their permissions"
        actions={
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Add Manager
            </button>
            {selectedManagers.size > 0 && (
              <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedManagers.size})
              </button>
            )}
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
                    placeholder="Search managers..."
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
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* Department Filter */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Departments</option>
                  {getUniqueDepartments().map(dept => (
                    <option key={dept} value={dept}>{getDepartmentName(dept)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Managers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedManagers(new Set(filteredManagers.map(m => m.id)))
                          } else {
                            setSelectedManagers(new Set())
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teams Managed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Developers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredManagers.map((manager) => (
                    <tr key={manager.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedManagers.has(manager.id)}
                          onChange={() => toggleManagerSelection(manager.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {manager.firstName[0]}{manager.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {manager.firstName} {manager.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{manager.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDepartmentName(manager.department)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {manager.managedTeams}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {manager.managedDevelopers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastLogin(manager.lastLogin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          manager.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {manager.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900" title="Edit Manager">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900" title="Delete Manager">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredManagers.length === 0 && (
            <div className="text-center py-12">
              <UserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No managers found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
