import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  email: string
  password: string
  firstName: string
  lastName: string
  isEmailVerified: boolean
  role: 'MANAGER' | 'DEVELOPER'
  organizationId?: string // Added organizationId field
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  jiraOrganization?: {
    organizationName: string
    domain: string
    email: string
    apiToken: string
  }
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
    required: true,
    minlength: 8
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
    enum: ['MANAGER', 'DEVELOPER'],
    default: 'DEVELOPER',
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: false // Will be set during onboarding or invitation
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  jiraOrganization: {
    organizationName: String,
    domain: String,
    email: String,
    apiToken: String
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
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
  return bcrypt.compare(candidatePassword, this.password)
}

// Prevent password from being returned in queries
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  delete user.emailVerificationToken
  delete user.emailVerificationExpires
  delete user.resetPasswordToken
  delete user.resetPasswordExpires
  return user
}

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema)