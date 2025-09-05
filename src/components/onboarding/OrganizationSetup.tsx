'use client'

import { useState } from 'react'
import { Building2, Users, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OrganizationSetupProps {
  onComplete: () => void
}

export default function OrganizationSetup({ onComplete }: OrganizationSetupProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    jiraOrganization: {
      organizationName: '',
      domain: '',
      email: '',
      apiToken: ''
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleNext = () => {
    console.log('🔧 handleNext called, currentStep:', currentStep, 'name:', formData.name.trim())
    console.log('🔧 Form data at step 1:', formData)
    if (currentStep === 1 && formData.name.trim()) {
      console.log('🔧 Moving to step 2 - NO FORM SUBMISSION')
      setCurrentStep(2)
      setError('')
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔧 handleSubmit called, currentStep:', currentStep, 'formData:', formData)
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create organization')
      }

      // Organization created successfully
      console.log('🔧 Organization created successfully, data:', data)
      console.log('🔧 Calling onComplete to redirect...')
      onComplete()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12 flex-col justify-between h-screen overflow-hidden">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">Worklog Tracker</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-6">
            Set up your organization
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Create your organization to start tracking team productivity and manage worklogs effectively. Connect with Jira for seamless integration.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Team Management</h3>
              <p className="text-blue-100">Invite team members and manage their access</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Time Tracking</h3>
              <p className="text-blue-100">Monitor productivity and work patterns</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Jira Integration</h3>
              <p className="text-blue-100">Connect with Jira for seamless worklog sync</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Organization Setup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStep === 1 ? 'Create Organization' : 'Jira Integration'}
            </h2>
            <p className="text-gray-600">
              {currentStep === 1 
                ? 'Let&apos;s set up your organization to get started'
                : 'Connect with Jira for seamless worklog tracking'
              }
            </p>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4 mt-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Step 1: Organization Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your organization name"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your organization"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* Step 2: Jira Integration */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  Connect your organization to Jira for seamless worklog tracking. You can skip this step and configure it later.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="jiraOrganizationName" className="block text-sm font-medium text-gray-700 mb-2">
                    Jira Organization Name
                  </label>
                  <input
                    type="text"
                    id="jiraOrganizationName"
                    value={formData.jiraOrganization.organizationName}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      jiraOrganization: { ...formData.jiraOrganization, organizationName: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Jira organization name"
                  />
                </div>

                <div>
                  <label htmlFor="jiraDomain" className="block text-sm font-medium text-gray-700 mb-2">
                    Jira Domain
                  </label>
                  <input
                    type="text"
                    id="jiraDomain"
                    value={formData.jiraOrganization.domain}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      jiraOrganization: { ...formData.jiraOrganization, domain: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="yourcompany.atlassian.net"
                  />
                </div>

                <div>
                  <label htmlFor="jiraEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Jira Email
                  </label>
                  <input
                    type="email"
                    id="jiraEmail"
                    value={formData.jiraOrganization.email}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      jiraOrganization: { ...formData.jiraOrganization, email: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your-email@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="jiraApiToken" className="block text-sm font-medium text-gray-700 mb-2">
                    Jira API Token
                  </label>
                  <input
                    type="password"
                    id="jiraApiToken"
                    value={formData.jiraOrganization.apiToken}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      jiraOrganization: { ...formData.jiraOrganization, apiToken: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Jira API token"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can find your API token in your Jira account settings under Security → API tokens
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
                >
                  <span>Back</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <span>Skip Jira</span>
                  )}
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>Create Organization</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 1 Buttons */}
          {currentStep === 1 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.name.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              You can always update these settings later in your organization preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
