'use client'

import { useState } from 'react'
import { 
  Plug, 
  Mail, 
  Slack, 
  BarChart3, 
  Database,
  AlertCircle,
  CheckCircle,
  Save,
  RefreshCw
} from 'lucide-react'
import { AdminSettings } from '@/lib/adminService'

interface IntegrationSettingsTabProps {
  settings: AdminSettings['integrationSettings']
  onUpdate: (settings: any) => Promise<boolean>
  isUpdating: boolean
  updateError: string | null
}

export default function IntegrationSettingsTab({ 
  settings, 
  onUpdate, 
  isUpdating, 
  updateError 
}: IntegrationSettingsTabProps) {
  const [formData, setFormData] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)

  const handleInputChange = (field: keyof typeof settings, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    setHasChanges(JSON.stringify(newData) !== JSON.stringify(settings))
  }

  const handleSave = async () => {
    const success = await onUpdate(formData)
    if (success) {
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    setFormData(settings)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Integration Settings</h3>
          <p className="text-sm text-gray-600">Configure third-party integrations and services</p>
        </div>
        {hasChanges && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {updateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{updateError}</p>
          </div>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jira Integration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Plug className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-gray-900">Jira Integration</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Jira Integration</label>
                <p className="text-xs text-gray-500">Enable Jira project management integration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.jiraIntegration}
                  onChange={(e) => handleInputChange('jiraIntegration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {formData.jiraIntegration && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">Jira integration is active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slack Integration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Slack className="w-5 h-5 text-purple-600 mr-2" />
            <h4 className="font-medium text-gray-900">Slack Integration</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Slack Integration</label>
                <p className="text-xs text-gray-500">Enable Slack notifications and updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.slackIntegration}
                  onChange={(e) => handleInputChange('slackIntegration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {formData.slackIntegration && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  <span className="text-sm text-purple-800">Slack integration is active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Service */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Mail className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="font-medium text-gray-900">Email Service</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Service Provider
              </label>
              <select
                value={formData.emailService}
                onChange={(e) => handleInputChange('emailService', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
                <option value="ses">Amazon SES</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose your email service provider</p>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-orange-600 mr-2" />
            <h4 className="font-medium text-gray-900">Analytics</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Analytics Enabled</label>
                <p className="text-xs text-gray-500">Collect usage analytics and metrics</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.analyticsEnabled}
                  onChange={(e) => handleInputChange('analyticsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="font-medium text-gray-900">Backup</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Backup Enabled</label>
                <p className="text-xs text-gray-500">Automated data backup and recovery</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.backupEnabled}
                  onChange={(e) => handleInputChange('backupEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Plug className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="font-medium text-gray-900">Integration Status</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Jira</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                formData.jiraIntegration ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.jiraIntegration ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Slack</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                formData.slackIntegration ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.slackIntegration ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Service</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {formData.emailService.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Analytics</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                formData.analyticsEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.analyticsEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Backup</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                formData.backupEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.backupEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-medium text-blue-900 mb-3">Integration Setup</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Jira:</strong> Configure your Jira domain and API credentials in the organization settings</p>
          <p>• <strong>Slack:</strong> Set up webhook URLs and channel configurations for notifications</p>
          <p>• <strong>Email:</strong> Configure SMTP settings or API keys for your chosen email service</p>
          <p>• <strong>Analytics:</strong> Enable to collect usage data and performance metrics</p>
          <p>• <strong>Backup:</strong> Set up automated backups to prevent data loss</p>
        </div>
      </div>
    </div>
  )
}
