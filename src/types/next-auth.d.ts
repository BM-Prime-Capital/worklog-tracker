// NextAuth type extensions

interface JiraOrganization {
  organizationName: string
  domain: string
  email: string
  apiToken: string
}

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

  interface User {
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

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string
    role: 'ADMIN' | 'MANAGER' | 'DEVELOPER'
    firstName: string
    lastName: string
    isEmailVerified: boolean
    organizationId?: string
    jiraOrganization?: JiraOrganization
    atlassianAccountId?: string
  }
}