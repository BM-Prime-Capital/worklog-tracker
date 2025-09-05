'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Dashboard from '@/components/Dashboard'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ActionBar from '@/components/ActionBar'
// import { useAuth } from '@/contexts/AuthContextNew' // Not used in this component
import { generateRoleActions, ACTIONS } from '@/lib/roleBasedActions'

export default function ManagerDashboardPage() {
  // const { user } = useAuth() // Not used in this component
  const [selectedDateRange, setSelectedDateRange] = useState('this-week')
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Generate role-based actions for managers - only the ones we want visible
  const actions = generateRoleActions(
    'MANAGER',
    {
      [ACTIONS.DATE_RANGE_PICKER]: () => {}, // Handled by ActionBar component
      [ACTIONS.TEST_JIRA]: () => setShowTestPanel(!showTestPanel),
      [ACTIONS.EXPORT_REPORTS]: () => setIsExportModalOpen(true),
    }
  )

  return (
    <ProtectedRoute allowedRoles={['MANAGER']}>
      <DashboardLayout 
        title="Manager Dashboard"
        subtitle="Track team productivity and time allocation"
        actions={
          <ActionBar 
            actions={actions}
            selectedDateRange={selectedDateRange}
            onDateRangeChange={setSelectedDateRange}
          />
        }
      >
        <Dashboard 
          selectedDateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
          showTestPanel={showTestPanel}
          onToggleTestPanel={() => setShowTestPanel(!showTestPanel)}
          isExportModalOpen={isExportModalOpen}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onCloseExportModal={() => setIsExportModalOpen(false)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
