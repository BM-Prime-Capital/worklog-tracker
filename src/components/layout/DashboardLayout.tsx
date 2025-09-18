'use client'

import { useState } from 'react'
import { BarChart3, Calendar, CheckCircle, Clock, Code, FolderOpen, LayoutDashboard, Menu, Settings, Trophy, Users, Shield, UserCog, Database, Activity } from 'lucide-react'
import Sidebar from '../Sidebar'
import UserAvatarDropdown from '../UserAvatarDropdown'
import { UserRole } from '@/lib/types'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  actions
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }


  const getNavigationItems = (role:UserRole) => {

    const baseItems = [
      {
        name: "Dashboard",
        href: `/dashboard/${role.toLowerCase()}`,
        icon: LayoutDashboard,
        description: 'Overview and analytics'
      },
      {
        name: "Rewards",
        href: `/dashboard/${role.toLowerCase()}/rewards/`,
        icon: Trophy,
        description: 'Performance rewards'
      },
      {
        name: "Settings",
        href: `/dashboard/${role.toLowerCase()}/settings/`,
        icon: Settings,
        description: 'Account settings'
      },
    ];

    switch (role) {
      case "ADMIN":
        return [
          ...baseItems.slice(0, 1), // Dashboard
          {
            name: 'Managers',
            href: `/dashboard/${role.toLowerCase()}/managers`,
            icon: UserCog,
            description: 'Manage all platform managers'
          },
          {
            name: 'Users',
            href: `/dashboard/${role.toLowerCase()}/users`,
            icon: Users,
            description: 'Manage all platform users'
          },
          {
            name: 'System',
            href: `/dashboard/${role.toLowerCase()}/system`,
            icon: Database,
            description: 'System administration'
          },
          {
            name: 'Security',
            href: `/dashboard/${role.toLowerCase()}/security`,
            icon: Shield,
            description: 'Security and permissions'
          },
          {
            name: "Settings",
            href: `/dashboard/${role.toLowerCase()}/settings/`,
            icon: Settings,
            description: 'Account settings'
          },
          // ...baseItems.slice(2), // Rewards + Settings
        ];

      case "MANAGER":
        return [
          ...baseItems.slice(0, 1), // Dashboard
          {
            name: 'Projects',
            href: `/dashboard/${role.toLowerCase()}/projects`,
            icon: FolderOpen,
            description: 'Project management'
          },
          {
            name: 'Worklogs',
            href: `/dashboard/${role.toLowerCase()}/worklogs`,
            icon: Calendar,
            description: 'Detailed time tracking'
          },
          {
            name: 'Team',
            href: `/dashboard/${role.toLowerCase()}/team`,
            icon: Users,
            description: 'Team management'
          },
          {
            name: 'Online Status',
            href: `/dashboard/${role.toLowerCase()}/online-status`,
            icon: Activity,
            description: 'Monitor team presence'
          },

          ...baseItems.slice(1, ), //  Reward + settings
        ];

        case "DEVELOPER":
          return [
            ...baseItems.slice(0, 1), //Dashboard

            {
              name: 'Online Status',
              href: `/dashboard/${role.toLowerCase()}/online-status`,
              icon: Users,
              description: 'Set and manage your availability status'
            },
            {
              name: 'My Worklogs',
              href: `/dashboard/${role.toLowerCase()}/worklogs`,
              icon: Clock,
              description: 'Track your time and work activities'
            },
            {
              name: 'Projects',
              href: `/dashboard/${role.toLowerCase()}/projects`,
              icon: FolderOpen,
              description: 'View project details and contributions'
            },

            ...baseItems.slice(1), //  Reward + Settings

          ];


      default:
        return baseItems;
    }

  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={toggleMobileMenu}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 transform transition-transform">
            <Sidebar
              getNavigationItems={getNavigationItems}
              isCollapsed={false}
              onToggle={toggleMobileMenu}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-50">
        <Sidebar
          getNavigationItems={getNavigationItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              {title && (
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Actions and User Avatar */}
            <div className="flex items-center space-x-3">
              {actions && (
                <div className="flex items-center space-x-3">
                  {actions}
                </div>
              )}

              {/* User Avatar Dropdown */}
              <UserAvatarDropdown />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
