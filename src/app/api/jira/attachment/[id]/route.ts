import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params Promise for Next.js 15+ compatibility
    const { id: mediaId } = await params
    
    // Get credentials from cookies or headers
    const credentials = await getCredentialsFromRequest(request)
    if (!credentials) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const auth = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64')
    const baseUrl = `https://${credentials.domain}/rest/api/3`

    // Try different Jira endpoints for media files
    let fileResponse
    let contentType = 'application/octet-stream'
    let filename = `file-${mediaId}`

    try {
      // First, try the Media API endpoint
      console.log('Trying Jira Media API endpoint...')
      fileResponse = await axios.get(`${baseUrl}/media/${mediaId}/binary`, {
        headers: { Authorization: `Basic ${auth}` },
        responseType: 'arraybuffer'
      })
      contentType = fileResponse.headers['content-type'] || 'application/octet-stream'
      console.log('Successfully fetched from Media API')
    } catch (mediaError) {
      console.log('Media API failed, trying attachment endpoint...')
      try {
        // Try the attachment content endpoint
        fileResponse = await axios.get(`${baseUrl}/attachment/content/${mediaId}`, {
          headers: { Authorization: `Basic ${auth}` },
          responseType: 'arraybuffer'
        })
        contentType = fileResponse.headers['content-type'] || 'application/octet-stream'
        console.log('Successfully fetched from attachment endpoint')
      } catch (attachmentError) {
        console.log('Attachment endpoint failed, trying metadata endpoint...')
        try {
          // Try to get metadata first, then content
          const metadataResponse = await axios.get(`${baseUrl}/attachment/${mediaId}`, {
            headers: { Authorization: `Basic ${auth}` }
          })
          
          const attachment = metadataResponse.data
          filename = attachment.filename || `file-${mediaId}`
          contentType = attachment.mimeType || 'application/octet-stream'
          
          // Now get the actual content
          fileResponse = await axios.get(`${baseUrl}/attachment/${mediaId}`, {
            headers: { Authorization: `Basic ${auth}` },
            responseType: 'arraybuffer'
          })
          console.log('Successfully fetched from metadata + content endpoint')
        } catch (metadataError) {
          console.error('All endpoints failed:', { mediaError, attachmentError, metadataError })
          return NextResponse.json({ 
            error: 'Failed to fetch file from all Jira endpoints',
            mediaId,
            details: 'Tried Media API, Attachment Content, and Metadata endpoints'
          }, { status: 404 })
        }
      }
    }

    // Return the file with proper headers
    const response = new NextResponse(fileResponse.data)
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `inline; filename="${filename}"`)
    response.headers.set('Cache-Control', 'public, max-age=3600')
    
    console.log(`Successfully served file: ${filename} (${contentType})`)
    return response
  } catch (error) {
    console.error('Error fetching media file:', error)
    return NextResponse.json({ error: 'Failed to fetch media file' }, { status: 500 })
  }
}

async function getCredentialsFromRequest(request: NextRequest) {
  // Try to get credentials from cookies first
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    if (cookies.jiraDomain && cookies.jiraEmail && cookies.jiraApiToken) {
      return {
        domain: cookies.jiraDomain,
        email: cookies.jiraEmail,
        apiToken: cookies.jiraApiToken
      }
    }
  }

  // Fallback: try to get from request body or headers
  try {
    const body = await request.json()
    if (body.credentials) {
      return body.credentials
    }
  } catch {
    // Ignore JSON parsing errors
  }

  return null
} 