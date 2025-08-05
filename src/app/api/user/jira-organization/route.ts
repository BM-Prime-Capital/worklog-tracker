import { NextRequest, NextResponse } from 'next/server'
import { jiraOrganizationSchema } from '@/lib/validation'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import { verifyToken } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()

    // Get token from cookies
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = jiraOrganizationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { organizationName, domain, email, apiToken } = validationResult.data

    // Update user's Jira organization settings
    const user = await User.findByIdAndUpdate(
      payload.userId,
      {
        jiraOrganization: {
          organizationName,
          domain,
          email,
          apiToken
        }
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Jira organization settings updated successfully',
      jiraOrganization: user.jiraOrganization
    })

  } catch (error) {
    console.error('Update Jira organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 