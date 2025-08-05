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
            fields: 'summary,status,assignee,worklog',
            maxResults: 1000,
            expand: 'worklog'
          }
        })

        const worklogs = extractWorklogs(response.data.issues, startDate, endDate)
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
        console.log('Jira API get-issues response:', response.data)
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
        console.log('Jira API get-recent-issues response:', response.data)
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
  
  for (const issue of issues) {
    if (issue && typeof issue === 'object' && 'fields' in issue && issue.fields && typeof issue.fields === 'object' && 'worklog' in issue.fields && issue.fields.worklog && typeof issue.fields.worklog === 'object' && 'worklogs' in issue.fields.worklog && Array.isArray(issue.fields.worklog.worklogs)) {
      for (const worklog of issue.fields.worklog.worklogs) {
        if (worklog && typeof worklog === 'object' && 'started' in worklog && typeof worklog.started === 'string') {
          const worklogDate = new Date(worklog.started)
          const start = new Date(startDate)
          const end = new Date(endDate)
          
          if (worklogDate >= start && worklogDate <= end) {
            // Handle comment field - extract text if it's an object
            let commentText: string | undefined
            if (worklog && typeof worklog === 'object' && 'comment' in worklog && worklog.comment) {
              if (typeof worklog.comment === 'string') {
                commentText = worklog.comment
              } else if (typeof worklog.comment === 'object' && worklog.comment !== null && 'content' in worklog.comment) {
                // Extract text from Jira's structured content format
                const content = (worklog.comment as { content: unknown[] }).content
                if (Array.isArray(content)) {
                  commentText = content
                    .filter(item => typeof item === 'object' && item !== null && 'text' in item)
                    .map(item => (item as { text: string }).text)
                    .join(' ')
                }
              }
            }

            worklogs.push({
              ...worklog,
              issueKey: 'key' in issue && typeof issue.key === 'string' ? issue.key : '',
              summary: 'summary' in issue.fields && typeof issue.fields.summary === 'string' ? issue.fields.summary : '',
              comment: commentText
            })
          }
        }
      }
    }
  }
  
  return worklogs
} 