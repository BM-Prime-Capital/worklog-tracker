'use client'

import { useState } from 'react'
import { 
  Shield, 
  Lock, 
  Key, 
  AlertTriangle,
  Clock,
  Users,
  Save,
  RefreshCw
} from 'lucide-react'
import { AdminSettings } from '@/lib/adminService'

interface SecuritySettingsTabProps {
  settings: AdminSettings['securitySettings']
  onUpdate: (settings: any) => Promise<boolean>
  isUpdating: boolean
  updateError: string | null
}

export default function SecuritySettingsTab({ 
  settings, 
  onUpdate, 
  isUpdating, 
  updateError 
}: SecuritySettingsTabProps) {
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
          <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
          <p className="text-sm text-gray-600">Configure authentication and security policies</p>
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
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{updateError}</p>
          </div>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-gray-900">Authentication</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                <p className="text-xs text-gray-500">Require 2FA for all users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.twoFactorEnabled}
                  onChange={(e) => handleInputChange('twoFactorEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Expiry (days)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={formData.passwordExpiryDays}
                onChange={(e) => handleInputChange('passwordExpiryDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Days before passwords must be changed</p>
            </div>
          </div>
        </div>

        {/* Login Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="font-medium text-gray-900">Login Security</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={formData.maxLoginAttempts}
                onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Failed attempts before account lockout</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={formData.lockoutDuration}
                onChange={(e) => handleInputChange('lockoutDuration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">How long accounts stay locked</p>
            </div>
          </div>
        </div>

        {/* Session Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="font-medium text-gray-900">Session Security</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Security Level
              </label>
              <select
                value={formData.sessionSecurity}
                onChange={(e) => handleInputChange('sessionSecurity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="maximum">Maximum</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Security level for user sessions</p>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-purple-600 mr-2" />
            <h4 className="font-medium text-gray-900">Security Status</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Security Level</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                formData.sessionSecurity === 'maximum' ? 'bg-red-100 text-red-800' :
                formData.sessionSecurity === 'high' ? 'bg-orange-100 text-orange-800' :
                formData.sessionSecurity === 'standard' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {formData.sessionSecurity.charAt(0).toUpperCase() + formData.sessionSecurity.slice(1)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">2FA Status</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                formData.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Password Policy</span>
              <span className="text-sm font-medium text-gray-900">
                {formData.passwordExpiryDays} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-medium text-blue-900 mb-3">Security Recommendations</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Enable two-factor authentication for enhanced security
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Set password expiry to 90 days or less
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Use "High" or "Maximum" session security for sensitive data
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Monitor failed login attempts regularly
          </li>
        </ul>
      </div>
    </div>
  )
}
