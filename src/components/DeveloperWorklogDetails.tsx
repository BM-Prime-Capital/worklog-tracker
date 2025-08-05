'use client'

import { useState } from 'react'
import { Clock, User, Calendar, MessageSquare, ExternalLink, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Developer } from '@/lib/types'
import { JiraWorklog } from '@/lib/jiraApiEnhanced'
import WorklogDetailsModal from './WorklogDetailsModal'

interface DeveloperWorklogDetailsProps {
  developers: Developer[]
  isLoading: boolean
}

interface WorklogEntry {
  issueKey: string
  summary: string
  timeSpentSeconds: number
  started: string
  author: string
}

export default function DeveloperWorklogDetails({ developers, isLoading }: DeveloperWorklogDetailsProps) {
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('all')
  const [expandedDevelopers, setExpandedDevelopers] = useState<Set<string>>(new Set())
  const [selectedWorklog, setSelectedWorklog] = useState<JiraWorklog | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Process all worklog entries
  const processWorklogEntries = (): WorklogEntry[] => {
    const entries: WorklogEntry[] = []

    developers.forEach(developer => {
      if (!developer.worklogs) return

      developer.worklogs.forEach(worklog => {
        entries.push({
          issueKey: worklog.issueKey,
          summary: worklog.summary,
          timeSpentSeconds: worklog.timeSpentSeconds,
          started: worklog.started,
          author: developer.name
        })
      })
    })

    // Sort by date (most recent first)
    return entries.sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
  }

  const worklogEntries = processWorklogEntries()
  const filteredEntries = selectedDeveloper === 'all' 
    ? worklogEntries 
    : worklogEntries.filter(entry => entry.author === selectedDeveloper)

  const toggleDeveloperExpansion = (developerName: string) => {
    const newExpanded = new Set(expandedDevelopers)
    if (newExpanded.has(developerName)) {
      newExpanded.delete(developerName)
    } else {
      newExpanded.add(developerName)
    }
    setExpandedDevelopers(newExpanded)
  }

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600
    return `${Math.round(hours * 100) / 100}h`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeColor = (seconds: number) => {
    const hours = seconds / 3600
    if (hours >= 8) return 'text-green-600'
    if (hours >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleWorklogClick = (entry: WorklogEntry) => {
    // Convert WorklogEntry to JiraWorklog format for the modal
    const jiraWorklog: JiraWorklog = {
      id: `${entry.issueKey}-${entry.started}`,
      issueId: entry.issueKey,
      issueKey: entry.issueKey,
      summary: entry.summary,
      author: {
        displayName: entry.author,
        emailAddress: '', // We don't have email in WorklogEntry
        accountId: undefined
      },
      timeSpentSeconds: entry.timeSpentSeconds,
      timeSpent: `${Math.round(entry.timeSpentSeconds / 3600 * 100) / 100}h`,
      started: entry.started,
      comment: undefined
    }
    setSelectedWorklog(jiraWorklog)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedWorklog(null)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Worklog Details</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Group entries by developer
  const developerGroups = filteredEntries.reduce((groups, entry) => {
    if (!groups[entry.author]) {
      groups[entry.author] = []
    }
    groups[entry.author].push(entry)
    return groups
  }, {} as Record<string, WorklogEntry[]>)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Worklog Details</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={selectedDeveloper}
            onChange={(e) => setSelectedDeveloper(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Developers</option>
            {developers.map(developer => (
              <option key={developer.name} value={developer.name}>
                {developer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {Object.keys(developerGroups).length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No worklog entries found for the selected period</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(developerGroups).map(([developerName, entries]) => {
            const isExpanded = expandedDevelopers.has(developerName)
            const totalHours = entries.reduce((sum, entry) => sum + entry.timeSpentSeconds, 0) / 3600

            return (
              <div key={developerName} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Developer Header */}
                <div 
                  className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleDeveloperExpansion(developerName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{developerName}</h3>
                        <p className="text-sm text-gray-600">
                          {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} • {formatHours(totalHours * 3600)} total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatHours(totalHours * 3600)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Worklog Entries */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-4 space-y-3">
                      {entries.map((entry, index) => (
                        <div 
                          key={`${entry.issueKey}-${index}`} 
                          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleWorklogClick(entry)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {entry.issueKey}
                              </span>
                              <span className={`text-sm font-semibold ${getTimeColor(entry.timeSpentSeconds)}`}>
                                {formatHours(entry.timeSpentSeconds)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 mb-1">{entry.summary}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(entry.started)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatHours(entry.timeSpentSeconds)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Handle external link click
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
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
      {Object.keys(developerGroups).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(developerGroups).length}
              </p>
              <p className="text-sm text-gray-600">Developers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatHours(filteredEntries.reduce((sum, entry) => sum + entry.timeSpentSeconds, 0))}
              </p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredEntries.length}
              </p>
              <p className="text-sm text-gray-600">Entries</p>
            </div>
          </div>
        </div>
      )}

      {/* Worklog Details Modal */}
      <WorklogDetailsModal
        worklog={selectedWorklog}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
} 