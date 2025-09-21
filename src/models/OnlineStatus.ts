import mongoose, { Document, Schema } from 'mongoose'

export interface IOnlineStatus extends Document {
  userId: string
  atlassianAccountId: string
  organizationId: string
  status: 'present' | 'absent'
  mood: 'happy' | 'excited' | 'focused' | 'energetic' | 'motivated' | 'sick' | 'tired' | 'present'
  description?: string
  date: string // YYYY-MM-DD format
  time: string // HH:MM format
  checkInType: 'early' | 'on-time' | 'late'
  
  // Organization check-in window snapshot at time of check-in
  organizationCheckInWindow: {
    startTime: string
    endTime: string
    timezone: string
  }
  
  // Update tracking for manager modifications
  isEdited: boolean
  editedBy?: string // userId of the manager who edited
  editedAt?: Date
  editReason?: string
  originalStatus?: 'present' | 'absent'
  originalMood?: string
  originalDescription?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

const OnlineStatusSchema = new Schema<IOnlineStatus>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  atlassianAccountId: {
    type: String,
    required: true,
    index: true
  },
  organizationId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  mood: {
    type: String,
    enum: ['happy', 'excited', 'focused', 'energetic', 'motivated', 'sick', 'tired', 'present'],
    default: 'present'
  },
  description: {
    type: String,
    maxlength: 500
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  time: {
    type: String,
    required: true
  },
  checkInType: {
    type: String,
    enum: ['early', 'on-time', 'late'],
    required: true
  },
  organizationCheckInWindow: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    timezone: {
      type: String,
      required: true
    }
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedBy: {
    type: String
  },
  editedAt: {
    type: Date
  },
  editReason: {
    type: String,
    maxlength: 200
  },
  originalStatus: {
    type: String,
    enum: ['present', 'absent']
  },
  originalMood: {
    type: String
  },
  originalDescription: {
    type: String
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
OnlineStatusSchema.index({ userId: 1, date: 1 }, { unique: true }) // One check-in per user per day
OnlineStatusSchema.index({ organizationId: 1, date: 1 })
OnlineStatusSchema.index({ atlassianAccountId: 1, date: 1 })

export default mongoose.models.OnlineStatus || mongoose.model<IOnlineStatus>('OnlineStatus', OnlineStatusSchema)
