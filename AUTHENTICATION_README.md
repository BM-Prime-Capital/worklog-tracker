# NextAuth.js Authentication System

This document describes the robust authentication system implemented using NextAuth.js with best practices for security and user management.

## 🚀 Features

### **Core Authentication**
- **JWT-based sessions** with secure token management
- **Credentials provider** for email/password authentication
- **MongoDB adapter** for session and user storage
- **Role-based access control** (Manager/Developer)
- **Email verification** system (ready for production)

### **Security Features**
- **Password hashing** using bcryptjs (12 rounds)
- **JWT token expiration** (30 days)
- **HTTP-only cookies** for session management
- **CSRF protection** built-in
- **Rate limiting** ready for implementation
- **Input validation** using Zod schemas

### **User Management**
- **Automatic role assignment** (Developer by default)
- **Email verification** workflow
- **Password reset** capabilities
- **Session persistence** across browser sessions

## 🏗️ Architecture

### **Technology Stack**
- **NextAuth.js** - Authentication framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - JSON Web Tokens for sessions
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **TypeScript** - Type safety

### **File Structure**
```
src/
├── app/
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts    # NextAuth API routes
│   │   └── signup/route.ts           # Custom signup endpoint
│   └── auth/
│       ├── login/page.tsx            # Login page
│       └── signup/page.tsx           # Signup page
├── components/auth/
│   └── ProtectedRoute.tsx            # Route protection component
├── contexts/
│   └── AuthContextNew.tsx            # Authentication context
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   ├── mongodb.ts                    # MongoDB client
│   └── db.ts                         # Database connection
├── middleware.ts                      # Route protection middleware
└── types/
    └── next-auth.d.ts                # NextAuth type extensions
```

## 🔧 Setup & Configuration

### **1. Environment Variables**
Create a `.env.local` file based on `env.example`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/worklog-tracker

# NextAuth.js
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# JWT (optional)
JWT_SECRET=your-jwt-secret-key-here
```

### **2. Database Setup**
Ensure MongoDB is running and accessible:
```bash
# Start MongoDB (if using local instance)
mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worklog-tracker
```

### **3. Install Dependencies**
```bash
npm install next-auth @auth/mongodb-adapter mongodb
```

## 🔐 Authentication Flow

### **User Registration**
1. User fills signup form
2. Data validation using Zod schemas
3. Password hashing with bcryptjs
4. User creation with default "DEVELOPER" role
5. Email verification token generation
6. Redirect to login page

### **User Login**
1. User provides credentials
2. NextAuth validates against database
3. Password comparison using bcryptjs
4. JWT token generation
5. Session creation and storage
6. Role-based dashboard redirect

### **Session Management**
- **JWT tokens** stored in HTTP-only cookies
- **30-day expiration** with automatic renewal
- **Role information** embedded in tokens
- **Secure session validation** on each request

## 🛡️ Security Implementation

### **Password Security**
```typescript
// 12 rounds of bcrypt hashing
const salt = await bcrypt.genSalt(12)
const hashedPassword = await bcrypt.hash(password, salt)
```

### **JWT Configuration**
```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
},
jwt: {
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

### **Input Validation**
```typescript
// Zod schema validation
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})
```

## 🚦 Route Protection

### **Middleware Protection**
```typescript
// src/middleware.ts
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    
    // Role-based access control
    if (pathname.startsWith('/dashboard/manager') && token.role !== 'MANAGER') {
      return NextResponse.redirect(new URL('/dashboard/developer', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)
```

### **Component-Level Protection**
```typescript
// ProtectedRoute component
<ProtectedRoute allowedRoles={['MANAGER']}>
  <ManagerDashboard />
</ProtectedRoute>
```

## 🔄 Session Management

### **Client-Side Session**
```typescript
import { useSession } from 'next-auth/react'

const { data: session, status } = useSession()

if (status === 'loading') {
  return <LoadingSpinner />
}

if (status === 'authenticated') {
  return <Dashboard user={session.user} />
}
```

### **Server-Side Session**
```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Handle authenticated request
}
```

## 📧 Email Verification

### **Verification Flow**
1. **Token Generation**: 32-byte random hex token
2. **Expiration**: 24-hour validity period
3. **Storage**: Token stored in user document
4. **Verification**: Token validation endpoint
5. **Status Update**: User marked as verified

### **Production Implementation**
```typescript
// TODO: Implement email service integration
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Send verification email
await transporter.sendMail({
  from: process.env.SMTP_USER,
  to: user.email,
  subject: 'Verify your email',
  html: verificationEmailTemplate(token)
})
```

## 🚀 Production Deployment

### **Environment Variables**
```bash
# Production environment
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worklog-tracker
```

### **Security Headers**
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

### **Rate Limiting**
```typescript
// Implement rate limiting for auth endpoints
import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts'
})
```

## 🔍 Monitoring & Logging

### **Authentication Logs**
```typescript
// Log authentication events
callbacks: {
  async signIn({ user, account, profile }) {
    console.log('User signed in:', user.email)
    return true
  },
  async signOut({ session, token }) {
    console.log('User signed out:', session?.user?.email)
  }
}
```

### **Error Tracking**
```typescript
// Centralized error handling
try {
  // Authentication logic
} catch (error) {
  console.error('Auth error:', error)
  // Send to error tracking service (e.g., Sentry)
  // Sentry.captureException(error)
  throw new Error('Authentication failed')
}
```

## 🧪 Testing

### **Unit Tests**
```typescript
// Test authentication functions
describe('Authentication', () => {
  it('should hash passwords correctly', async () => {
    const password = 'testpassword123'
    const hashedPassword = await hashPassword(password)
    expect(await comparePassword(password, hashedPassword)).toBe(true)
  })
})
```

### **Integration Tests**
```typescript
// Test API endpoints
describe('Auth API', () => {
  it('should create user with correct role', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send(validUserData)
    
    expect(response.status).toBe(201)
    expect(response.body.user.role).toBe('DEVELOPER')
  })
})
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Session not persisting**
   - Check `NEXTAUTH_SECRET` environment variable
   - Verify cookie settings in production

2. **Role not accessible**
   - Ensure JWT callback includes role information
   - Check TypeScript type definitions

3. **Database connection issues**
   - Verify MongoDB connection string
   - Check network connectivity

4. **Middleware not working**
   - Ensure middleware is properly configured
   - Check route matching patterns

### **Debug Mode**
```typescript
// Enable debug mode in development
debug: process.env.NODE_ENV === 'development'
```

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MongoDB Adapter](https://next-auth.js.org/adapters/mongodb)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Authentication Guidelines](https://owasp.org/www-project-authentication-cheat-sheet/)

## 🔄 Migration from Previous System

If migrating from the previous authentication system:

1. **Update environment variables**
2. **Run database migrations** (if needed)
3. **Update client-side code** to use NextAuth hooks
4. **Test all authentication flows**
5. **Update protected routes** to use new middleware

## 📝 License

This authentication system is part of the Worklog Tracker project and follows industry best practices for security and user management.





