'use client'

import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  value: string
  onChange: (value: string) => void
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center space-x-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-200 bg-white/80 backdrop-blur-sm"
      >
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="this-week">This Week</option>
        <option value="last-week">Last Week</option>
        <option value="this-month">This Month</option>
        <option value="last-month">Last Month</option>
        <option value="custom">Custom Range</option>
      </select>
    </div>
  )
} 