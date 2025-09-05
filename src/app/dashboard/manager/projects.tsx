'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { QuickActions } from '@/components/dashboard/QuickActions'
import {
  FolderOpen,
  Plus,
  Search,
  Download,
  Calendar,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on-hold'
  progress: number
  teamSize: number
  startDate: string
  endDate: string
  priority: 'high' | 'medium' | 'low'
}

interface Issue {
  id: string
  key: string
  summary: string
  status: string
  priority: string
  assignee: string
  project: string
}

export default function ManagerProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [recentIssues, setRecentIssues] = useState<Issue[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Mock data - replace with actual API calls
  useEffect(() => {
    setProjects([
      {
        id: '1',
        name: 'E-commerce Platform Redesign',
        description: 'Complete redesign of the company e-commerce platform',
        status: 'active',
        progress: 75,
        teamSize: 8,
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        priority: 'high'
      },
      {
        id: '2',
        name: 'Mobile App Development',
        description: 'iOS and Android app for customer engagement',
        status: 'active',
        progress: 45,
        teamSize: 6,
        startDate: '2024-02-01',
        endDate: '2024-08-15',
        priority: 'medium'
      }
    ])

    setRecentIssues([
      {
        id: '1',
        key: 'PROJ-123',
        summary: 'Fix user authentication bug',
        status: 'In Progress',
        priority: 'high',
        assignee: 'John Doe',
        project: 'E-commerce Platform'
      },
      {
        id: '2',
        key: 'PROJ-124',
        summary: 'Implement payment gateway',
        status: 'To Do',
        priority: 'high',
        assignee: 'Jane Smith',
        project: 'E-commerce Platform'
      }
    ])
  }, [])

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length.toString(),
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Projects',
      value: projects.filter(p => p.status === 'active').length.toString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Team Members',
      value: projects.reduce((sum, p) => sum + p.teamSize, 0).toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg. Progress',
      value: `${Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const quickActions = [
    {
      label: 'Create Project',
      icon: Plus,
      variant: 'primary' as const,
      onClick: () => router.push('/dashboard/manager/projects/create'),
    },
    {
      label: 'View Reports',
      icon: TrendingUp,
      onClick: () => router.push('/dashboard/manager/reports'),
    },
    {
      label: 'Team Overview',
      icon: Users,
      onClick: () => router.push('/dashboard/manager/team'),
    },
    {
      label: 'Export Data',
      icon: Download,
      onClick: () => router.push('/dashboard/manager/projects/export'),
    },
  ]

  return (
    <ProtectedRoute allowedRoles={['MANAGER']}>
      <DashboardLayout
        title="Project Management"
        subtitle="Monitor and manage your team's projects and track progress"
        actions={
          <div className="flex items-center space-x-3">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => router.push('/dashboard/manager/projects/export')}
            >
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => router.push('/dashboard/manager/projects/create')}
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              New Project
            </button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Stats Grid */}
          <StatsGrid stats={stats} />

          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>

          {/* Projects Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/manager/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Progress: {project.progress}%</span>
                    <span>Team: {project.teamSize}</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
