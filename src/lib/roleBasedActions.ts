import { Calendar, Download, BarChart3, Clock, Users, Settings, Code, CheckCircle } from 'lucide-react'
import { UserRole } from './types'

export interface ActionConfig {
  key: string
  label: string
  icon: any
  onClick?: () => void
  className?: string
  disabled?: boolean
  tooltip?: string
}

export interface RoleActions {
  [key: string]: ActionConfig[]
}

// Define all possible actions
export const ACTIONS = {
  DATE_RANGE_PICKER: 'dateRangePicker',
  TEST_JIRA: 'testJira',
  EXPORT_REPORTS: 'exportReports',
  PERSONAL_STATS: 'personalStats',
  TEAM_MANAGEMENT: 'teamManagement',
  PROJECT_MANAGEMENT: 'projectManagement',
  TASK_MANAGEMENT: 'taskManagement',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  WORKLOG_MANAGEMENT: 'worklogManagement'
}

// Role-based action configurations
export const ROLE_ACTIONS: Record<UserRole, string[]> = {
  ADMIN: [
    ACTIONS.DATE_RANGE_PICKER,
    ACTIONS.TEST_JIRA,
    ACTIONS.EXPORT_REPORTS,
    ACTIONS.TEAM_MANAGEMENT,
    ACTIONS.PROJECT_MANAGEMENT,
    ACTIONS.WORKLOG_MANAGEMENT,
    ACTIONS.REPORTS,
    ACTIONS.SETTINGS
  ],
  MANAGER: [
    ACTIONS.DATE_RANGE_PICKER,
    ACTIONS.TEST_JIRA,
    ACTIONS.EXPORT_REPORTS,
    // ACTIONS.TEAM_MANAGEMENT,
    // ACTIONS.PROJECT_MANAGEMENT,
    // ACTIONS.WORKLOG_MANAGEMENT,
    // ACTIONS.REPORTS
  ],
  DEVELOPER: [
    ACTIONS.DATE_RANGE_PICKER,
    ACTIONS.PERSONAL_STATS,
    ACTIONS.TASK_MANAGEMENT,
    ACTIONS.REPORTS,
    ACTIONS.SETTINGS
  ]
}

// Action renderers
export const ACTION_RENDERERS: Record<string, (config: any) => any> = {
  [ACTIONS.DATE_RANGE_PICKER]: (config) => ({
    key: 'dateRangePicker',
    label: 'Date Range',
    icon: Calendar,
    className: 'bg-gray-600 text-white hover:bg-gray-700',
    ...config
  }),
  
  [ACTIONS.TEST_JIRA]: (config) => ({
    key: 'testJira',
    label: 'Test Jira',
    icon: Code,
    className: 'bg-yellow-600 text-white hover:bg-yellow-700',
    ...config
  }),
  
  [ACTIONS.EXPORT_REPORTS]: (config) => ({
    key: 'exportReports',
    label: 'Export',
    icon: Download,
    className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800',
    ...config
  }),
  
  [ACTIONS.PERSONAL_STATS]: (config) => ({
    key: 'personalStats',
    label: 'My Stats',
    icon: BarChart3,
    className: 'bg-green-600 text-white hover:bg-green-700',
    ...config
  }),
  
  [ACTIONS.TEAM_MANAGEMENT]: (config) => ({
    key: 'teamManagement',
    label: 'Team',
    icon: Users,
    className: 'bg-purple-600 text-white hover:bg-purple-700',
    ...config
  }),
  
  [ACTIONS.PROJECT_MANAGEMENT]: (config) => ({
    key: 'projectManagement',
    label: 'Projects',
    icon: Code,
    className: 'bg-indigo-600 text-white hover:bg-indigo-700',
    ...config
  }),
  
  [ACTIONS.TASK_MANAGEMENT]: (config) => ({
    key: 'taskManagement',
    label: 'My Tasks',
    icon: CheckCircle,
    className: 'bg-emerald-600 text-white hover:bg-emerald-700',
    ...config
  }),
  
  [ACTIONS.SETTINGS]: (config) => ({
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    className: 'bg-gray-600 text-white hover:bg-gray-700',
    ...config
  }),
  
  [ACTIONS.REPORTS]: (config) => ({
    key: 'reports',
    label: 'Reports',
    icon: BarChart3,
    className: 'bg-cyan-600 text-white hover:bg-cyan-700',
    ...config
  }),
  
  [ACTIONS.WORKLOG_MANAGEMENT]: (config) => ({
    key: 'worklogManagement',
    label: 'Worklogs',
    icon: Clock,
    className: 'bg-orange-600 text-white hover:bg-orange-700',
    ...config
  })
}

// Generate actions for a specific role
export function generateRoleActions(
  role: UserRole, 
  actionHandlers: Record<string, () => void> = {},
  customConfig: Record<string, any> = {}
): ActionConfig[] {
  const allowedActions = ROLE_ACTIONS[role] || []
  
  return allowedActions.map(actionKey => {
    const renderer = ACTION_RENDERERS[actionKey]
    if (!renderer) return null
    
    const baseConfig = renderer({})
    const customActionConfig = customConfig[actionKey] || {}
    const handler = actionHandlers[actionKey]
    
    return {
      ...baseConfig,
      ...customActionConfig,
      onClick: handler || baseConfig.onClick,
      disabled: customActionConfig.disabled || baseConfig.disabled
    }
  }).filter(Boolean) as ActionConfig[]
}

// Helper to check if a role can perform an action
export function canPerformAction(role: UserRole, action: string): boolean {
  const allowedActions = ROLE_ACTIONS[role] || []
  return allowedActions.includes(action)
}

// Helper to get action configuration for a specific action
export function getActionConfig(actionKey: string, customConfig: any = {}): ActionConfig | null {
  const renderer = ACTION_RENDERERS[actionKey]
  if (!renderer) return null
  
  return renderer(customConfig)
}
