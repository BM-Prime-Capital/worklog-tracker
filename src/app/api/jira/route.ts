import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const { action, credentials, params } = await request.json()

    if (!credentials || !credentials.domain || !credentials.email || !credentials.apiToken) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const auth = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64')
    const baseUrl = `https://${credentials.domain}/rest/api/3`

    let response

    switch (action) {
      case 'test-connection':
        response = await axios.get(`${baseUrl}/myself`, {
          headers: { Authorization: `Basic ${auth}` }
        })
        return NextResponse.json({ success: true, user: response.data })

      case 'get-worklogs':
        const { startDate, endDate, projectKeys } = params
        const jql = buildWorklogJQL(startDate, endDate, projectKeys)

        response = await axios.get(`${baseUrl}/search`, {
          headers: { Authorization: `Basic ${auth}` },
          params: {
            jql,
            fields: 'summary,status,assignee,worklog,attachment',
            maxResults: 1000,
            expand: 'worklog,worklog.attachment'
          }
        })

        const worklogs = extractWorklogs(response.data.issues, startDate, endDate)
        // console.log('Jira API get-worklogs response - issues count:', response.data.issues?.length)
        // console.log('Jira API get-worklogs response - first issue fields:', response.data.issues?.[0]?.fields)
        // console.log('Jira API get-worklogs response - extracted worklogs count:', worklogs.length)
        // console.log('Jira API get-worklogs response - first worklog:', worklogs[0])
        return NextResponse.json({ worklogs })

      case 'get-users':
        response = await axios.get(`${baseUrl}/users/search`, {
          headers: { Authorization: `Basic ${auth}` },
          params: { maxResults: 1000 }
        })
        return NextResponse.json({
          users: response.data.filter((user: { active: boolean; accountType?: string }) =>
            user.active && user.accountType === 'atlassian'
          )
        })

      case 'get-issues':
        const { projectKeys: issueProjectKeys, maxResults } = params
        let issueJql = 'ORDER BY updated DESC'

        if (issueProjectKeys && issueProjectKeys.length > 0) {
          const projectClause = issueProjectKeys.map((key: string) => `project = ${key}`).join(' OR ')
          issueJql = `(${projectClause}) AND ${issueJql}`
        }

        response = await axios.get(`${baseUrl}/search`, {
          headers: { Authorization: `Basic ${auth}` },
          params: {
            jql: issueJql,
            fields: 'summary,status,assignee,created,updated',
            maxResults: maxResults || 50
          }
        })
        // console.log('Jira API get-issues response:', response.data)
        return NextResponse.json({ issues: response.data.issues })

      case 'get-recent-issues':
        const { maxResults: recentMaxResults } = params
        response = await axios.get(`${baseUrl}/search`, {
          headers: { Authorization: `Basic ${auth}` },
          params: {
            jql: 'ORDER BY updated DESC',
            fields: 'summary,status,assignee,created,updated,project',
            maxResults: recentMaxResults || 50
          }
        })
        // console.log('Jira API get-recent-issues response:', response.data)
        return NextResponse.json({ issues: response.data.issues })

      case 'get-project-issue-count':
        const { projectKey } = params
        response = await axios.get(`${baseUrl}/search`, {
          headers: { Authorization: `Basic ${auth}` },
          params: {
            jql: `project = ${projectKey}`,
            maxResults: 0
          }
        })
        console.log(`Jira API get-project-issue-count response for ${projectKey}:`, response.data)
        return NextResponse.json({ total: response.data.total })

      case 'get-project-done-issues-count':
        const { projectKey: doneProjectKey } = params
        response = await axios.get(`${baseUrl}/search`, {
          headers: { Authorization: `Basic ${auth}` },
          params: {
            jql: `project = ${doneProjectKey} AND statusCategory = Done`,
            maxResults: 0
          }
        })
        console.log(`Jira API get-project-done-issues-count response for ${doneProjectKey}:`, response.data)
        return NextResponse.json({ total: response.data.total })

      case 'get-project-stats':
        const { projectKey: statsProjectKey } = params

        // Fetch total issues count
        const totalResponse = await axios.get(`${baseUrl}/search`, {
          headers: { Authorization: `Basic ${auth}` },
          params: {
            jql: `project = ${statsProjectKey}`,
            maxResults: 0
          }
        })

        // Fetch done issues count
        const doneResponse = await axios.get(`${baseUrl}/search`, {
          headers: { Authorization: `Basic ${auth}` },
          params: {
            jql: `project = ${statsProjectKey} AND statusCategory = Done`,
            maxResults: 0
          }
        })

        const totalIssues = totalResponse.data.total || 0
        const doneIssues = doneResponse.data.total || 0
        const progressPercentage = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0

        console.log(`Jira API get-project-stats response for ${statsProjectKey}:`, {
          totalIssues,
          doneIssues,
          progressPercentage
        })

        return NextResponse.json({
          totalIssues,
          doneIssues,
          progressPercentage
        })

      case 'get-projects':
        response = await axios.get(`${baseUrl}/project`, {
          headers: { Authorization: `Basic ${auth}` }
        })
        return NextResponse.json({ projects: response.data })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Jira API error:', error)

    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

function buildWorklogJQL(startDate: string, endDate: string, projectKeys?: string[]): string {
  let worklogJql = `worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`

  if (projectKeys && projectKeys.length > 0) {
    const projectClause = projectKeys.map(key => `project = ${key}`).join(' OR ')
    worklogJql += ` AND (${projectClause})`
  }

  return worklogJql
}

function extractWorklogs(issues: unknown[], startDate: string, endDate: string) {
  const worklogs: unknown[] = []

  // console.log('Extracting worklogs for date range:', startDate, 'to', endDate)

  for (const issue of issues) {
    if (issue && typeof issue === 'object' && 'fields' in issue && issue.fields && typeof issue.fields === 'object' && 'worklog' in issue.fields && issue.fields.worklog && typeof issue.fields.worklog === 'object' && 'worklogs' in issue.fields.worklog && Array.isArray(issue.fields.worklog.worklogs)) {
      for (const worklog of issue.fields.worklog.worklogs) {
        if (worklog && typeof worklog === 'object' && 'started' in worklog && typeof worklog.started === 'string') {
          const worklogDate = new Date(worklog.started)
          // Create dates in local timezone for consistent comparison
          const start = new Date(startDate + 'T00:00:00.000Z')
          const end = new Date(endDate + 'T23:59:59.999Z')

          // Extract just the date part for comparison (YYYY-MM-DD)
          const worklogDateOnly = worklogDate.toISOString().split('T')[0]
          const startDateOnly = start.toISOString().split('T')[0]
          const endDateOnly = end.toISOString().split('T')[0]
          //
          // console.log('Worklog date:', worklog.started, '->', worklogDate.toISOString(), '->', worklogDateOnly)
          // console.log('Date range:', start.toISOString(), 'to', end.toISOString())
          // console.log('Date range (date only):', startDateOnly, 'to', endDateOnly)
          // console.log('Is in range (date only):', worklogDateOnly >= startDateOnly && worklogDateOnly <= endDateOnly)
          //
          if (worklogDateOnly >= startDateOnly && worklogDateOnly <= endDateOnly) {
            // Enhanced comment extraction with debugging
            let commentText: string | undefined
            let attachments: unknown[] = []

            // Check for attachments in the worklog itself
            if (worklog && typeof worklog === 'object' && 'attachment' in worklog && worklog.attachment) {
              console.log('Found worklog attachment:', worklog.attachment)
              if (Array.isArray(worklog.attachment)) {
                worklog.attachment.forEach((att: unknown) => {
                  if (att && typeof att === 'object' && 'id' in att) {
                    attachments.push({
                      type: 'jira-file',
                      data: att
                    })
                  }
                })
              } else if (typeof worklog.attachment === 'object' && worklog.attachment !== null) {
                attachments.push({
                  type: 'jira-file',
                  data: worklog.attachment
                })
              }
            }

            if (worklog && typeof worklog === 'object' && 'comment' in worklog && worklog.comment) {
              console.log('Processing worklog comment:', worklog.comment)
              console.log('Comment type:', typeof worklog.comment)

              if (typeof worklog.comment === 'string') {
                commentText = worklog.comment
                console.log('String comment extracted:', commentText)
              } else if (typeof worklog.comment === 'object' && worklog.comment !== null) {
                console.log('Object comment structure:', JSON.stringify(worklog.comment, null, 2))

                // Handle Jira's structured content format
                if ('content' in worklog.comment && Array.isArray((worklog.comment as { content: unknown[] }).content)) {
                  const content = (worklog.comment as { content: unknown[] }).content
                  commentText = extractTextFromContent(content)
                  const commentAttachments = extractAttachmentsFromContent(content)
                  attachments = [...attachments, ...commentAttachments]
                  // console.log('Extracted text from content:', commentText)
                  // console.log('Extracted attachments from comment:', commentAttachments)
                } else if ('text' in worklog.comment && typeof (worklog.comment as { text: string }).text === 'string') {
                  commentText = (worklog.comment as { text: string }).text
                  // console.log('Direct text extracted:', commentText)
                }
              }
            } else {
              console.log('No comment found in worklog')
            }

            console.log('Final comment text:', commentText)
            console.log('Final attachments:', attachments)

            worklogs.push({
              ...worklog,
              issueKey: 'key' in issue && typeof issue.key === 'string' ? issue.key : '',
              summary: 'summary' in issue.fields && typeof issue.fields.summary === 'string' ? issue.fields.summary : '',
              comment: commentText,
              attachments
            })
          }
        }
      }
    }
  }
  //
  // console.log('Total worklogs extracted:', worklogs.length)
  // console.log('Worklogs with comments:', worklogs.filter(w => w && typeof w === 'object' && 'comment' in w && w.comment).length)

  return worklogs
}

function extractTextFromContent(content: unknown[]): string {
  const texts: string[] = []

  function extractFromNode(node: unknown): void {
    if (typeof node === 'object' && node !== null) {
      if ('text' in node && typeof (node as { text: string }).text === 'string') {
        texts.push((node as { text: string }).text)
      }

      if ('content' in node && Array.isArray((node as { content: unknown[] }).content)) {
        (node as { content: unknown[] }).content.forEach(extractFromNode)
      }

      if ('attrs' in node && typeof (node as { attrs: unknown }).attrs === 'object' && (node as { attrs: unknown }).attrs !== null) {
        const attrs = (node as { attrs: unknown }).attrs
        if (typeof attrs === 'object' && attrs !== null && 'text' in attrs && typeof (attrs as { text: string }).text === 'string') {
          texts.push((attrs as { text: string }).text)
        }
      }
    }
  }

  content.forEach(extractFromNode)
  return texts.join(' ')
}

function extractAttachmentsFromContent(content: unknown[]): unknown[] {
  const attachments: unknown[] = []
  // console.log('Extracting attachments from content:', content)

  function extractFromNode(node: unknown): void {
    if (typeof node === 'object' && node !== null) {
      // Handle Jira file attachments
      if ('attrs' in node && typeof (node as { attrs: unknown }).attrs === 'object' && (node as { attrs: unknown }).attrs !== null) {
        const attrs = (node as { attrs: unknown }).attrs
        if (typeof attrs === 'object' && attrs !== null) {
          // Check for file attachment
          if ('file' in attrs && typeof (attrs as { file: unknown }).file === 'object' && (attrs as { file: unknown }).file !== null) {
            // console.log('Found file attachment:', (attrs as { file: unknown }).file)
            attachments.push({
              type: 'jira-file',
              data: (attrs as { file: unknown }).file
            })
          }
          
          // Check for media attachment
          if ('media' in attrs && typeof (attrs as { media: unknown }).media === 'object' && (attrs as { media: unknown }).media !== null) {
            // console.log('Found media attachment:', (attrs as { media: unknown }).media)
            attachments.push({
              type: 'jira-media',
              data: (attrs as { media: unknown }).media
            })
          }
        }
      }

      // Handle embedded content (like images)
      if ('type' in node && typeof (node as { type: string }).type === 'string') {
        const nodeType = (node as { type: string }).type
        if (nodeType === 'media' || nodeType === 'mediaGroup') {
          console.log('Found embedded media:', node)
          attachments.push({
            type: 'embedded-media',
            data: node
          })
        }
      }

      // Recursively process child content
      if ('content' in node && Array.isArray((node as { content: unknown[] }).content)) {
        (node as { content: unknown[] }).content.forEach(extractFromNode)
      }
    }
  }

  content.forEach(extractFromNode)
  console.log('Final extracted attachments:', attachments)
  return attachments
}
