'use client'

import { Clock, Users, FileText, Calendar } from 'lucide-react'
import { formatHours } from '@/lib/timeUtils'

interface WorklogStatsProps {
  totalHours: number
  totalEntries: number
  uniqueDevelopers: number
  uniqueIssues: number
  isLoading: boolean
}

export default function WorklogStats({ 
  totalHours, 
  totalEntries, 
  uniqueDevelopers, 
  uniqueIssues, 
  isLoading 
}: WorklogStatsProps) {
  // Using formatHours from timeUtils for better UX

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Hours</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatHours(totalHours)}</p>
            <p className="text-xs text-gray-500 mt-1">Time logged</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Total Entries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Entries</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalEntries}</p>
            <p className="text-xs text-gray-500 mt-1">Worklog entries</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Unique Developers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Developers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{uniqueDevelopers}</p>
            <p className="text-xs text-gray-500 mt-1">Active contributors</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Unique Issues */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Issues</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{uniqueIssues}</p>
            <p className="text-xs text-gray-500 mt-1">Tasks worked on</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  )
} 