'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Search, Filter, SortAsc, SortDesc, ExternalLink, User, Clock, Calendar } from 'lucide-react'
import { JiraWorklog } from '@/lib/jiraApiEnhanced'
import WorklogDetailsModal from './WorklogDetailsModal'

interface WorklogTableProps {
  worklogs: JiraWorklog[]
  isLoading: boolean
  dateRange: { start: Date; end: Date }
}

export default function WorklogTable({ worklogs, isLoading, dateRange }: WorklogTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'started' | 'author' | 'issueKey' | 'timeSpentSeconds'>('started')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('all')
  const [selectedWorklog, setSelectedWorklog] = useState<JiraWorklog | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get unique developers for filter
  const developers = Array.from(new Set(worklogs.map(w => w.author.displayName))).sort()

  // Filter and sort worklogs
  const filteredAndSortedWorklogs = worklogs
         .filter(worklog => {
       const matchesSearch = 
         worklog.author.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         worklog.issueKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
         worklog.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (worklog.comment && worklog.comment.toLowerCase().includes(searchTerm.toLowerCase()))
       
       const matchesDeveloper = selectedDeveloper === 'all' || worklog.author.displayName === selectedDeveloper
       
       return matchesSearch && matchesDeveloper
     })
         .sort((a, b) => {
       let aValue: string | number, bValue: string | number
       
       switch (sortField) {
         case 'started':
           aValue = new Date(a.started).getTime()
           bValue = new Date(b.started).getTime()
           break
         case 'author':
           aValue = a.author.displayName.toLowerCase()
           bValue = b.author.displayName.toLowerCase()
           break
         case 'issueKey':
           aValue = a.issueKey.toLowerCase()
           bValue = b.issueKey.toLowerCase()
           break
         case 'timeSpentSeconds':
           aValue = a.timeSpentSeconds
           bValue = b.timeSpentSeconds
           break
         default:
           return 0
       }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: 'started' | 'author' | 'issueKey' | 'timeSpentSeconds') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600
    return `${Math.round(hours * 100) / 100}h`
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  const getSortIcon = (field: 'started' | 'author' | 'issueKey' | 'timeSpentSeconds') => {
    if (sortField !== field) {
      return <SortAsc className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' ? 
      <SortAsc className="w-4 h-4 text-blue-600" /> : 
      <SortDesc className="w-4 h-4 text-blue-600" />
  }

  const handleWorklogClick = (worklog: JiraWorklog) => {
    setSelectedWorklog(worklog)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedWorklog(null)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Worklog Entries</h2>
          <p className="text-sm text-gray-600">
            {filteredAndSortedWorklogs.length} entries from {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d, yyyy')}
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Developers</option>
              {developers.map(developer => (
                <option key={developer} value={developer}>{developer}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('started')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Date & Time</span>
                  {getSortIcon('started')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('author')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Developer</span>
                  {getSortIcon('author')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('issueKey')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Issue</span>
                  {getSortIcon('issueKey')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('timeSpentSeconds')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Time</span>
                  {getSortIcon('timeSpentSeconds')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredAndSortedWorklogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No worklog entries found</p>
                    <p className="text-sm">Try adjusting your search or date range</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedWorklogs.map((worklog, index) => (
                <tr 
                  key={`${worklog.id}-${index}`} 
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => handleWorklogClick(worklog)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(worklog.started)}</div>
                    <div className="text-xs text-gray-500">{formatTime(worklog.started)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{worklog.author.displayName}</div>
                        <div className="text-xs text-gray-500">{worklog.author.emailAddress}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {worklog.issueKey}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={worklog.summary}>
                      {worklog.summary}
                    </div>
                                         {worklog.comment && (
                       <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={worklog.comment}>
                         &ldquo;{worklog.comment}&rdquo;
                       </div>
                     )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatHours(worklog.timeSpentSeconds)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle external link click
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {filteredAndSortedWorklogs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredAndSortedWorklogs.length} of {worklogs.length} entries</span>
            <div className="flex items-center space-x-4">
              <span>Total: {formatHours(filteredAndSortedWorklogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0))}</span>
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