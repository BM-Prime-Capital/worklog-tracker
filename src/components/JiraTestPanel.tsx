'use client'

import { useState } from 'react'
import { jiraApiEnhanced as jiraApi } from '@/lib/jiraApiEnhanced'
import { Loader2, CheckCircle, XCircle, RefreshCw, FileText, Users, FolderOpen } from 'lucide-react'

export default function JiraTestPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<{
    connection: boolean | null
    projects: any[] | null
    issues: any[] | null
    users: any[] | null
    error: string | null
  }>({
    connection: null,
    projects: null,
    issues: null,
    users: null,
    error: null
  })

  const runTests = async () => {
    setIsLoading(true)
    setTestResults({
      connection: null,
      projects: null,
      issues: null,
      users: null,
      error: null
    })

    try {
      // Test 1: Connection
      console.log('Testing Jira connection...')
      const connectionTest = await jiraApi.testConnection()
      console.log('Connection test result:', connectionTest)

      if (!connectionTest) {
        throw new Error('Failed to connect to Jira')
      }

      // Test 2: Get Projects
      console.log('Fetching projects...')
      const projects = await jiraApi.getProjects()
      console.log('Projects:', projects)

      // Test 3: Get Issues (recent ones)
      console.log('Fetching recent issues...')
      const issues = await jiraApi.getIssues(undefined, 10)
      console.log('Issues:', issues)

      // Test 4: Get Users
      console.log('Fetching users...')
      const users = await jiraApi.getUsers()
      console.log('Users:', users)

      setTestResults({
        connection: true,
        projects,
        issues,
        users,
        error: null
      })

    } catch (error: any) {
      console.error('Test failed:', error)
      setTestResults({
        connection: false,
        projects: null,
        issues: null,
        users: null,
        error: error.message || 'Unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <div className="w-4 h-4" />
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Not tested'
    return status ? 'Success' : 'Failed'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Jira Integration Test</h2>
        <button
          onClick={runTests}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      {testResults.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">Error: {testResults.error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Connection Test */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Connection Test</h3>
              <p className="text-sm text-gray-600">Test basic authentication and connectivity</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.connection)}
            <span className={`text-sm font-medium ${
              testResults.connection === true ? 'text-green-600' : 
              testResults.connection === false ? 'text-red-600' : 'text-gray-500'
            }`}>
              {getStatusText(testResults.connection)}
            </span>
          </div>
        </div>

        {/* Projects Test */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <FolderOpen className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Projects</h3>
              <p className="text-sm text-gray-600">
                {testResults.projects ? `${testResults.projects.length} projects found` : 'Fetch available projects'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.projects !== null)}
            <span className={`text-sm font-medium ${
              testResults.projects !== null ? 'text-green-600' : 'text-gray-500'
            }`}>
              {getStatusText(testResults.projects !== null)}
            </span>
          </div>
        </div>

        {/* Issues Test */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Recent Issues</h3>
              <p className="text-sm text-gray-600">
                {testResults.issues ? `${testResults.issues.length} recent issues found` : 'Fetch recent issues'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.issues !== null)}
            <span className={`text-sm font-medium ${
              testResults.issues !== null ? 'text-green-600' : 'text-gray-500'
            }`}>
              {getStatusText(testResults.issues !== null)}
            </span>
          </div>
        </div>

        {/* Users Test */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Users</h3>
              <p className="text-sm text-gray-600">
                {testResults.users ? `${testResults.users.length} users found` : 'Fetch active users'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(testResults.users !== null)}
            <span className={`text-sm font-medium ${
              testResults.users !== null ? 'text-green-600' : 'text-gray-500'
            }`}>
              {getStatusText(testResults.users !== null)}
            </span>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {testResults.projects && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Available Projects:</h3>
          <div className="space-y-1">
            {testResults.projects.slice(0, 5).map((project: any) => (
              <div key={project.key} className="text-sm text-blue-800">
                • {project.key}: {project.name}
              </div>
            ))}
            {testResults.projects.length > 5 && (
              <div className="text-sm text-blue-600 italic">
                ... and {testResults.projects.length - 5} more projects
              </div>
            )}
          </div>
        </div>
      )}

      {testResults.issues && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-medium text-purple-900 mb-2">Recent Issues:</h3>
          <div className="space-y-1">
            {testResults.issues.slice(0, 5).map((issue: any) => (
              <div key={issue.key} className="text-sm text-purple-800">
                • {issue.key}: {issue.fields.summary}
              </div>
            ))}
            {testResults.issues.length > 5 && (
              <div className="text-sm text-purple-600 italic">
                ... and {testResults.issues.length - 5} more issues
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 