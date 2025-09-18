import CredentialsProvider from 'next-auth/providers/credentials'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      role: 'ADMIN' | 'MANAGER' | 'DEVELOPER'
      isEmailVerified: boolean
      organizationId?: string
      jiraOrganization?: JiraOrganization
      atlassianAccountId?: string
    }
  }
}

interface JiraOrganization {
  organizationName: string
  domain: string
  email: string
  apiToken: string
}

// import { MongoDBAdapter } from '@auth/mongodb-adapter'
// import clientPromise from '@/lib/mongodb'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export const authOptions = {
  providers: [
    
    // Credentials (for MANAGER/ADMIN roles and developer fallback)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        try {
          await dbConnect()

          const user = await User.findOne({ email: credentials.email.toLowerCase() })
          if (!user) {
            console.log(`❌ User not found: ${credentials.email}`)
            throw new Error('Invalid credentials')
          }

          // Check if user can use password auth
          if (user.role === 'DEVELOPER' && !user.authMethods?.includes('password')) {
            throw new Error('Please use Atlassian OAuth to sign in')
          }

          console.log(`🔍 Attempting login for user: ${user.email}`)
          console.log(`🔑 Password hash length: ${user.password?.length || 0} characters`)

          // Debug: Check if password hash looks like bcrypt
          const isBcryptHash = user.password?.startsWith('$2b$') || user.password?.startsWith('$2a$')
          console.log(`🔐 Password hash format: ${isBcryptHash ? 'Valid bcrypt' : 'Invalid format'}`)

          const isPasswordValid = await user.comparePassword(credentials.password)
          console.log(`✅ Password comparison result: ${isPasswordValid}`)

          if (!isPasswordValid) {
            console.log(`❌ Password validation failed for user: ${user.email}`)
            throw new Error('Invalid credentials')
          }

          if (!user.isEmailVerified) {
            console.log(`❌ Email not verified for user: ${user.email}`)
            throw new Error('Please verify your email before signing in')
          }

          console.log(`✅ Login successful for user: ${user.email}`)
          return {
            id: (user._id as { toString(): string }).toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            organizationId: user.organizationId?.toString(),
            jiraOrganization: user.jiraOrganization,
            atlassianAccountId: user.atlassianAccountId
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw new Error('Authentication failed')
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn() {
      // Allow password authentication for MANAGER/ADMIN
      return true
    },
    async jwt({ token, user }: { token: JWT; user?: { id: string; email: string; firstName: string; lastName: string; role: string; isEmailVerified: boolean; organizationId?: string; jiraOrganization?: JiraOrganization; atlassianAccountId?: string } }) {
      if (user) {
        token.role = user.role as 'ADMIN' | 'MANAGER' | 'DEVELOPER'
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.isEmailVerified = user.isEmailVerified
        token.organizationId = user.organizationId
        token.jiraOrganization = user.jiraOrganization as JiraOrganization | undefined
        token.atlassianAccountId = user.atlassianAccountId
      }
      return token
    },
    async session({ session, token }: { 
      session: Session; 
      token: JWT; 
    }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as 'ADMIN' | 'MANAGER' | 'DEVELOPER'
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.isEmailVerified = token.isEmailVerified as boolean
        session.user.organizationId = token.organizationId as string
        session.user.jiraOrganization = token.jiraOrganization
        session.user.atlassianAccountId = token.atlassianAccountId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

// Generate a secure reset token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Generate JWT token (for custom login route)
export function generateToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, { expiresIn: '7d' })
}