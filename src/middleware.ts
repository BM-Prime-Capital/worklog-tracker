import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // If user is not authenticated, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // If user is not verified, redirect to verification page
    if (!token.isEmailVerified) {
      return NextResponse.redirect(new URL('/auth/verify-email', req.url))
    }

    // Get user role once for all checks
    const userRole = token.role as 'ADMIN' | 'MANAGER' | 'DEVELOPER'

    // Check if user has organization - redirect to onboarding if not
    // Only MANAGER role needs to have an organization
    // ADMIN role manages the platform, not Jira projects, so no organization required
    // DEVELOPER role gets organization through invitation, so they don't need onboarding
    if (!token.organizationId && userRole === 'MANAGER') {
      // Skip organization check for onboarding pages and auth pages
      if (pathname.startsWith('/onboarding/') || pathname.startsWith('/auth/')) {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL('/onboarding/organization', req.url))
    }

    // Skip further checks for onboarding pages if user already has organization
    if (pathname.startsWith('/onboarding/')) {
      const dashboardPath = `/dashboard/${userRole.toLowerCase()}`
      return NextResponse.redirect(new URL(dashboardPath, req.url))
    }

    // Role-based access control
    
    if (pathname.startsWith('/dashboard/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (pathname.startsWith('/dashboard/manager') && userRole !== 'MANAGER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (pathname.startsWith('/dashboard/developer') && userRole !== 'DEVELOPER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/profile/:path*',
    '/api/protected/:path*'
  ]
}