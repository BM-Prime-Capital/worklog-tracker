import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  description: string
  isLoading?: boolean
}

export default function StatsCard({ title, value, change, changeType, icon: Icon, description, isLoading = false }: StatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 bg-green-50'
      case 'negative':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getChangeIcon = () => {
    if (changeType === 'positive') return '↗'
    if (changeType === 'negative') return '↘'
    return '→'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? '...' : value}
          </p>
          <div className="flex items-center mt-2">
            {isLoading ? (
              <span className="text-xs text-gray-500">Loading...</span>
            ) : (
              <>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeColor()}`}>
                  <span className="mr-1">{getChangeIcon()}</span>
                  {change}
                </span>
                <span className="text-xs text-gray-500 ml-2">{description}</span>
              </>
            )}
          </div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  )
} 