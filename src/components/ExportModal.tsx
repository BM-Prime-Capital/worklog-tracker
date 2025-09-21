'use client'

import { useState } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { Calendar, Download, X, AlertCircle, CheckCircle } from 'lucide-react'
import { JiraWorklog } from '@/lib/jiraApiEnhanced'
import { formatHours } from '@/lib/timeUtils'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  worklogs: JiraWorklog[]
  onExport: (options: ExportOptions) => Promise<void>
}

interface ExportOptions {
  startDate: Date
  endDate: Date
  includeIndividualReports: boolean
  exportTimestamp: Date
}

export default function ExportModal({ isOpen, onClose, worklogs, onExport }: ExportModalProps) {
  const [exportType, setExportType] = useState<'team' | 'individual' | 'both'>('both')
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'custom'>('week')
  const [customStartDate, setCustomStartDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  const [customEndDate, setCustomEndDate] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Helper function to get Saturday of the week for a given date
  const getSaturdayOfWeek = (date: Date): Date => {
    const startOfWeekDate = startOfWeek(date, { weekStartsOn: 1 })
    return addDays(startOfWeekDate, 5) // Saturday is 5 days after Monday
  }

  if (!isOpen) return null

  const getPeriodDates = () => {
    const now = new Date()
    
    switch (periodType) {
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        }
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        }
      case 'custom':
        return {
          start: new Date(customStartDate),
          end: new Date(customEndDate)
        }
      default:
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        }
    }
  }

  const getPeriodLabel = () => {
    const { start, end } = getPeriodDates()
    
    switch (periodType) {
      case 'week':
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
      case 'month':
        return format(start, 'MMMM yyyy')
      case 'custom':
        return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
      default:
        return ''
    }
  }

  const getFilteredWorklogs = () => {
    const { start, end } = getPeriodDates()
    const startTime = start.getTime()
    const endTime = end.getTime()
    
    return worklogs.filter(worklog => {
      const worklogTime = new Date(worklog.started).getTime()
      return worklogTime >= startTime && worklogTime <= endTime
    })
  }

  const getReportSummary = () => {
    const filteredWorklogs = getFilteredWorklogs()
    const totalHours = filteredWorklogs.reduce((total, w) => total + (w.timeSpentSeconds / 3600), 0)
    const uniqueDevelopers = new Set(filteredWorklogs.map(w => w.author.displayName)).size
    const uniqueIssues = new Set(filteredWorklogs.map(w => w.issueKey)).size
    
    return {
      totalHours: formatHours(totalHours),
      totalDevelopers: uniqueDevelopers,
      totalIssues: uniqueIssues,
      totalEntries: filteredWorklogs.length
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportStatus('idle')
      
      const { start, end } = getPeriodDates()
      
      const exportOptions: ExportOptions = {
        startDate: start,
        endDate: end,
        includeIndividualReports: exportType === 'individual' || exportType === 'both',
        exportTimestamp: new Date()
      }
      
      await onExport(exportOptions)
      setExportStatus('success')
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
        setExportStatus('idle')
      }, 2000)
      
    } catch (error) {
      console.error('Export failed:', error)
      setExportStatus('error')
    } finally {
      setIsExporting(false)
    }
  }

  const summary = getReportSummary()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Export Worklog Report</h2>
                <p className="text-sm text-gray-600">Generate PDF report for your team</p>
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
              {/* Report Type Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Report Type</h3>
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="exportType"
                      value="team"
                      checked={exportType === 'team'}
                      onChange={(e) => setExportType(e.target.value as 'team' | 'individual' | 'both')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Team Overview Only</div>
                      <div className="text-sm text-gray-500">Summary statistics and team member list</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="exportType"
                      value="individual"
                      checked={exportType === 'individual'}
                      onChange={(e) => setExportType(e.target.value as 'team' | 'individual' | 'both')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Individual Reports Only</div>
                      <div className="text-sm text-gray-500">Detailed worklog entries for each developer</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="exportType"
                      value="both"
                      checked={exportType === 'both'}
                      onChange={(e) => setExportType(e.target.value as 'team' | 'individual' | 'both')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Complete Report</div>
                      <div className="text-sm text-gray-500">Team overview + individual developer reports</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Period Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Report Period</h3>
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="periodType"
                      value="week"
                      checked={periodType === 'week'}
                      onChange={(e) => setPeriodType(e.target.value as 'week' | 'month' | 'custom')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Current Week (Monday - Saturday)</div>
                      <div className="text-sm text-gray-500">Most recent complete work week</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="periodType"
                      value="month"
                      checked={periodType === 'month'}
                      onChange={(e) => setPeriodType(e.target.value as 'week' | 'month' | 'custom')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Current Month</div>
                      <div className="text-sm text-gray-500">From first to last day of current month</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="periodType"
                      value="custom"
                      checked={periodType === 'custom'}
                      onChange={(e) => setPeriodType(e.target.value as 'week' | 'month' | 'custom')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Custom Period</div>
                      <div className="text-sm text-gray-500">Select start date, end date automatically sets to Saturday of that week</div>
                    </div>
                  </label>
                </div>

                {/* Custom Date Inputs */}
                {periodType === 'custom' && (
                  <div className="ml-7 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => {
                            setCustomStartDate(e.target.value);
                            const start = new Date(e.target.value);
                            const end = getSaturdayOfWeek(start); // Set end date to Saturday of the same week
                            setCustomEndDate(format(end, 'yyyy-MM-dd'));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                      💡 <strong>Smart Date Selection:</strong> When you select a start date, the end date automatically sets to Saturday of that same week. 
                      You can manually adjust the end date if needed.
                    </div>
                  </div>
                )}
              </div>

              {/* Report Preview */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-3">Report Preview</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span><strong>Period:</strong> {getPeriodLabel()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong>Total Hours:</strong> {summary.totalHours}</div>
                    <div><strong>Developers:</strong> {summary.totalDevelopers}</div>
                    <div><strong>Issues:</strong> {summary.totalIssues}</div>
                    <div><strong>Entries:</strong> {summary.totalEntries}</div>
                  </div>
                </div>
              </div>

              {/* Export Warning */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Data Relevance Notice</p>
                    <p className="mt-1">
                      This report will include an export timestamp to show when it was generated. 
                      Team members may continue working after the report is created, so the data 
                      represents a snapshot in time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center space-x-3">
              {exportStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Export successful!</span>
                </div>
              )}
              {exportStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Export failed. Please try again.</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || summary.totalEntries === 0}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 