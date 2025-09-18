'use client'

import { useState } from 'react'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Save,
  RefreshCw,
  Shield,
  Key
} from 'lucide-react'

interface PasswordSettingsTabProps {
  onUpdate: (passwordData: any) => Promise<boolean>
  isUpdating: boolean
  updateError: string | null
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function PasswordSettingsTab({ 
  onUpdate, 
  isUpdating, 
  updateError 
}: PasswordSettingsTabProps) {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  })
  const [hasChanges, setHasChanges] = useState(false)

  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    
    // Validate password strength
    if (field === 'newPassword') {
      validatePassword(value)
    }
    
    // Check if passwords match
    if (field === 'confirmPassword' || field === 'newPassword') {
      setValidation(prev => ({
        ...prev,
        match: field === 'confirmPassword' ? value === formData.newPassword : value === formData.confirmPassword
      }))
    }
    
    setHasChanges(
      newData.currentPassword.length > 0 || 
      newData.newPassword.length > 0 || 
      newData.confirmPassword.length > 0
    )
  }

  const validatePassword = (password: string) => {
    setValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password === formData.confirmPassword
    })
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSave = async () => {
    if (!isFormValid()) return
    
    const success = await onUpdate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    })
    
    if (success) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setHasChanges(false)
      setValidation({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        match: false
      })
    }
  }

  const handleReset = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setHasChanges(false)
    setValidation({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
      match: false
    })
  }

  const isFormValid = () => {
    return (
      formData.currentPassword.length > 0 &&
      formData.newPassword.length > 0 &&
      formData.confirmPassword.length > 0 &&
      Object.values(validation).every(Boolean)
    )
  }

  const getPasswordStrength = () => {
    const validCount = Object.values(validation).filter(Boolean).length
    if (validCount <= 2) return { level: 'weak', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (validCount <= 4) return { level: 'medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { level: 'strong', color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const strength = getPasswordStrength()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Password Settings</h3>
          <p className="text-sm text-gray-600">Update your password and security settings</p>
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
              disabled={!isFormValid() || isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Password
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

      {/* Password Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-gray-900">Current Password</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter your current password to verify your identity</p>
            </div>
          </div>
        </div>

        {/* New Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="font-medium text-gray-900">New Password</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-purple-600 mr-2" />
            <h4 className="font-medium text-gray-900">Password Requirements</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${validation.length ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={`text-sm ${validation.length ? 'text-green-700' : 'text-gray-500'}`}>
                At least 8 characters long
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${validation.uppercase ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={`text-sm ${validation.uppercase ? 'text-green-700' : 'text-gray-500'}`}>
                Contains uppercase letter
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${validation.lowercase ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={`text-sm ${validation.lowercase ? 'text-green-700' : 'text-gray-500'}`}>
                Contains lowercase letter
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${validation.number ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={`text-sm ${validation.number ? 'text-green-700' : 'text-gray-500'}`}>
                Contains number
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${validation.special ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={`text-sm ${validation.special ? 'text-green-700' : 'text-gray-500'}`}>
                Contains special character
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${validation.match ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={`text-sm ${validation.match ? 'text-green-700' : 'text-gray-500'}`}>
                Passwords match
              </span>
            </div>
          </div>
        </div>

        {/* Password Strength */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-orange-600 mr-2" />
            <h4 className="font-medium text-gray-900">Password Strength</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Strength Level</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${strength.bgColor} ${strength.color}`}>
                {strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  strength.level === 'weak' ? 'bg-red-500 w-1/3' :
                  strength.level === 'medium' ? 'bg-yellow-500 w-2/3' :
                  'bg-green-500 w-full'
                }`}
              ></div>
            </div>
            
            <div className="text-xs text-gray-500">
              {strength.level === 'weak' && 'Password is too weak. Please add more characters and variety.'}
              {strength.level === 'medium' && 'Password is moderately strong. Consider adding more complexity.'}
              {strength.level === 'strong' && 'Password is strong and secure.'}
            </div>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-medium text-blue-900 mb-3">Security Tips</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Use a unique password that you haven't used elsewhere
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Consider using a password manager to generate and store secure passwords
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Change your password regularly, especially if you suspect it may have been compromised
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            Never share your password with anyone or write it down in an insecure location
          </li>
        </ul>
      </div>
    </div>
  )
}
