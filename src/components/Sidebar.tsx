'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Clock
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContextNew'
import { UserRole } from '@/lib/types'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  getNavigationItems: (role: UserRole) => NavigationItem[]
}

export default function Sidebar({ isCollapsed, onToggle, getNavigationItems }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // const navigationItems = [
  //   {
  //     name: 'Dashboard',
  //     href: '/dashboard',
  //     icon: LayoutDashboard,
  //     description: 'Overview and analytics'
  //   },
  //   {
  //     name: 'Projects',
  //     href: '/projects',
  //     icon: FolderOpen,
  //     description: 'Project management'
  //   },
  //   {
  //     name: 'Worklogs',
  //     href: '/worklogs',
  //     icon: Calendar,
  //     description: 'Detailed time tracking'
  //   },
  //   {
  //     name: 'Team',
  //     href: '/team',
  //     icon: Users,
  //     description: 'Team management'
  //   },
  //   {
  //     name: 'Rewards',
  //     href: '/rewards',
  //     icon: Trophy,
  //     description: 'Performance rewards'
  //   },
  //   {
  //     name: 'Profile',
  //     href: '/profile',
  //     icon: User,
  //     description: 'Account settings'
  //   }
  // ]

   // Navigation items based on role
  //  const getNavigationItems = (role:UserRole) => {

  //   const baseItems = [
  //     {
  //       name: "Dashboard",
  //       href: `/dashboard/${role.toLowerCase()}`,
  //     icon: LayoutDashboard,
  //     description: 'Overview and analytics'
  //     },
  //     {
  //       name: "Rewards",
  //       href: `/rewards/${role.toLowerCase()}`,
  //     icon: Trophy,
  //     description: 'Performance rewards'
  //     },
  //     {
  //       name: "Profile",
  //       href: `/profile/${role.toLowerCase()}`,
  //     icon: User,
  //     description: 'Account settings'
  //     },
  //   ];

  //   switch (role) {
  //     case "MANAGER":
  //       return [
  //         ...baseItems.slice(0), // Dashboard 
  //         {
  //           name: 'Worklogs',
  //           href: '/worklogs',
  //           icon: Calendar,
  //           description: 'Detailed time tracking'
  //         },
  //         {
  //           name: 'Team',
  //           href: '/team',
  //           icon: Users,
  //           description: 'Team management'
  //         },

          
  //         ...baseItems.slice(2), //  Reward + Profile
  //       ];

  //       case "DEVELOPER":
  //         return [
  //           ...baseItems.slice(0, 1), //Dashboard
  //           { 
  //             name: 'My Tasks', 
  //             href: '/dashboard/developer/tasks', 
  //             icon: CheckCircle 
  //           },
  //           { 
  //             name: 'My Worklogs', 
  //             href: '/dashboard/developer/worklogs', 
  //             icon: Clock 
  //           },
  //           { 
  //             name: 'Projects', 
  //             href: '/dashboard/developer/projects', 
  //             icon: Code 
  //           },
  //           {
  //              name: 'Reports', 
  //              href: '/dashboard/developer/reports', 
  //              icon: BarChart3 },
  //           { 
  //             name: 'Settings', 
  //             href: '/dashboard/developer/settings', 
  //             icon: Settings 
  //           },
  //           ...baseItems.slice(2), //  Reward + Profile

  //         ];
       
  //         return [
  //           {
  //             name: "Dashboard",
  //             href: `/dashboard/${role.toLowerCase()}`,
  //             icon: LayoutDashboard,
  //             badge: null,
  //           },
  //           // {
  //           //   name: "Messages",
  //           //   href: `/dashboard/${role.toLowerCase()}/messages`,
  //           //   icon: MessageSquare,
  //           //   badge: null,
  //           // },
  //           {
  //             name: "Bookings",
  //             href: `/dashboard/${role.toLowerCase()}/bookings`,
  //             icon: ClipboardCheck,
  //             badge: "12",
  //           },
  //           {
  //             name: "Services",
  //             href: `/dashboard/${role.toLowerCase()}/services`,
  //             icon: Wrench,
  //             badge: null,
  //           },
  //           {
  //             name: "Add-ons",
  //             href: `/dashboard/${role.toLowerCase()}/addons`,
  //             icon: Plus,
  //             badge: null,
  //           },
  //           {
  //             name: "Inventory",
  //             href: `/dashboard/${role.toLowerCase()}/inventory`,
  //             icon: Package,
  //             badge: null,
  //           },
  //           {
  //             name: "Settings",
  //             href: `/dashboard/${role.toLowerCase()}/settings`,
  //             icon: Sliders,
  //             badge: null,
  //           },
  //         ];

  //     default:
  //       return baseItems;
  //   }

  //   // if (isManager) {
  //   //   return [
  //   //     { name: 'Dashboard', href: '/dashboard/manager/projects', icon: FolderOpen },
  //   //     { name: 'Team', href: '/dashboard/manager/team', icon: Users },
  //   //     { name: 'Worklogs', href: '/dashboard/manager/worklogs', icon: Activity },
  //   //     { name: 'Reports', href: '/dashboard/manager/reports', icon: BarChart3 },
  //   //     { name: 'Settings', href: '/dashboard/manager/settings', icon: Settings },
  //   //   ]
  //   // } else if (isDeveloper) {
  //   //   return [
  //   //     { name: 'My Tasks', href: '/dashboard/developer/tasks', icon: CheckCircle },
  //   //     { name: 'My Worklogs', href: '/dashboard/developer/worklogs', icon: Clock },
  //   //     { name: 'Projects', href: '/dashboard/developer/projects', icon: Code },
  //   //     { name: 'Reports', href: '/dashboard/developer/reports', icon: BarChart3 },
  //   //     { name: 'Settings', href: '/dashboard/developer/settings', icon: Settings },
  //   //   ]
  //   // }
  //   // return []
  // }

  const navigationItems = user ? getNavigationItems(user.role) : [];

  const handleLogout = () => {
    logout()
  }

  const isActive = (href: string) => {
    const isExactMatch = pathname === href;
          const isSubpage = href !== `/dashboard/${user?.role?.toLowerCase()}` && 
                           pathname.startsWith(href + '/');
          return isExactMatch || isSubpage;
    // if (href === '/dashboard') {
    //   return pathname === '/dashboard'
    // }
    // return pathname.startsWith(href)
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out h-full ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Worklog Tracker</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>



      {/* Navigation */}
      <nav className="p-4 space-y-2 pb-20">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                active
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${
                active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              }`} />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{item.name}</span>
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  )
} 