import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    // Get invitation token from query params (optional for regular login)
    const { searchParams } = new URL(req.url)
    const invitationToken = searchParams.get('token')
    
    // Generate secure random state
    const state = crypto.randomBytes(16).toString('hex')
    
    // Connect to database
    await dbConnect()
    
    let userToUpdate = null
    
    if (invitationToken) {
      // Invitation flow - find pending user by invitation token
      const pendingUser = await User.findOne({
        invitationToken: invitationToken,
        status: 'invited',
        role: 'DEVELOPER'
      })
      
      if (!pendingUser) {
        return NextResponse.json(
          { error: 'Invalid invitation token' },
          { status: 400 }
        )
      }
      
      userToUpdate = pendingUser
    } else {
      // Regular login flow - we can't create a temporary user here
      // because we don't know the Atlassian account ID yet
      // We'll need to handle this in the callback by checking if a user exists
      // For now, we'll create a minimal temporary record just for state storage
      const tempUser = new User({
        email: 'temp@oauth.com', // Temporary email
        firstName: 'OAuth',
        lastName: 'User',
        role: 'DEVELOPER',
        status: 'active',
        authMethods: ['atlassian'],
        oauthState: state,
        oauthStateExpires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      })
      
      await tempUser.save()
      userToUpdate = tempUser
    }
    
    // Store OAuth state in the user document
    await User.findByIdAndUpdate(userToUpdate._id, {
      oauthState: state,
      oauthStateExpires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    })
    
    // Build Atlassian OAuth URL
    const oauthParams = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: process.env.ATLASSIAN_CLIENT_ID! || "AQ4Zujyu75xdeva8L4VznCCbuDAk7iXG",
      scope: 'read:me read:account',
      redirect_uri: process.env.ATLASSIAN_REDIRECT_URI! || "https://bright-groups-smash.loca.lt/api/auth/atlassian/callback",
      response_type: 'code',
      state: state,
      prompt: 'consent'
    })
    
    // Use clean base URL without existing parameters
    const baseOAuthUrl = 'https://auth.atlassian.com/authorize'
    const oauthUrl = `${baseOAuthUrl}?${oauthParams.toString()}`

    console.log("OAuth URL ===>", oauthUrl)
    console.log("State generated ===>", state)
    console.log("Client ID ===>", process.env.ATLASSIAN_CLIENT_ID || "AQ4Zujyu75xdeva8L4VznCCbuDAk7iXG")
    console.log("Redirect URI ===>", process.env.ATLASSIAN_REDIRECT_URI || "https://27a4220d0039.ngrok-free.app/api/auth/atlassian/callback")
    console.log("Stored state in database for user:", userToUpdate._id)
    console.log("Login type:", invitationToken ? 'invitation' : 'regular')
    
    // Create response with redirect
    const response = NextResponse.redirect(oauthUrl)
    
    return response
    
  } catch (error) {
    console.error('OAuth login error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth login' },
      { status: 500 }
    )
  }
}
