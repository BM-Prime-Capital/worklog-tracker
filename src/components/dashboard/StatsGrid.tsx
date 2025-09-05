'use client'

import { LucideIcon } from 'lucide-react'

export interface StatItem {
  title: string
  value: string
  icon: LucideIcon
  color: string
  bgColor: string
  change?: {
    value: string
    isPositive: boolean
  }
}

interface StatsGridProps {
  stats: StatItem[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center mt-2">
                    <span
                      className={`text-sm font-medium ${
                        stat.change.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change.isPositive ? '+' : ''}{stat.change.value}
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}





