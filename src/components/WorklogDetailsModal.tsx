'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Image from 'next/image'
import {
  X,
  User,
  Clock,
  Calendar,
  MessageSquare,
  ExternalLink,
  FileText,
  Tag,
  Mail,
  Download,
  Eye
} from 'lucide-react'
import { JiraWorklog } from '@/lib/jiraApiEnhanced'

interface WorklogDetailsModalProps {
  worklog: JiraWorklog | null
  isOpen: boolean
  onClose: () => void
}

export default function WorklogDetailsModal({ worklog, isOpen, onClose }: WorklogDetailsModalProps) {
  const [downloadStates, setDownloadStates] = useState<Record<string, 'idle' | 'downloading' | 'success' | 'error'>>({})

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

  // Function to detect and extract attached files from comment
  const extractAttachedFiles = (comment: string) => {
    if (!comment || comment.trim() === '') return []
    
    // Common file attachment patterns in Jira comments
    const filePatterns = [
      // Jira file attachment format: [^filename.ext^]
      /\[\^([^\]]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z|tar|gz))\]/gi,
      // Direct file links: filename.ext
      /([a-zA-Z0-9\s\-_]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z|tar|gz))/gi,
      // URL patterns for images/files
      /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z|tar|gz))/gi,
      // Jira internal file links: /secure/attachment/...
      /(\/secure\/attachment\/[^\s]+)/gi,
      // Jira download links: /secure/attachmentview/...
      /(\/secure\/attachmentview\/[^\s]+)/gi
    ]

    const files: string[] = []
    
    filePatterns.forEach(pattern => {
      const matches = comment.match(pattern)
      if (matches) {
        matches.forEach(match => {
          // Clean up the match and extract filename
          let filename = match
          if (match.startsWith('[^') && match.endsWith(']')) {
            filename = match.slice(2, -1) // Remove [^ and ]
          }
          if (!files.includes(filename)) {
            files.push(filename)
          }
        })
      }
    })

    console.log('Extracted files from comment:', files)
    return files
  }

  // Function to get Jira domain for fallback URLs
  const getJiraDomain = () => {
    // Try to get from localStorage or cookies
    if (typeof window !== 'undefined') {
      const jiraDomain = localStorage.getItem('jiraDomain') || 
                        document.cookie.split(';').find(c => c.trim().startsWith('jiraDomain='))?.split('=')[1]
      if (jiraDomain) {
        return jiraDomain
      }
    }
    
    // Fallback to a placeholder that the user can update
    return 'your-domain.atlassian.net'
  }

  // Function to construct Jira Media API URL
  const constructJiraMediaUrl = (mediaId: string) => {
    const domain = getJiraDomain()
    return `https://${domain}/rest/api/3/media/${mediaId}/binary`
  }

  // Function to extract files from Jira attachments
  const extractFilesFromAttachments = () => {
    if (!worklog.attachments || !Array.isArray(worklog.attachments)) {
      console.log('No attachments found or attachments is not an array')
      return []
    }

    console.log('Processing attachments:', worklog.attachments)
    const files: Array<{
      id: string
      filename: string
      url: string
      type: 'jira-file' | 'jira-media' | 'embedded-media' | 'text-pattern'
      mimeType?: string
      size?: number
      thumbnailUrl?: string
      fallbackUrl?: string // Added for fallback URL
    }> = []

    worklog.attachments.forEach((attachment: unknown, index: number) => {
      console.log(`Processing attachment ${index}:`, attachment)
      if (attachment && typeof attachment === 'object' && 'type' in attachment && 'data' in attachment) {
        const typedAttachment = attachment as {
          type: string
          data: {
            type?: string
            attrs?: {
              type?: string
              id?: string
              filename?: string
              alt?: string
              url?: string
              mimeType?: string
              height?: number
              width?: number
            }
            id?: string
            filename?: string
            url?: string
            domain?: string
            mimeType?: string
            size?: number
            thumbnailUrl?: string
          }
        }
        
        console.log(`Typed attachment ${index}:`, typedAttachment)
        
        if (typedAttachment.type === 'embedded-media' && typedAttachment.data) {
          const mediaData = typedAttachment.data
          if (mediaData.attrs && mediaData.attrs.id) {
            // Handle embedded media with file type
            if (mediaData.attrs.type === 'file') {
              const filename = mediaData.attrs.alt || mediaData.attrs.filename || `file-${mediaData.attrs.id}`
              const file = {
                id: mediaData.attrs.id,
                filename,
                url: `/api/jira/attachment/${mediaData.attrs.id}`, // Our API endpoint
                fallbackUrl: constructJiraMediaUrl(mediaData.attrs.id), // Jira Media API (fallback)
                type: 'embedded-media' as const,
                mimeType: mediaData.attrs.mimeType || 'application/octet-stream'
              }
              files.push(file)
              console.log(`Added embedded file:`, file)
            } else if (mediaData.attrs.type === 'image') {
              // Handle embedded images
              const filename = mediaData.attrs.alt || mediaData.attrs.filename || `image-${mediaData.attrs.id}`
              const file = {
                id: mediaData.attrs.id,
                filename,
                url: `/api/jira/attachment/${mediaData.attrs.id}`, // Our API endpoint
                fallbackUrl: constructJiraMediaUrl(mediaData.attrs.id), // Jira Media API (fallback)
                type: 'embedded-media' as const,
                mimeType: 'image/png' // Default to PNG for screenshots
              }
              files.push(file)
              console.log(`Added embedded image:`, file)
            }
          }
        } else if (typedAttachment.type === 'jira-file' && typedAttachment.data) {
          const fileData = typedAttachment.data
          if (fileData.id && fileData.filename) {
            const file = {
              id: fileData.id,
              filename: fileData.filename,
              url: fileData.url || `/api/jira/attachment/${fileData.id}`,
              type: 'jira-file' as const,
              mimeType: fileData.mimeType,
              size: fileData.size,
              thumbnailUrl: fileData.thumbnailUrl
            }
            files.push(file)
            console.log(`Added jira-file:`, file)
          }
        } else if (typedAttachment.type === 'jira-media' && typedAttachment.data) {
          const mediaData = typedAttachment.data
          if (mediaData.id && mediaData.filename) {
            const file = {
              id: mediaData.id,
              filename: mediaData.filename,
              url: mediaData.url || `/api/jira/attachment/${mediaData.id}`,
              type: 'jira-media' as const,
              mimeType: mediaData.mimeType,
              size: mediaData.size,
              thumbnailUrl: mediaData.thumbnailUrl
            }
            files.push(file)
            console.log(`Added jira-media:`, file)
          }
        }
      } else {
        console.log(`Attachment ${index} doesn't have expected structure:`, attachment)
      }
    })

    console.log('Final extracted files from attachments:', files)
    return files
  }

  // Function to get all files (from attachments and comment text)
  const getAllFiles = () => {
    const attachmentFiles = extractFilesFromAttachments()
    const commentFiles = extractAttachedFiles(worklog.comment || '').map(filename => ({
      id: `comment-${filename}`,
      filename,
      url: filename.startsWith('http') ? filename : '',
      type: 'text-pattern' as const
    }))

    console.log('Attachment files:', attachmentFiles)
    console.log('Comment files:', commentFiles)

    // Combine and deduplicate files
    const allFiles = [...attachmentFiles, ...commentFiles]
    const uniqueFiles = allFiles.filter((file, index, self) => 
      index === self.findIndex(f => f.filename === file.filename)
    )

    console.log('Combined all files:', allFiles)
    console.log('Final unique files:', uniqueFiles)
    return uniqueFiles
  }

  // Function to check if a file is an image
  const isImageFile = (filename: string) => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff']
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
  }

  // Function to get file type icon and color
  const getFileTypeInfo = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop() || ''
    
    if (isImageFile(filename)) {
      return { icon: '🖼️', color: 'text-green-500', bgColor: 'bg-green-100' }
    } else if (['pdf'].includes(ext)) {
      return { icon: '📄', color: 'text-red-500', bgColor: 'bg-red-100' }
    } else if (['doc', 'docx'].includes(ext)) {
      return { icon: '📝', color: 'text-blue-500', bgColor: 'bg-blue-100' }
    } else if (['xls', 'xlsx'].includes(ext)) {
      return { icon: '📊', color: 'text-green-500', bgColor: 'bg-green-100' }
    } else if (['ppt', 'pptx'].includes(ext)) {
      return { icon: '📋', color: 'text-orange-500', bgColor: 'bg-orange-100' }
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: '📦', color: 'text-purple-500', bgColor: 'bg-purple-100' }
    } else {
      return { icon: '📎', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    }
  }

  // Function to render file attachment with better visual representation
  const renderFileAttachment = (file: {
    id: string
    filename: string
    url: string
    type: 'jira-file' | 'jira-media' | 'embedded-media' | 'text-pattern'
    mimeType?: string
    size?: number
    thumbnailUrl?: string
    fallbackUrl?: string // Added for fallback URL
  }) => {
    const isImage = isImageFile(file.filename)
    const isUrl = file.url.startsWith('http')
    const fileTypeInfo = getFileTypeInfo(file.filename)
    const downloadState = downloadStates[file.id] || 'idle'
    
    const handleFileClick = () => {
      if (isUrl) {
        // Open URL in new tab
        window.open(file.url, '_blank')
      } else {
        // For local files, show download or preview
        console.log('File clicked:', file.filename)
        // TODO: Implement file preview or download logic
      }
    }

    const handleDownload = async () => {
      try {
        setDownloadStates(prev => ({ ...prev, [file.id]: 'downloading' }))
        console.log('Downloading file:', file.filename)
        
        // Try our proxy endpoint first
        const response = await fetch(file.url)
        if (response.ok) {
          // Create blob and download
          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = file.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)
          console.log('File downloaded successfully')
          
          setDownloadStates(prev => ({ ...prev, [file.id]: 'success' }))
          // Reset success state after 2 seconds
          setTimeout(() => {
            setDownloadStates(prev => ({ ...prev, [file.id]: 'idle' }))
          }, 2000)
        } else {
          // Fallback to direct Jira URL if proxy fails
          console.log('Proxy failed, trying fallback URL')
          if (file.fallbackUrl) {
            window.open(file.fallbackUrl, '_blank')
            setDownloadStates(prev => ({ ...prev, [file.id]: 'success' }))
            setTimeout(() => {
              setDownloadStates(prev => ({ ...prev, [file.id]: 'idle' }))
            }, 2000)
          } else {
            throw new Error('No fallback URL available')
          }
        }
      } catch (error) {
        console.error('Download failed:', error)
        setDownloadStates(prev => ({ ...prev, [file.id]: 'error' }))
        // Reset error state after 3 seconds
        setTimeout(() => {
          setDownloadStates(prev => ({ ...prev, [file.id]: 'idle' }))
        }, 3000)
        // Show error message to user
        alert(`Failed to download ${file.filename}. Please try the direct link instead.`)
      }
    }
    
    return (
      <div key={file.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
        <div className="flex items-center space-x-2 mb-2">
          <span className={`text-lg ${fileTypeInfo.color}`}>{fileTypeInfo.icon}</span>
          <span className="text-sm font-medium text-gray-700 truncate flex-1">{file.filename}</span>
        </div>
        
        {isImage && isUrl ? (
          <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-center min-h-[120px] relative group">
            <div className="relative w-full h-full">
              <Image
                src={file.url}
                alt={file.filename}
                width={200}
                height={120}
                className="rounded-lg object-cover w-full h-full"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'block'
                }}
              />
              <div 
                className="hidden absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-colors"
                onClick={handleFileClick}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 ${fileTypeInfo.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-3xl">{fileTypeInfo.icon}</span>
                  </div>
                  <p className="text-xs text-gray-500">Image Preview</p>
                  <p className="text-xs text-gray-400">Click to view full size</p>
                </div>
              </div>
            </div>
            {/* Download button overlay */}
            <button 
              className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
              title="Download image"
              disabled={downloadState === 'downloading'}
            >
              {downloadState === 'downloading' ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                  DL...
                </span>
              ) : downloadState === 'success' ? (
                <span className="text-green-300">✓</span>
              ) : downloadState === 'error' ? (
                <span className="text-red-300">✗</span>
              ) : (
                'Download'
              )}
            </button>
          </div>
        ) : isImage ? (
          <div 
            className={`${fileTypeInfo.bgColor} rounded-lg p-4 flex items-center justify-center min-h-[120px] cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={handleFileClick}
          >
            <div className="text-center">
              <div className={`w-16 h-16 ${fileTypeInfo.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <span className="text-3xl">{fileTypeInfo.icon}</span>
              </div>
              <p className="text-xs text-gray-500">Attached Image</p>
              <p className="text-xs text-gray-400">Click to view</p>
              {file.fallbackUrl && (
                <p className="text-xs text-blue-600 mt-1">Has fallback URL</p>
              )}
              <button 
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => {
                  e.stopPropagation() // Prevent triggering the parent click
                  handleDownload()
                }}
                disabled={downloadState === 'downloading'}
              >
                {downloadState === 'downloading' ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                    Downloading...
                  </span>
                ) : downloadState === 'success' ? (
                  <span className="text-green-600">✓ Downloaded</span>
                ) : downloadState === 'error' ? (
                  <span className="text-red-600">✗ Failed</span>
                ) : (
                  'Download Image'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className={`${fileTypeInfo.bgColor} rounded-lg p-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Document/File</span>
              <div className="flex space-x-2">
                <button 
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDownload}
                  disabled={downloadState === 'downloading'}
                >
                  {downloadState === 'downloading' ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                      Downloading...
                    </span>
                  ) : downloadState === 'success' ? (
                    <span className="text-green-600">✓ Downloaded</span>
                  ) : downloadState === 'error' ? (
                    <span className="text-red-600">✗ Failed</span>
                  ) : (
                    'Download'
                  )}
                </button>
                {file.fallbackUrl && (
                  <button 
                    className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors"
                    onClick={() => window.open(file.fallbackUrl, '_blank')}
                  >
                    Direct Link
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0  z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
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
                      <p className="text-lg font-bold text-gray-900 mt-1 leading-tight">{worklog.summary}</p>
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

              {/* Deliverables Section */}
              {getAllFiles().length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Deliverables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getAllFiles().map(file => renderFileAttachment(file))}
                  </div>
                </div>
              )}
              
              {/* Debug Section - Remove this after testing */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Debug Info</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Comment:</strong> {worklog.comment || 'No comment'}</p>
                  <p><strong>Attachments:</strong> {JSON.stringify(worklog.attachments, null, 2)}</p>
                  <p><strong>Files from attachments:</strong> {extractFilesFromAttachments().length}</p>
                  <p><strong>Files from comment:</strong> {extractAttachedFiles(worklog.comment || '').length}</p>
                  <p><strong>Total files:</strong> {getAllFiles().length}</p>
                  <p><strong>All files:</strong> {JSON.stringify(getAllFiles(), null, 2)}</p>
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-800 font-medium">File Display Notes:</p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Images with valid URLs will display using Next.js Image component</li>
                      <li>• Files without URLs show placeholder with download button</li>
                      <li>• Fallback URLs are available for direct Jira access</li>
                      <li>• Check browser console for detailed extraction logs</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-800 font-medium">Jira Media API Setup:</p>
                    <ul className="text-xs text-green-700 mt-1 space-y-1">
                      <li>• Files are served via our proxy: <code>/api/jira/attachment/&#123;id&#125;</code></li>
                      <li>• Fallback URLs use Jira Media API: <code>/rest/api/3/media/&#123;id&#125;/binary</code></li>
                      <li>• Set your Jira domain in localStorage: <code>jiraDomain</code></li>
                      <li>• Current domain: <code>{getJiraDomain()}</code></li>
                    </ul>
                    <div className="mt-2 flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="your-domain.atlassian.net"
                        defaultValue={getJiraDomain()}
                        className="text-xs px-2 py-1 border border-green-300 rounded"
                        onBlur={(e) => {
                          const domain = e.target.value.trim()
                          if (domain && domain !== 'your-domain.atlassian.net') {
                            localStorage.setItem('jiraDomain', domain)
                            console.log('Jira domain set to:', domain)
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const domain = prompt('Enter your Jira domain (e.g., yourcompany.atlassian.net):')
                          if (domain && domain.trim()) {
                            localStorage.setItem('jiraDomain', domain.trim())
                            window.location.reload() // Refresh to update the display
                          }
                        }}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Set Domain
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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
