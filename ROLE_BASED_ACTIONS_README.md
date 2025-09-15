# Role-Based Actions System

This document explains how the new role-based actions system works in the Worklog Tracker application.

## Overview

The role-based actions system allows different user roles (MANAGER, DEVELOPER) to see different action buttons in the dashboard header. This provides a clean separation of concerns and ensures users only see actions they're authorized to use.

## Architecture

### 1. Core Files

- **`src/lib/roleBasedActions.ts`** - Defines all available actions and role permissions
- **`src/components/ActionBar.tsx`** - Renders the action buttons based on configuration
- **`src/app/dashboard/manager/page.tsx`** - Manager dashboard with manager-specific actions
- **`src/app/dashboard/developer/page.tsx`** - Developer dashboard with developer-specific actions

### 2. Action Configuration

Actions are defined in `roleBasedActions.ts` with the following structure:

```typescript
export const ACTIONS = {
  DATE_RANGE_PICKER: 'dateRangePicker',
  TEST_JIRA: 'testJira',
  EXPORT_REPORTS: 'exportReports',
  PERSONAL_STATS: 'personalStats',
  TEAM_MANAGEMENT: 'teamManagement',
  // ... more actions
}
```

### 3. Role Permissions

Each role has a list of allowed actions:

```typescript
export const ROLE_ACTIONS: Record<UserRole, string[]> = {
  MANAGER: [
    ACTIONS.DATE_RANGE_PICKER,
    ACTIONS.TEST_JIRA,
    ACTIONS.EXPORT_REPORTS,
    ACTIONS.TEAM_MANAGEMENT,
    // ... more actions
  ],
  DEVELOPER: [
    ACTIONS.DATE_RANGE_PICKER,
    ACTIONS.PERSONAL_STATS,
    ACTIONS.TASK_MANAGEMENT,
    // ... more actions
  ]
}
```

## Usage

### In Page Components

```typescript
import { generateRoleActions, ACTIONS } from '@/lib/roleBasedActions'
import ActionBar from '@/components/ActionBar'

export default function ManagerDashboardPage() {
  // Generate role-based actions
  const actions = generateRoleActions(
    'MANAGER', // User role
    {
      // Action handlers
      [ACTIONS.TEST_JIRA]: () => setShowTestPanel(!showTestPanel),
      [ACTIONS.EXPORT_REPORTS]: () => setIsExportModalOpen(true),
    },
    {
      // Custom configuration (tooltips, disabled state, etc.)
      [ACTIONS.DATE_RANGE_PICKER]: {
        tooltip: 'Select date range for dashboard data'
      }
    }
  )

  return (
    <DashboardLayout 
      title="Manager Dashboard"
      actions={
        <ActionBar 
          actions={actions}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
        />
      }
    >
      <Dashboard {...dashboardProps} />
    </DashboardLayout>
  )
}
```

### Adding New Actions

1. **Define the action** in `ACTIONS`:
```typescript
export const ACTIONS = {
  // ... existing actions
  NEW_ACTION: 'newAction'
}
```

2. **Add to role permissions**:
```typescript
export const ROLE_ACTIONS: Record<UserRole, string[]> = {
  MANAGER: [
    // ... existing actions
    ACTIONS.NEW_ACTION
  ]
}
```

3. **Create action renderer**:
```typescript
export const ACTION_RENDERERS: Record<string, (config: any) => any> = {
  // ... existing renderers
  [ACTIONS.NEW_ACTION]: (config) => ({
    key: 'newAction',
    label: 'New Action',
    icon: NewIcon,
    className: 'bg-red-600 text-white hover:bg-red-700',
    ...config
  })
}
```

## Benefits

1. **Separation of Concerns**: Dashboard component focuses on content, page components handle actions
2. **Role-Based Security**: Users only see actions they're authorized to use
3. **Maintainability**: Easy to add/remove actions for specific roles
4. **Consistency**: All action buttons follow the same design pattern
5. **Flexibility**: Actions can be easily customized with tooltips, disabled states, etc.

## Current Actions

### Manager Actions
- **Date Range Picker**: Select time period for dashboard data
- **Test Jira**: Test Jira API connection
- **Export Reports**: Export dashboard data as PDF
- **Team Management**: Navigate to team management
- **Project Management**: Navigate to project management
- **Worklog Management**: Navigate to worklog management
- **Reports**: Navigate to reports

### Developer Actions
- **Date Range Picker**: Select time period for personal data
- **Personal Stats**: View personal productivity statistics
- **Task Management**: Manage assigned tasks
- **Reports**: View personal reports
- **Settings**: Access personal settings

## Future Enhancements

1. **Dynamic Action Loading**: Load actions from API based on user permissions
2. **Action Groups**: Group related actions into dropdown menus
3. **Action History**: Track which actions users use most
4. **Customizable Actions**: Allow users to customize their action bar
5. **Action Analytics**: Monitor action usage for UX improvements








