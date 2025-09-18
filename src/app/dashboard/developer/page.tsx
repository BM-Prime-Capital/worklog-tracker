'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DeveloperDashboard from '@/components/DeveloperDashboard'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ActionBar from '@/components/ActionBar'
import { useAuth } from '@/contexts/AuthContextNew'
import { generateRoleActions, ACTIONS } from '@/lib/roleBasedActions'

export default function DeveloperDashboardPage() {
  const { user } = useAuth()
  const [selectedDateRange, setSelectedDateRange] = useState('this-week')

  // Generate role-based actions for developers
  const actions = generateRoleActions(
    'DEVELOPER',
    {
      [ACTIONS.PERSONAL_STATS]: () => console.log('Navigate to personal stats'),
      [ACTIONS.TASK_MANAGEMENT]: () => console.log('Navigate to task management'),
      [ACTIONS.REPORTS]: () => console.log('Navigate to reports'),
      [ACTIONS.SETTINGS]: () => console.log('Navigate to settings')
    },
    {
      [ACTIONS.DATE_RANGE_PICKER]: {
        tooltip: 'Select date range for your dashboard data'
      },
      [ACTIONS.PERSONAL_STATS]: {
        tooltip: 'View your personal productivity statistics'
      },
      [ACTIONS.TASK_MANAGEMENT]: {
        tooltip: 'Manage your assigned tasks'
      }
    }
  )

  return (
    <ProtectedRoute allowedRoles={['DEVELOPER']}>
      <DashboardLayout 
        title="Developer Dashboard"
        subtitle="Track your productivity and time allocation"
        actions={
          <ActionBar 
            actions={actions}
            selectedDateRange={selectedDateRange}
            onDateRangeChange={setSelectedDateRange}
          />
        }
      >
        <DeveloperDashboard selectedDateRange={selectedDateRange} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
