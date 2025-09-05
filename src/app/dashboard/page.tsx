'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

const DashboardRedirectingPage = () => {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      // Redirect to role-specific dashboard
      const user = session.user as { role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' }
      const dashboardRoute = `/dashboard/${user.role.toLowerCase()}`
      router.push(dashboardRoute)
    }
  }, [session, router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}

  export default DashboardRedirectingPage;
