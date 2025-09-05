'use client'

import { LucideIcon } from 'lucide-react'

export interface QuickAction {
  label: string
  icon: LucideIcon
  variant?: 'primary' | 'secondary' | 'outline'
  onClick: () => void
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  const getButtonClasses = (variant: QuickAction['variant'] = 'outline') => {
    const baseClasses = "flex items-center justify-center p-4 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`
      case 'secondary':
        return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`
      case 'outline':
      default:
        return `${baseClasses} bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50`
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <button
            key={index}
            onClick={action.onClick}
            className={getButtonClasses(action.variant)}
          >
            <div className="text-center">
              <Icon className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">{action.label}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}





