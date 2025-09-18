import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // Connect to database first
    await dbConnect()

    // Debug logging
    console.log("Callback Debug Info:")
    console.log("Code:", code)
    console.log("State from URL:", state)

    // Validate state parameter (CSRF protection)
    if (!code || !state) {
      console.log("Missing code or state - redirecting to error page")
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL('/invite/accept?error=invalid_state', baseUrl)
      )
    }

    // Find user by OAuth state
    const pendingUser = await User.findOne({
      oauthState: state,
      oauthStateExpires: { $gt: new Date() }, // Not expired
      role: 'DEVELOPER'
    })

    if (!pendingUser) {
      console.log("No valid user found for state:", state)
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_state', baseUrl)
      )
    }

    console.log("Found user for state:", pendingUser._id)
    console.log("User status:", pendingUser.status)
    console.log("Invitation token:", pendingUser.invitationToken)

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.ATLASSIAN_CLIENT_ID || "AQ4Zujyu75xdeva8L4VznCCbuDAk7iXG",
        client_secret: process.env.ATLASSIAN_CLIENT_SECRET || "ATOAE8mWlJ2ISut3YWMnnklJF9ABIqkFJI_EjVIfP8tQ9Z-cF_irFycFx8LBdWnBl4P4A0DBCE68",
        code,
        redirect_uri: process.env.ATLASSIAN_REDIRECT_URI || "https://27a4220d0039.ngrok-free.app/api/auth/atlassian/callback",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL('/invite/accept?error=token_exchange_failed', baseUrl)
      )
    }

    // Fetch user profile from Atlassian
    const userResponse = await fetch('https://api.atlassian.com/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      console.error('User profile fetch failed:', userData)
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL('/invite/accept?error=profile_fetch_failed', baseUrl)
      )
    }

    // Handle different flows based on user status
    let updatedUser = null
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    console.log("Processing OAuth callback for user:", pendingUser._id)
    console.log("User status:", pendingUser.status)
    console.log("Atlassian account ID from OAuth:", userData.account_id)
    console.log("Atlassian email from OAuth:", userData.email)
    console.log("Atlassian display name from OAuth:", userData.name)

    if (pendingUser.status === 'invited') {
      // Invitation flow - check if invitation has expired
      if (pendingUser.invitationExpires && new Date() > pendingUser.invitationExpires) {
        return NextResponse.redirect(
          new URL('/invite/accept?error=invitation_expired', baseUrl)
        )
      }

      // Link Atlassian account to pending user
      updatedUser = await User.findByIdAndUpdate(pendingUser._id, {
        status: 'active',
        atlassianAccountId: userData.account_id,
        atlassianEmail: userData.email,
        atlassianDisplayName: userData.name,
        atlassianAvatarUrl: userData.picture,
        atlassianAccessToken: tokenData.access_token,
        atlassianRefreshToken: tokenData.refresh_token,
        atlassianTokenExpires: new Date(Date.now() + tokenData.expires_in * 1000),
        authMethods: ['atlassian'],
        isEmailVerified: true,
        // Clear invitation data
        invitationToken: undefined,
        invitationExpires: undefined,
        // Clear OAuth state data
        oauthState: undefined,
        oauthStateExpires: undefined
      }, { new: true })
    } else if (pendingUser.status === 'active') {
      // Regular login flow - check if user exists with this Atlassian account
      const existingUser = await User.findOne({
        atlassianAccountId: userData.account_id,
        status: 'active',
        role: 'DEVELOPER'
      })

      if (!existingUser) {
        // User not found - create a new user record with Atlassian account details
        // This allows developers to log in with Atlassian OAuth without being invited first
        console.log("Creating new user record for Atlassian OAuth login")
        
        // Clean up temporary user record
        if (pendingUser.email === 'temp@oauth.com') {
          await User.findByIdAndDelete(pendingUser._id)
        }
        
        // Create new user record with Atlassian account details
        const newUser = new User({
          email: userData.email,
          firstName: userData.name?.split(' ')[0] || 'Developer',
          lastName: userData.name?.split(' ').slice(1).join(' ') || 'User',
          role: 'DEVELOPER',
          status: 'active',
          atlassianAccountId: userData.account_id,
          atlassianEmail: userData.email,
          atlassianDisplayName: userData.name,
          atlassianAvatarUrl: userData.picture,
          atlassianAccessToken: tokenData.access_token,
          atlassianRefreshToken: tokenData.refresh_token,
          atlassianTokenExpires: new Date(Date.now() + tokenData.expires_in * 1000),
          authMethods: ['atlassian'],
          isEmailVerified: true
        })
        
        updatedUser = await newUser.save()
        console.log("Created new user record:", updatedUser._id)
      } else {
        // Update existing user with fresh tokens and ensure Atlassian details are saved
        updatedUser = await User.findByIdAndUpdate(existingUser._id, {
        atlassianAccountId: userData.account_id,
        atlassianEmail: userData.email,
        atlassianDisplayName: userData.name,
        atlassianAvatarUrl: userData.picture,
        atlassianAccessToken: tokenData.access_token,
        atlassianRefreshToken: tokenData.refresh_token,
        atlassianTokenExpires: new Date(Date.now() + tokenData.expires_in * 1000),
        authMethods: Array.from(new Set([...(existingUser.authMethods || []), 'atlassian'])),
        // Clear OAuth state data
        oauthState: undefined,
        oauthStateExpires: undefined
      }, { new: true })

        // Clean up temporary user record
        if (pendingUser.email === 'temp@oauth.com') {
          await User.findByIdAndDelete(pendingUser._id)
        }
      }
    } else {
      // Invalid user status
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_user_status', baseUrl)
      )
    }

    if (!updatedUser) {
      console.log("Failed to update user - updatedUser is null")
      return NextResponse.redirect(
        new URL('/auth/login?error=user_update_failed', baseUrl)
      )
    }

    console.log("Successfully updated user with Atlassian details:")
    console.log("Updated user ID:", updatedUser._id)
    console.log("Atlassian account ID:", updatedUser.atlassianAccountId)
    console.log("Atlassian email:", updatedUser.atlassianEmail)
    console.log("Atlassian display name:", updatedUser.atlassianDisplayName)

    // Create response with redirect to a custom session creation endpoint
    const sessionUrl = `/api/auth/atlassian/session?userId=${updatedUser._id}`
    
    console.log("Redirecting to session endpoint:", sessionUrl)
    console.log("User ID:", updatedUser._id)
    console.log("User email:", updatedUser.email)
    
    const response = NextResponse.redirect(
      new URL(sessionUrl, baseUrl)
    )

    return response

  } catch (error) {
    console.error('OAuth callback error:', error)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      new URL('/auth/login?error=callback_failed', baseUrl)
    )
  }
}
