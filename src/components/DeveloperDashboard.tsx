'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, TrendingUp, Code, Users, Target, Award } from 'lucide-react'
import StatsCard from './StatsCard'
import { useAuth } from '@/contexts/AuthContextNew'
import WeeklyHoursChart from './WeeklyHoursChart'

// Mock data for developer dashboard
const mockDeveloperData = {
  personal: {
    name: "Alex Johnson",
    role: "Senior Frontend Developer",
    avatar: "AJ",
    team: "Frontend Team",
    joinDate: "2023-01-15",
    currentStreak: 12,
    totalContributions: 847
  },
  stats: {
    totalHoursThisWeek: 42.5,
    totalHoursLastWeek: 38.0,
    hoursChange: "+11.8%",
    tasksCompletedThisWeek: 8,
    tasksCompletedLastWeek: 6,
    tasksChange: "+33.3%",
    codeReviews: 12,
    codeReviewsLastWeek: 10,
    reviewsChange: "+20%",
    projectsActive: 3
  },
  projects: [
    {
      id: 1,
      name: "E-commerce Platform",
      key: "ECOM",
      role: "Lead Developer",
      hoursThisWeek: 18.5,
      hoursLastWeek: 16.0,
      tasksCompleted: 4,
      tasksInProgress: 2,
      priority: "High",
      status: "Active",
      lastActivity: "2 hours ago"
    },
    {
      id: 2,
      name: "Mobile App Redesign",
      key: "MOBILE",
      role: "Frontend Developer",
      hoursThisWeek: 16.0,
      hoursLastWeek: 14.5,
      tasksCompleted: 3,
      tasksInProgress: 1,
      priority: "Medium",
      status: "Active",
      lastActivity: "1 day ago"
    },
    {
      id: 3,
      name: "Admin Dashboard",
      key: "ADMIN",
      role: "Developer",
      hoursThisWeek: 8.0,
      hoursLastWeek: 7.5,
      tasksCompleted: 1,
      tasksInProgress: 0,
      priority: "Low",
      status: "Maintenance",
      lastActivity: "3 days ago"
    }
  ],
  recentActivity: [
    {
      id: 1,
      type: "task_completed",
      project: "ECOM",
      title: "Implement shopping cart functionality",
      timestamp: "2 hours ago",
      hours: 4.5
    },
    {
      id: 2,
      type: "code_review",
      project: "MOBILE",
      title: "Reviewed pull request #123",
      timestamp: "4 hours ago",
      hours: 1.0
    },
    {
      id: 3,
      type: "task_started",
      project: "ECOM",
      title: "Fix payment gateway integration",
      timestamp: "1 day ago",
      hours: 0
    },
    {
      id: 4,
      type: "meeting",
      project: "GENERAL",
      title: "Sprint planning meeting",
      timestamp: "2 days ago",
      hours: 2.0
    }
  ],
  weeklyBreakdown: [
    { day: "Mon", hours: 8.5, tasks: 2 },
    { day: "Tue", hours: 7.0, tasks: 1 },
    { day: "Wed", hours: 9.0, tasks: 3 },
    { day: "Thu", hours: 8.0, tasks: 2 },
    { day: "Fri", hours: 10.0, tasks: 0 }
  ],
  skills: [
    { name: "React", level: 95, projects: 3 },
    { name: "TypeScript", level: 88, projects: 2 },
    { name: "Node.js", level: 75, projects: 1 },
    { name: "CSS/SCSS", level: 92, projects: 3 },
    { name: "Git", level: 85, projects: 3 }
  ]
}

export default function DeveloperDashboard() {
  const { user } = useAuth()
  const [selectedDateRange, setSelectedDateRange] = useState('this-week')
  const [isLoading, setIsLoading] = useState(false)

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'code_review': return <Code className="w-4 h-4 text-blue-600" />
      case 'task_started': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'meeting': return <Users className="w-4 h-4 text-purple-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Personal Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {mockDeveloperData.personal.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{mockDeveloperData.personal.name}</h1>
            <p className="text-blue-100">{mockDeveloperData.personal.role}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{mockDeveloperData.personal.team}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span>{mockDeveloperData.personal.totalContributions} contributions</span>
              </span>
              <span className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>{mockDeveloperData.personal.currentStreak} day streak</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Hours This Week"
          value={isLoading ? "..." : mockDeveloperData.stats.totalHoursThisWeek.toString()}
          change={mockDeveloperData.stats.hoursChange}
          changeType="positive"
          icon={Clock}
          description="vs last week"
        />
        <StatsCard
          title="Tasks Completed"
          value={isLoading ? "..." : mockDeveloperData.stats.tasksCompletedThisWeek.toString()}
          change={mockDeveloperData.stats.tasksChange}
          changeType="positive"
          icon={CheckCircle}
          description="vs last week"
        />
        <StatsCard
          title="Code Reviews"
          value={isLoading ? "..." : mockDeveloperData.stats.codeReviews.toString()}
          change={mockDeveloperData.stats.reviewsChange}
          changeType="positive"
          icon={Code}
          description="vs last week"
        />
        <StatsCard
          title="Active Projects"
          value={isLoading ? "..." : mockDeveloperData.stats.projectsActive.toString()}
          change=""
          changeType="neutral"
          icon={TrendingUp}
          description="currently working on"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Overview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Projects</h2>
              <span className="text-sm text-gray-500">{mockDeveloperData.projects.length} active</span>
            </div>
            <div className="space-y-4">
              {mockDeveloperData.projects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {project.key}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">{project.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Hours This Week</p>
                      <p className="font-medium">{project.hoursThisWeek}h</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tasks Completed</p>
                      <p className="font-medium">{project.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Activity</p>
                      <p className="font-medium">{project.lastActivity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {mockDeveloperData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.project}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                      {activity.hours > 0 && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{activity.hours}h</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skills and Weekly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills & Expertise</h2>
          <div className="space-y-4">
            {mockDeveloperData.skills.map((skill) => (
              <div key={skill.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                  <span className="text-xs text-gray-500">({skill.projects} projects)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{skill.level}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Hours Breakdown */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">This Week&apos;s Hours</h2>
            <WeeklyHoursChart data={mockDeveloperData.weeklyBreakdown} />
          </div>
        </div>
      </div>
    </div>
  )
}
