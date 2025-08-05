'use client'

import { useState } from 'react'
import { 
  Mail, 
  Clock, 
  Globe, 
  Building, 
  Phone, 
  Star, 
  StarOff, 
  MoreVertical,
  User,
  Calendar,
  Activity
} from 'lucide-react'

interface TeamMemberCardProps {
  member: {
    accountId: string
    displayName: string
    emailAddress: string
    active: boolean
    timeZone: string
    avatar?: string
    team?: string
    role?: string
    lastActive?: string
    status: 'online' | 'offline' | 'away'
    isFavorite?: boolean
  }
  onFavoriteToggle?: (memberId: string) => void
  onContact?: (memberId: string) => void
  variant?: 'compact' | 'detailed'
}

export default function TeamMemberCard({ 
  member, 
  onFavoriteToggle, 
  onContact, 
  variant = 'detailed' 
}: TeamMemberCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      case 'offline': return 'Offline'
      default: return 'Unknown'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'away': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {member.avatar || member.displayName.charAt(0)}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{member.displayName}</h3>
            <p className="text-xs text-gray-500 truncate">{member.role || 'Developer'}</p>
          </div>
          <div className="flex items-center space-x-1">
            {onFavoriteToggle && (
              <button
                onClick={() => onFavoriteToggle(member.accountId)}
                className="text-gray-400 hover:text-yellow-500 transition-colors"
              >
                {member.isFavorite ? (
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(member.status)}`}>
            {getStatusText(member.status)}
          </span>
          {member.lastActive && (
            <span className="text-xs text-gray-500">{member.lastActive}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {member.avatar || member.displayName.charAt(0)}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{member.displayName}</h3>
            <p className="text-sm text-gray-600">{member.role || 'Developer'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onFavoriteToggle && (
            <button
              onClick={() => onFavoriteToggle(member.accountId)}
              className="text-gray-400 hover:text-yellow-500 transition-colors"
            >
              {member.isFavorite ? (
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="w-5 h-5" />
              )}
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onContact?.(member.accountId)
                      setShowMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Mail className="w-4 h-4 mr-3" />
                    Send Message
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4 mr-3" />
                    View Profile
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Calendar className="w-4 h-4 mr-3" />
                    View Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span className="truncate">{member.emailAddress}</span>
        </div>
        {member.team && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            <span>{member.team}</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Globe className="w-4 h-4" />
          <span>{member.timeZone}</span>
        </div>
        {member.lastActive && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{member.lastActive}</span>
          </div>
        )}
      </div>

      {/* Status and Actions */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(member.status)}`}>
            <Activity className="w-3 h-3 mr-1" />
            {getStatusText(member.status)}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onContact?.(member.accountId)}
              className="flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Mail className="w-3 h-3 mr-1" />
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 