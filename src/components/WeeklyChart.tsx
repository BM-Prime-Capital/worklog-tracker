'use client'

import { Clock } from 'lucide-react'

export default function WeeklyChart() {
  return (
    <div className="w-full h-80 flex items-center justify-center">
      <div className="text-center">
        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Weekly Hours Chart</h3>
        <p className="text-gray-600">
          Chart will display real worklog data from Jira API when available.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Data will be grouped by day and show hours logged per developer.
        </p>
      </div>
    </div>
  )
} 