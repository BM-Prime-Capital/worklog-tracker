import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import OnlineStatus from '@/models/OnlineStatus'
import User from '@/models/User'
import Organization from '@/models/Organization'

export async function PUT(request: NextRequest) {
  try {
   
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recordId, status, mood, description, editReason } = await request.json()

    if (!recordId) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    await dbConnect()

    
    const user = await User.findById((session.user as any).id)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User is not associated with an organization' }, { status: 400 })
    }

    // Find the online status record
    
    const onlineStatus = await OnlineStatus.findOne({
      _id: recordId,
      organizationId: user.organizationId
    })

    if (!onlineStatus) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Store original status for audit trail
    const originalStatus = {
      status: onlineStatus.status,
      mood: onlineStatus.mood,
      description: onlineStatus.description,
      time: onlineStatus.time,
      checkInType: onlineStatus.checkInType
    }

    // Update the record
    onlineStatus.status = status || onlineStatus.status
    onlineStatus.mood = mood !== undefined ? mood : onlineStatus.mood
    onlineStatus.description = description !== undefined ? description : onlineStatus.description
    onlineStatus.isEdited = true
    onlineStatus.editedBy = user._id
    onlineStatus.editedAt = new Date()
    onlineStatus.editReason = editReason || 'Updated by manager'
    onlineStatus.originalStatus = originalStatus

    await onlineStatus.save()

    return NextResponse.json({
      success: true,
      message: 'Record updated successfully',
      record: {
        id: onlineStatus._id,
        userId: onlineStatus.userId,
        atlassianAccountId: onlineStatus.atlassianAccountId,
        status: onlineStatus.status,
        mood: onlineStatus.mood,
        description: onlineStatus.description,
        date: onlineStatus.date,
        time: onlineStatus.time,
        checkInType: onlineStatus.checkInType,
        isEdited: onlineStatus.isEdited,
        editedBy: onlineStatus.editedBy,
        editedAt: onlineStatus.editedAt,
        editReason: onlineStatus.editReason,
        originalStatus: onlineStatus.originalStatus
      }
    })

  } catch (error) {
    console.error('Edit online status error:', error)
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
   
    const session = await (getServerSession as any)(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId')

    if (!recordId) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    await dbConnect()

   
    const user = await User.findById((session.user as any).id)
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User is not associated with an organization' }, { status: 400 })
    }

    // Find and delete the online status record
  
    const onlineStatus = await OnlineStatus.findOneAndDelete({
      _id: recordId,
      organizationId: user.organizationId
    })

    if (!onlineStatus) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully'
    })

  } catch (error) {
    console.error('Delete online status error:', error)
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    )
  }
}
