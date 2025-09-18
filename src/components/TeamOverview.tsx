'use client'

import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Developer } from '@/lib/types'
import { formatHours } from '@/lib/timeUtils'

interface TeamOverviewProps {
  developers: Developer[]
  isLoading: boolean
}

export default function TeamOverview({ developers, isLoading }: TeamOverviewProps) {
  const totalHours = developers.reduce((sum, dev) => sum + dev.hours, 0)
  const totalTasks = developers.reduce((sum, dev) => sum + dev.tasks, 0)
  const averageHours = developers.length > 0 ? totalHours / developers.length : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Overview</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">Active Developers</span>
            </div>
            <span className="text-lg font-semibold text-blue-600">{developers.length}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-700">Total Hours</span>
            </div>
            <span className="text-lg font-semibold text-green-600">{formatHours(totalHours)}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm text-gray-700">Tasks Worked On</span>
            </div>
            <span className="text-lg font-semibold text-yellow-600">{totalTasks}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm text-gray-700">Average Hours</span>
            </div>
            <span className="text-lg font-semibold text-purple-600">{formatHours(averageHours)}</span>
          </div>
        </div>
      )}
    </div>
  )
} 