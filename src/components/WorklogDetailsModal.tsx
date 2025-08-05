'use client'

import { useEffect } from 'react'
import { format } from 'date-fns'
import { 
  X, 
  User, 
  Clock, 
  Calendar, 
  MessageSquare, 
  ExternalLink, 
  FileText,
  Tag,
  Mail
} from 'lucide-react'
import { JiraWorklog } from '@/lib/jiraApiEnhanced'

interface WorklogDetailsModalProps {
  worklog: JiraWorklog | null
  isOpen: boolean
  onClose: () => void
}

export default function WorklogDetailsModal({ worklog, isOpen, onClose }: WorklogDetailsModalProps) {
  console.log("worklog", worklog)
  console.log("worklog comment:", worklog?.comment)
  console.log("worklog comment type:", typeof worklog?.comment)
  console.log("worklog comment length:", worklog?.comment?.length)
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !worklog) {
    return null
  }

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600
    return `${Math.round(hours * 100) / 100}h`
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Worklog Details</h2>
                <p className="text-sm text-gray-600">Issue: {worklog.issueKey}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {/* Issue Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Issue Information</h3>
                  <button className="flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View in Jira
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">Issue Key:</span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {worklog.issueKey}
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Issue title:</span>
                      <p className="text-sm text-gray-700 mt-1">{worklog.summary}</p>
                    </div>
                  </div>
                  {worklog.comment && worklog.comment.trim() !== '' && (
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Work summary:</span>
                        <p className="text-sm text-gray-700 mt-1">{worklog.comment}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Time Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Time Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Time Spent</p>
                      <p className="text-lg font-semibold text-blue-600">{formatHours(worklog.timeSpentSeconds)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Started</p>
                      <p className="text-sm text-gray-700">{formatDateTime(worklog.started)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Author Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Author Information</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {getInitials(worklog.author.displayName)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{worklog.author.displayName}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{worklog.author.emailAddress}</span>
                    </div>
                    {worklog.author.accountId && (
                      <p className="text-xs text-gray-500 mt-1">Account ID: {worklog.author.accountId}</p>
                    )}
                  </div>
                  <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    <User className="w-4 h-4 mr-1" />
                    View Profile
                  </button>
                </div>
              </div>

              {/* Summary Section */}
              {worklog.comment && worklog.comment.trim() !== '' && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {worklog.comment}
                    </p>
                  </div>
                </div>
              )}


              {/* Additional Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Worklog ID:</span>
                    <p className="text-gray-700 mt-1">{worklog.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Issue ID:</span>
                    <p className="text-gray-700 mt-1">{worklog.issueId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Date Created:</span>
                    <p className="text-gray-700 mt-1">{formatDate(worklog.started)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Time Started:</span>
                    <p className="text-gray-700 mt-1">{formatTime(worklog.started)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="text-sm text-gray-600">
              Last updated: {formatDateTime(worklog.started)}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <ExternalLink className="w-4 h-4 mr-2 inline" />
                Open in Jira
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 