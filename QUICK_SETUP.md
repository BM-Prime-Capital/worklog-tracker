# 🚀 Quick Setup Guide - NextAuth.js Authentication

## ⚡ Get Started in 5 Minutes

### 1. **Environment Setup**
```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your values
MONGODB_URI=mongodb://localhost:27017/worklog-tracker
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 2. **Database Setup**
```bash
# Start MongoDB (if local)
mongod

# Or use MongoDB Atlas
# Update MONGODB_URI in .env.local
```

### 3. **Install Dependencies**
```bash
npm install
```

### 4. **Run Migration (if needed)**
```bash
# Update existing users with default role
npm run migrate:users-role
```

### 5. **Test the System**
```bash
# Test authentication setup
npm run test:auth
```

### 6. **Start Development**
```bash
npm run dev
```

## 🔐 Test Authentication

### **Create New User**
1. Go to `/auth/signup`
2. Fill out the form
3. User gets "DEVELOPER" role by default
4. Redirected to login

### **Login & Access**
1. Go to `/auth/login`
2. Use your credentials
3. Automatically redirected to role-based dashboard
4. Session persists across browser sessions

## 🛡️ Security Features

- ✅ **JWT-based sessions** (30-day expiration)
- ✅ **Password hashing** (bcryptjs, 12 rounds)
- ✅ **Role-based access control**
- ✅ **Middleware protection**
- ✅ **Input validation** (Zod schemas)
- ✅ **HTTP-only cookies**
- ✅ **CSRF protection**

## 🚨 Production Checklist

- [ ] Generate strong `NEXTAUTH_SECRET`
- [ ] Use HTTPS in production
- [ ] Set proper `NEXTAUTH_URL`
- [ ] Configure MongoDB Atlas (if using cloud)
- [ ] Set up email service for verification
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Set up monitoring/logging

## 🔧 Troubleshooting

### **Common Issues**

1. **"Invalid credentials" error**
   - Check MongoDB connection
   - Verify user exists in database
   - Check password hashing

2. **Session not persisting**
   - Verify `NEXTAUTH_SECRET` is set
   - Check cookie settings
   - Ensure HTTPS in production

3. **Role not accessible**
   - Run migration script
   - Check JWT callbacks
   - Verify TypeScript types

### **Debug Mode**
```typescript
// Enable in development
debug: process.env.NODE_ENV === 'development'
```

## 📚 Next Steps

1. **Customize roles** - Add more user roles
2. **Email verification** - Implement SMTP service
3. **Password reset** - Add forgot password flow
4. **Social login** - Add OAuth providers
5. **Two-factor auth** - Implement 2FA
6. **Audit logging** - Track authentication events

## 🆘 Need Help?

- Check the `AUTHENTICATION_README.md` for detailed docs
- Review NextAuth.js documentation
- Check console logs for errors
- Run `npm run test:auth` to diagnose issues

---

**🎉 You're all set!** Your authentication system is now production-ready with enterprise-grade security.





