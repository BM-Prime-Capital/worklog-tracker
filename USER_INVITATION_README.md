# User Invitation System

This document describes the user invitation system that allows managers to invite new developers to join the Worklog Tracker platform.

## 🚀 Overview

The invitation system provides a secure way for managers to:
- Create new user accounts with the role "DEVELOPER"
- Send professional invitation emails to new team members
- Allow invited users to set their own passwords
- Automatically activate accounts upon password setup

## 🏗️ Architecture

### **Components**

1. **Invitation API** (`/api/users/invite`)
   - Manager-only endpoint for creating new users
   - Generates temporary passwords and reset tokens
   - Sends invitation emails

2. **Email Service** (`src/lib/emailService.ts`)
   - Handles SMTP configuration and email sending
   - Generates professional HTML and text email templates
   - Configurable company branding

3. **Password Setup Flow**
   - Token validation (`/api/auth/validate-reset-token`)
   - Password setting (`/api/auth/set-password`)
   - User-friendly setup page (`/auth/set-password`)

### **Security Features**

- **Manager-only access**: Only users with MANAGER role can invite new users
- **Secure tokens**: 32-byte random hex tokens with 24-hour expiration
- **Password requirements**: Minimum 8 characters, automatically hashed
- **Email verification**: Accounts are verified when passwords are set

## 📧 Email Configuration

### **Environment Variables**

Add these to your `.env.local` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Company Branding
COMPANY_NAME=BM Prime Capital
```

### **Gmail Setup (Recommended)**

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password as `SMTP_PASS`

### **Testing Email Configuration**

```bash
npm run test:email
```

This will verify your SMTP settings and test the connection.

## 🔄 User Flow

### **1. Manager Invites User**

1. Manager navigates to Team Management page
2. Clicks "Invite Member" button
3. Fills out user information:
   - First Name
   - Last Name
   - Email (user@company.com)
   - Department
   - Employment Type
4. Submits invitation

### **2. System Processing**

1. Creates user account with role "DEVELOPER"
2. Generates secure reset token (24-hour validity)
3. Sends professional invitation email
4. Returns success confirmation

### **3. User Account Setup**

1. User receives invitation email
2. Clicks invitation link
3. Sets secure password
4. Account is automatically activated
5. User can now log in

## 📱 User Interface

### **Manager Interface**

- **Team Management Page**: `/dashboard/manager/team`
- **Invite Member Modal**: Professional form with validation
- **Success Feedback**: Clear confirmation of invitation sent

### **User Setup Interface**

- **Password Setup Page**: `/auth/set-password?token=<token>`
- **Token Validation**: Automatic validation of invitation links
- **Password Requirements**: Clear guidance on password strength
- **Success Flow**: Automatic redirect to login after setup

## 🛠️ API Endpoints

### **POST /api/users/invite**

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "department": "software-engineering",
  "employmentType": "permanent"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User invited successfully",
  "user": {
    "id": "user_id",
    "email": "john.doe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "DEVELOPER",
    "isEmailVerified": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "emailSent": true
}
```

### **POST /api/auth/validate-reset-token**

**Request Body:**
```json
{
  "token": "reset_token_from_email"
}
```

### **POST /api/auth/set-password**

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "new_secure_password"
}
```

## 🔒 Security Considerations

### **Token Security**

- Tokens are cryptographically secure (32 bytes)
- 24-hour expiration prevents long-term token abuse
- Tokens are single-use and cleared after password setup

### **Access Control**

- Only managers can create new user accounts
- Invited users automatically get DEVELOPER role
- No escalation of privileges through invitation system

### **Password Security**

- Minimum 8 character requirement
- Automatic bcrypt hashing (12 rounds)
- Passwords never stored in plain text

## 🚨 Error Handling

### **Common Scenarios**

1. **Invalid Token**: Clear error message with contact instructions
2. **Expired Token**: Automatic detection and user guidance
3. **Email Failure**: Graceful degradation (user created, email logged)
4. **Duplicate Email**: Prevents duplicate account creation

### **User Feedback**

- Clear error messages for validation failures
- Loading states during API calls
- Success confirmations for completed actions
- Helpful guidance for next steps

## 🔧 Troubleshooting

### **Email Not Sending**

1. Check SMTP configuration in `.env.local`
2. Verify Gmail App Password is correct
3. Run `npm run test:email` to diagnose issues
4. Check console logs for detailed error messages

### **Token Validation Fails**

1. Ensure token hasn't expired (24 hours)
2. Check database connection
3. Verify token format (32 hex characters)

### **User Creation Fails**

1. Check manager authentication
2. Verify required fields are provided
3. Check for duplicate email addresses
4. Review database connection and permissions

## 🚀 Future Enhancements

### **Planned Features**

1. **Bulk Invitations**: Invite multiple users at once
2. **Custom Email Templates**: Company-specific branding
3. **Invitation Tracking**: Monitor invitation status and responses
4. **Role Customization**: Allow managers to set specific roles
5. **Department Mapping**: Automatic team assignment based on department

### **Integration Opportunities**

1. **HR Systems**: Sync with existing employee databases
2. **SSO Integration**: Single sign-on for enterprise users
3. **Audit Logging**: Track all invitation and account creation events
4. **Approval Workflows**: Multi-level approval for new user creation

## 📚 Related Documentation

- [Authentication System](./AUTHENTICATION_README.md)
- [Team Management](./README.md)
- [Database Models](./src/models/User.ts)
- [Email Service](./src/lib/emailService.ts)

---

For technical support or questions about the invitation system, please contact the development team.







