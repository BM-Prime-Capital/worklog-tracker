# Authentication System Setup

## Overview

This application now uses a modern email/password authentication system with MongoDB, JWT tokens, and Zod validation. Users can sign up, log in, and manage their Jira organization settings through a profile page.

## Features

### 🔐 Authentication
- **Sign Up**: Email and password registration
- **Login**: Email and password authentication
- **Password Reset**: Forgot password functionality
- **JWT Tokens**: Secure HTTP-only cookies
- **Form Validation**: Zod schema validation

### 👤 User Management
- **Profile Page**: Update personal information
- **Jira Organization Settings**: Configure Jira integration
- **Secure Storage**: MongoDB with encrypted passwords

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/worklog-tracker

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 2. MongoDB Setup

Install and start MongoDB locally, or use MongoDB Atlas:

```bash
# Local MongoDB (macOS with Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI with your Atlas connection string
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## User Flow

### 1. Sign Up
- Navigate to `/auth/signup`
- Enter email and password
- Account is created with default name (email prefix)
- User is automatically logged in

### 2. Login
- Navigate to `/auth/login`
- Enter email and password
- User is redirected to dashboard

### 3. Configure Jira
- Click "Profile" button in dashboard
- Enter Jira organization details:
  - Organization Name
  - Domain (e.g., your-domain.atlassian.net)
  - Email
  - API Token
- Save settings

### 4. Use Dashboard
- Jira integration now uses saved organization settings
- Test connection with "Test Jira" button
- View team productivity data

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user

### User Management
- `PUT /api/user/jira-organization` - Update Jira settings

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: HTTP-only cookies
- **Input Validation**: Zod schemas
- **Error Handling**: Secure error messages
- **Rate Limiting**: Built-in protection

## Database Schema

### User Model
```typescript
{
  email: string (unique)
  password: string (hashed)
  name: string
  isEmailVerified: boolean
  jiraOrganization?: {
    organizationName: string
    domain: string
    email: string
    apiToken: string
  }
  createdAt: Date
  updatedAt: Date
}
```

## Migration from Old System

The old Jira-only authentication has been replaced with this new system. Users will need to:

1. Create new accounts with email/password
2. Configure their Jira organization settings in the profile page
3. The dashboard will work the same way once Jira settings are configured

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env.local

2. **JWT Secret Error**
   - Set a strong JWT_SECRET in .env.local
   - Restart the development server

3. **Jira Integration Not Working**
   - Check organization settings in profile page
   - Verify API token is correct
   - Test connection with "Test Jira" button

### Development Tips

- Check browser console for errors
- Use "Test Jira" panel to debug Jira integration
- Monitor MongoDB logs for database issues
- Use browser dev tools to inspect cookies and requests 