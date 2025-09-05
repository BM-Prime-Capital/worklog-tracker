'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import OrganizationSetup from '@/components/onboarding/OrganizationSetup'

export default function OrganizationOnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !session.user) {
      router.push('/auth/login')
      return
    }

    const user = session.user as { organizationId?: string }
    if (user.organizationId) {
      router.push('/dashboard')
      return
    }

    setIsLoading(false)
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleComplete = () => {
    // Redirect to role-specific dashboard
    if (!session?.user) {
      console.error('🔧 No user session available for redirect')
      router.push('/auth/login')
      return
    }
    
    const user = session.user as { role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' }
    const dashboardPath = `/dashboard/${user.role.toLowerCase()}`
    console.log('🔧 handleComplete called, redirecting to:', dashboardPath)
    console.log('🔧 User role:', user.role)
    router.push(dashboardPath)
  }

  return <OrganizationSetup onComplete={handleComplete} />
}
