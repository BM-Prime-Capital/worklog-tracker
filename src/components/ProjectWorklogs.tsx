'use client'

import { useState } from 'react'
import { Clock, User, Calendar, TrendingUp, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Developer } from '@/lib/types'

interface ProjectWorklogsProps {
  developers: Developer[]
  isLoading: boolean
}

interface ProjectData {
  projectKey: string
  projectName: string
  totalHours: number
  developers: {
    developerName: string
    hours: number
    tasks: string[]
  }[]
}

export default function ProjectWorklogs({ developers, isLoading }: ProjectWorklogsProps) {
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Process worklogs to group by project
  const processProjectWorklogs = (): ProjectData[] => {
    const projectMap = new Map<string, ProjectData>()

    developers.forEach(developer => {
      if (!developer.worklogs) return

      developer.worklogs.forEach(worklog => {
        // Extract project key from issue key (e.g., "PROJ-123" -> "PROJ")
        const projectKey = worklog.issueKey.split('-')[0]
        const hours = worklog.timeSpentSeconds / 3600

        if (!projectMap.has(projectKey)) {
          projectMap.set(projectKey, {
            projectKey,
            projectName: `${projectKey} Project`,
            totalHours: 0,
            developers: []
          })
        }

        const project = projectMap.get(projectKey)!
        project.totalHours += hours

        // Find or create developer entry for this project
        let devEntry = project.developers.find(d => d.developerName === developer.name)
        if (!devEntry) {
          devEntry = {
            developerName: developer.name,
            hours: 0,
            tasks: []
          }
          project.developers.push(devEntry)
        }

        devEntry.hours += hours
        if (!devEntry.tasks.includes(worklog.issueKey)) {
          devEntry.tasks.push(worklog.issueKey)
        }
      })
    })

    // Sort projects by total hours (descending)
    return Array.from(projectMap.values()).sort((a, b) => b.totalHours - a.totalHours)
  }

  const projects = processProjectWorklogs()
  const filteredProjects = selectedProject === 'all' 
    ? projects 
    : projects.filter(p => p.projectKey === selectedProject)

  const toggleProjectExpansion = (projectKey: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectKey)) {
      newExpanded.delete(projectKey)
    } else {
      newExpanded.add(projectKey)
    }
    setExpandedProjects(newExpanded)
  }

  const formatHours = (hours: number) => {
    return `${Math.round(hours * 100) / 100}h`
  }

  const getProductivityColor = (hours: number) => {
    if (hours >= 40) return 'text-green-600'
    if (hours >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Project Worklogs</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Project Worklogs</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.projectKey} value={project.projectKey}>
                {project.projectKey}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No worklogs found for the selected period</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map(project => {
            const isExpanded = expandedProjects.has(project.projectKey)
            const sortedDevelopers = project.developers.sort((a, b) => b.hours - a.hours)

            return (
              <div key={project.projectKey} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Project Header */}
                <div 
                  className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleProjectExpansion(project.projectKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.projectName}</h3>
                        <p className="text-sm text-gray-600">
                          {project.developers.length} developer{project.developers.length !== 1 ? 's' : ''} • {formatHours(project.totalHours)} total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatHours(project.totalHours)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-4 space-y-3">
                      {sortedDevelopers.map(developer => (
                        <div key={developer.developerName} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{developer.developerName}</p>
                              <p className="text-sm text-gray-600">
                                {developer.tasks.length} task{developer.tasks.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${getProductivityColor(developer.hours)}`}>
                              {formatHours(developer.hours)}
                            </span>
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary Stats */}
      {filteredProjects.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProjects.length}
              </p>
              <p className="text-sm text-gray-600">Projects</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatHours(filteredProjects.reduce((sum, p) => sum + p.totalHours, 0))}
              </p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {new Set(filteredProjects.flatMap(p => p.developers.map(d => d.developerName))).size}
              </p>
              <p className="text-sm text-gray-600">Active Developers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 