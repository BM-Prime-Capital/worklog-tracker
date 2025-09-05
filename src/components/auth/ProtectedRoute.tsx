'use client'

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ("ADMIN" | "MANAGER" | "DEVELOPER")[]
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Wait for session to load

    // If authentication is required but user is not authenticated
    if (requireAuth && !session) {
      router.push(redirectTo)
      return
    }

    // If specific roles are required, check user role
    if (allowedRoles && session?.user) {
      const user = session.user as { role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' }
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on user role
        const dashboardRedirect = `/dashboard/${user.role.toLowerCase()}`
        router.push(dashboardRedirect)
        return
      }
    }
  }, [
    session,
    status,
    requireAuth,
    allowedRoles,
    router,
    redirectTo,
  ])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If auth is required but user is not authenticated, return null (redirect will happen)
  if (requireAuth && !session) {
    return null
  }

  // If specific roles are required but user doesn't have permission, return null (redirect will happen)
  if (allowedRoles && session?.user) {
    const user = session.user as { role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' }
    if (!allowedRoles.includes(user.role)) {
      return null
    }
  }

  return <>{children}</>  
} 