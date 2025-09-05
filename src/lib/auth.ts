import CredentialsProvider from 'next-auth/providers/credentials'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'

interface JiraOrganization {
  organizationName: string
  domain: string
  email: string
  apiToken: string
}

// import { MongoDBAdapter } from '@auth/mongodb-adapter'
// import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export const authOptions = {
  providers: [
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

          console.log(`🔍 Attempting login for user: ${user.email}`)
          console.log(`🔑 Password hash length: ${user.password.length} characters`)

          // Debug: Check if password hash looks like bcrypt
          const isBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$')
          console.log(`🔐 Password hash format: ${isBcryptHash ? 'Valid bcrypt' : 'Invalid format'}`)

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
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
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            organizationId: user.organizationId?.toString(), // Added organizationId
            jiraOrganization: user.jiraOrganization
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw new Error('Authentication failed')
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { role: string; firstName: string; lastName: string; isEmailVerified: boolean; organizationId?: string; jiraOrganization?: { domain: string; email: string; apiToken: string; organizationName?: string } } }) {
      if (user) {
        token.role = user.role as 'ADMIN' | 'MANAGER' | 'DEVELOPER'
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.isEmailVerified = user.isEmailVerified
        token.organizationId = user.organizationId // Added organizationId
        token.jiraOrganization = user.jiraOrganization as JiraOrganization | undefined
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as 'ADMIN' | 'MANAGER' | 'DEVELOPER'
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.isEmailVerified = token.isEmailVerified as boolean
        session.user.organizationId = token.organizationId as string // Added organizationId
        session.user.jiraOrganization = token.jiraOrganization
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