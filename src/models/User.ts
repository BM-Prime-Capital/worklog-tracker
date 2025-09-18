import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  email: string
  password?: string // Made optional for Atlassian OAuth users
  firstName: string
  lastName: string
  isEmailVerified: boolean
  role: 'MANAGER' | 'DEVELOPER' | 'ADMIN'
  organizationId?: string // Added organizationId field
  
  // Authentication methods
  authMethods?: ('password' | 'atlassian')[]
  
  // Password fields (for MANAGER/ADMIN and developer fallback)
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  
  // Atlassian OAuth fields (for DEVELOPER role)
  atlassianAccountId?: string
  atlassianEmail?: string
  atlassianDisplayName?: string
  atlassianAvatarUrl?: string
  atlassianAccessToken?: string
  atlassianRefreshToken?: string
  atlassianTokenExpires?: Date
  
  // OAuth state fields (for temporary storage during OAuth flow)
  oauthState?: string
  oauthStateExpires?: Date
  
  // Invitation fields (for DEVELOPER role)
  status?: 'invited' | 'active' | 'suspended'
  isActive?: boolean
  invitedBy?: string
  invitedAt?: Date
  invitationToken?: string
  invitationExpires?: Date
  
  // Jira API integration (fallback method)
  jiraOrganization?: {
    organizationName: string
    domain: string
    email: string
    apiToken: string
  }
  
  // Professional information
  department?: 'software-engineering' | 'venture-capital' | 'graphic-design' | 'communication'
  employmentType?: 'permanent' | 'intern' | 'contractor' | 'consultant'
  
  // Notification settings
  notificationSettings?: {
    emailNotifications: boolean
    worklogReminders: boolean
    projectUpdates: boolean
    weeklyReports: boolean
  }
  
  // Activity tracking
  lastLogin?: Date
  
  // Audit fields
  createdBy?: string
  updatedBy?: string
  
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    validate: {
      validator: function(password: string) {
        // Only validate if password is provided
        if (!password) return true
        return password.length >= 8
      },
      message: 'Password must be at least 8 characters long'
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['MANAGER', 'DEVELOPER', 'ADMIN'],
    default: 'DEVELOPER',
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: false // Will be set during onboarding or invitation
  },
  
  // Authentication methods
  authMethods: [{
    type: String,
    enum: ['password', 'atlassian']
  }],
  
  // Password fields
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Atlassian OAuth fields
  atlassianAccountId: String,
  atlassianEmail: String,
  atlassianDisplayName: String,
  atlassianAvatarUrl: String,
  atlassianAccessToken: String,
  atlassianRefreshToken: String,
  atlassianTokenExpires: Date,
  
  // OAuth state fields (for temporary storage during OAuth flow)
  oauthState: String,
  oauthStateExpires: Date,
  
  // Invitation fields
  status: {
    type: String,
    enum: ['invited', 'active', 'suspended'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  invitedAt: Date,
  invitationToken: String,
  invitationExpires: Date,
  
  // Jira API integration
  jiraOrganization: {
    organizationName: String,
    domain: String,
    email: String,
    apiToken: String
  },
  
  // Professional information
  department: {
    type: String,
    enum: ['software-engineering', 'venture-capital', 'graphic-design', 'communication'],
    required: false
  },
  employmentType: {
    type: String,
    enum: ['permanent', 'intern', 'contractor', 'consultant'],
    required: false
  },
  
  // Notification settings
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    worklogReminders: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: false }
  },
  
  // Activity tracking
  lastLogin: Date,
  
  // Audit fields
  createdBy: String,
  updatedBy: String
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: unknown) {
    next(error as Error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

// Prevent sensitive data from being returned in queries
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  delete user.emailVerificationToken
  delete user.emailVerificationExpires
  delete user.resetPasswordToken
  delete user.resetPasswordExpires
  delete user.atlassianAccessToken
  delete user.atlassianRefreshToken
  delete user.invitationToken
  return user
}

// Clear existing model to avoid caching issues
if (mongoose.models.User) {
  delete mongoose.models.User
}

export default mongoose.model<IUser>('User', userSchema)