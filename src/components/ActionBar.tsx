'use client'

import { ActionConfig } from '@/lib/roleBasedActions'
import DateRangePicker from './DateRangePicker'

interface ActionBarProps {
  actions: ActionConfig[]
  selectedDateRange?: string
  onDateRangeChange?: (range: string) => void
  className?: string
}

export default function ActionBar({ 
  actions, 
  selectedDateRange, 
  onDateRangeChange, 
  className = '' 
}: ActionBarProps) {
  const renderAction = (action: ActionConfig) => {
    // Special handling for date range picker
    if (action.key === 'dateRangePicker') {
      return (
        <DateRangePicker 
          key={action.key}
          value={selectedDateRange || 'this-week'} 
          onChange={onDateRangeChange || (() => {})} 
        />
      )
    }

    // Regular action buttons
    const Icon = action.icon
    return (
      <button
        key={action.key}
        onClick={action.onClick}
        disabled={action.disabled}
        className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium ${
          action.className || 'bg-gray-600 text-white hover:bg-gray-700'
        } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={action.tooltip}
      >
        <Icon className="w-4 h-4 mr-2" />
        {action.label}
      </button>
    )
  }

  if (!actions || actions.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {actions.map(renderAction)}
    </div>
  )
}




