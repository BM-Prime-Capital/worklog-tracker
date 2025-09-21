import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { JiraWorklog } from './jiraApiEnhanced'
import { formatHours } from './timeUtils'

// Extend jsPDF with autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
    lastAutoTable?: {
      finalY: number
    }
  }
}

// Apply the autotable plugin to jsPDF
(jsPDF.prototype as unknown as { autoTable: typeof autoTable }).autoTable = autoTable

interface ExportOptions {
  startDate: Date
  endDate: Date
  worklogs: JiraWorklog[]
  exportTimestamp: Date
  includeIndividualReports: boolean
}

interface DeveloperSummary {
  displayName: string
  emailAddress: string
  totalHours: number
  worklogs: JiraWorklog[]
}

export class PDFExportService {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private margin: number = 20
  private lineHeight: number = 7

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.currentY = this.margin
  }

  /**
   * Helper method to safely get the final Y position after autoTable
   */
  private getLastAutoTableFinalY(fallbackOffset: number = 15): number {
    const finalY = this.doc.lastAutoTable?.finalY
    return finalY ? finalY + fallbackOffset : this.currentY + fallbackOffset
  }

  /**
   * Main export function that generates the complete report
   */
  async exportWorklogReport(options: ExportOptions): Promise<Blob> {
    try {
      // Generate team overview
      this.generateTeamOverview(options)
      
      // Generate individual reports if requested
      if (options.includeIndividualReports) {
        this.generateIndividualReports(options)
      }

      // Add export metadata
      this.addExportMetadata(options.exportTimestamp)

      // Add page numbers to all pages (single, authoritative pass)
      this.addPageNumbersFooter()

      // Convert to blob
      const pdfBlob = this.doc.output('blob')
      return pdfBlob
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF report')
    }
  }

  /**
   * Generate team overview section
   */
  private generateTeamOverview(options: ExportOptions): void {
    // Header
    this.addPageHeader('Team Worklog Overview Report')
    
    // Period confirmation
    this.addPeriodConfirmation(options.startDate, options.endDate)
    
    // Team summary statistics
    this.addTeamSummary(options.worklogs)
    
    // Developer list
    this.addDeveloperList(options.worklogs)
    
    // Add page break
    this.addPageBreak()
  }

  /**
   * Generate individual developer reports
   */
  private generateIndividualReports(options: ExportOptions): void {
    const developers = this.groupWorklogsByDeveloper(options.worklogs)
    
    developers.forEach((developer, index) => {
      if (index > 0) {
        this.addPageBreak()
      }
      
      this.generateDeveloperReport(developer)
    })
  }

  /**
   * Generate individual developer report
   */
  private generateDeveloperReport(developer: DeveloperSummary): void {
    // Developer header
    this.addDeveloperHeader(developer.displayName)
    
    // Developer summary
    this.addDeveloperSummary(developer.totalHours, developer.worklogs.length)
    
    // Worklog table
    this.addWorklogTable(developer.worklogs)
  }

  /**
   * Add page header with title and company logo
   */
  private addPageHeader(title: string): void {
    // Add company logo
    try {
      // Logo dimensions and positioning
      const logoWidth = 60 // 60mm width
      const logoHeight = 20 // 20mm height
      const logoX = this.margin
      const logoY = this.currentY
      
      // Add the logo image
      this.doc.addImage('/bmprimebanner.png', 'PNG', logoX, logoY, logoWidth, logoHeight)
      
      // Move currentY below the logo
      this.currentY += logoHeight + 10
    } catch {
      console.warn('Could not load company logo, continuing without it')
      this.currentY += 5 // Small spacing if logo fails to load
    }
    
    // Add title
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(44, 62, 80)
    
    const titleWidth = this.doc.getTextWidth(title)
    const titleX = (this.pageWidth - titleWidth) / 2
    
    this.doc.text(title, titleX, this.currentY)
    this.currentY += 15
  }

  /**
   * Add period confirmation section
   */
  private addPeriodConfirmation(startDate: Date, endDate: Date): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(52, 73, 94)
    
    this.doc.text('Report Period', this.margin, this.currentY)
    this.currentY += 8
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(44, 62, 80)
    
    const periodText = `${format(startDate, 'EEEE, MMMM d, yyyy')} - ${format(endDate, 'EEEE, MMMM d, yyyy')}`
    this.doc.text(periodText, this.margin, this.currentY)
    this.currentY += 12
    
    // Warning about data relevance
    this.doc.setFontSize(10)
    this.doc.setTextColor(231, 76, 60)
    
    // Break the long warning into multiple lines
    const warningLines = [
      'Note: This report reflects data as of the export time.',
      'Team members may have continued working after this report was generated.',
      'Report covers Monday to Saturday business operations (Saturday included only if work activity exists).'
    ]
    
    warningLines.forEach((line, index) => {
      this.doc.text(line, this.margin, this.currentY + (index * 5))
    })
    
    this.currentY += 25 // Increased spacing to accommodate three lines
  }

  /**
   * Add team summary statistics
   */
  private addTeamSummary(worklogs: JiraWorklog[]): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(52, 73, 94)
    
    this.doc.text('Team Summary', this.margin, this.currentY)
    this.currentY += 8
    
    // Calculate statistics
    const totalHours = worklogs.reduce((total, w) => total + (w.timeSpentSeconds / 3600), 0)
    const uniqueDevelopers = new Set(worklogs.map(w => w.author.displayName)).size
    const uniqueIssues = new Set(worklogs.map(w => w.issueKey)).size
    
    // Create summary table
    const summaryData = [
      ['Total Hours', formatHours(totalHours)],
      ['Total Developers', uniqueDevelopers.toString()],
      ['Total Issues', uniqueIssues.toString()],
      ['Total Worklog Entries', worklogs.length.toString()]
    ]
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: 44
      },
      margin: { left: this.margin, bottom: 20 }, // Reserve bottom space for footer
      tableWidth: this.pageWidth - (this.margin * 2)
    })
    
    this.currentY = this.getLastAutoTableFinalY()
  }

  /**
   * Add developer list section
   */
  private addDeveloperList(worklogs: JiraWorklog[]): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(52, 73, 94)
    
    this.doc.text('Team Members', this.margin, this.currentY)
    this.currentY += 8
    
    // Group worklogs by developer
    const developers = this.groupWorklogsByDeveloper(worklogs)
    
    // Create developer table
    const developerData = developers.map(dev => [
      dev.displayName,
      'Software Engineer', // Position instead of email
      formatHours(dev.totalHours),
      dev.worklogs.length.toString()
    ])
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Developer', 'Position', 'Total Hours', 'Worklog Entries']],
      body: developerData,
      theme: 'grid',
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: 44
      },
      margin: { left: this.margin, bottom: 20 }, // Reserve bottom space for footer
      tableWidth: this.pageWidth - (this.margin * 2)
    })
    
    this.currentY = this.getLastAutoTableFinalY()
  }

  /**
   * Add company logo to any section
   */
  private addCompanyLogo(): void {
    try {
      // Logo dimensions and positioning
      const logoWidth = 40 // Smaller logo for section headers
      const logoHeight = 13 // Proportional height
      const logoX = this.margin
      const logoY = this.currentY
      
      // Add the logo image
      this.doc.addImage('/bmprimebanner.png', 'PNG', logoX, logoY, logoWidth, logoHeight)
      
      // Move currentY below the logo
      this.currentY += logoHeight + 5
    } catch {
      console.warn('Could not load company logo, continuing without it')
      this.currentY += 3 // Small spacing if logo fails to load
    }
  }

  /**
   * Add developer header
   */
  private addDeveloperHeader(displayName: string): void {
    // Add company logo
    this.addCompanyLogo()
    
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(52, 73, 94)
    
    this.doc.text(`Developer Report: ${displayName}`, this.margin, this.currentY)
    this.currentY += 6
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(44, 62, 80)
    
    this.doc.text(`Position: Software Engineer`, this.margin, this.currentY)
    this.currentY += 12
  }

  /**
   * Add developer summary
   */
  private addDeveloperSummary(totalHours: number, worklogCount: number): void {
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(52, 73, 94)
    
    this.doc.text('Summary:', this.margin, this.currentY)
    this.currentY += 6
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(44, 62, 80)
    
    this.doc.text(`• Total Hours: ${formatHours(totalHours)}`, this.margin, this.currentY)
    this.currentY += 5
    
    this.doc.text(`• Total Worklog Entries: ${worklogCount}`, this.margin, this.currentY)
    this.currentY += 12
  }

  /**
   * Add worklog table for individual developer
   */
  private addWorklogTable(worklogs: JiraWorklog[]): void {
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(52, 73, 94)
    
    this.doc.text('Detailed Worklog Entries:', this.margin, this.currentY)
    this.currentY += 8
    
    // Sort worklogs by date and group by day
    const sortedWorklogs = worklogs.sort((a, b) => 
      new Date(a.started).getTime() - new Date(b.started).getTime()
    )
    
    // Group by day of the week
    const worklogsByDay = this.groupWorklogsByDay(sortedWorklogs)
    
    // Generate table for each day
    worklogsByDay.forEach(({ day, worklogs: dayWorklogs }) => {
      if (dayWorklogs.length > 0) {
        // Check if we have enough space for the day header + table
        // We need space for: day header (6mm) + table header + at least one row + some buffer
        const estimatedTableHeight = 6 + 8 + (dayWorklogs.length * 6) + 20 // day header + table header + rows + buffer
        const pageHeight = this.doc.internal.pageSize.getHeight()
        const availableSpace = pageHeight - this.currentY - this.margin
        
        // If not enough space, start a new page
        if (availableSpace < estimatedTableHeight) {
          this.addPageBreak()
        }
        
        this.addDayHeader(day)
        this.addDayWorklogTable(dayWorklogs)
      }
    })
  }

  /**
   * Add day header
   */
  private addDayHeader(day: string): void {
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(41, 128, 185)
    
    this.doc.text(day, this.margin, this.currentY)
    this.currentY += 6
  }

  /**
   * Add worklog table for a specific day
   */
  private addDayWorklogTable(worklogs: JiraWorklog[]): void {
    const tableData = worklogs.map(w => [
      format(new Date(w.started), 'MMM d, yyyy'),
      w.issueKey,
      w.summary,
      'N/A',  // Status not available in JiraWorklog
      w.comment || 'No comment',
      formatHours(w.timeSpentSeconds / 3600)
    ])
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Date', 'Issue', 'Task', 'Status', 'Achievement description', 'Duration']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: 44
      },
      margin: { left: this.margin, bottom: 20 }, // Reserve bottom space for footer
      tableWidth: this.pageWidth - (this.margin * 2),
      columnStyles: {
        0: { cellWidth: 20 }, // Date
        1: { cellWidth: 20 }, // Issue
        2: { cellWidth: 40 }, // Summary
        3: { cellWidth: 20 }, // Status
        4: { cellWidth: 50 }, // Achievement description
        5: { cellWidth: 20 }  // Duration
      }
    })
    
    this.currentY = this.getLastAutoTableFinalY()
  }

  /**
   * Add page numbers to all pages (single, authoritative pass)
   */
  private addPageNumbersFooter(): void {
    const total = this.doc.getNumberOfPages()
    console.log(`Adding page numbers to all ${total} pages`)
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(149, 165, 166)

    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i)
      const pageWidth = this.doc.internal.pageSize.getWidth()
      const pageHeight = this.doc.internal.pageSize.getHeight()
      const label = `Page ${i} of ${total}`
      const textWidth = this.doc.getTextWidth(label)
      const x = pageWidth - this.margin - textWidth
      const y = pageHeight - 15 // 15mm up from bottom
      this.doc.text(label, x, y)
      console.log(`Added page number to page ${i}`)
    }
  }

  /**
   * Add export metadata
   */
  private addExportMetadata(exportTimestamp: Date): void {
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'italic')
    this.doc.setTextColor(149, 165, 166)
    
    const metadataText = `Report generated on ${format(exportTimestamp, 'EEEE, MMMM d, yyyy \'at\' HH:mm:ss')}`
    this.doc.text(metadataText, this.margin, this.currentY)
  }

  /**
   * Add page break
   */
  private addPageBreak(): void {
    // Add new page (no page numbering here - done at the end)
    this.doc.addPage()
    this.currentY = this.margin
  }

  /**
   * Group worklogs by developer
   */
  private groupWorklogsByDeveloper(worklogs: JiraWorklog[]): DeveloperSummary[] {
    const developerMap = new Map<string, DeveloperSummary>()
    
    worklogs.forEach(worklog => {
      const key = worklog.author.displayName
      if (!developerMap.has(key)) {
        developerMap.set(key, {
          displayName: worklog.author.displayName,
          emailAddress: worklog.author.emailAddress,
          totalHours: 0,
          worklogs: []
        })
      }
      
      const developer = developerMap.get(key)!
      developer.totalHours += worklog.timeSpentSeconds / 3600
      developer.worklogs.push(worklog)
    })
    
    return Array.from(developerMap.values()).sort((a, b) => b.totalHours - a.totalHours)
  }

  /**
   * Group worklogs by day of the week
   */
  private groupWorklogsByDay(worklogs: JiraWorklog[]): Array<{ day: string, worklogs: JiraWorklog[] }> {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const worklogsByDay: Array<{ day: string, worklogs: JiraWorklog[] }> = []
    
    days.forEach(day => {
      const dayWorklogs = worklogs.filter(w => {
        const worklogDate = new Date(w.started)
        const dayName = format(worklogDate, 'EEEE')
        return dayName === day
      })
      
      // Only include days that have actual work activity
      if (dayWorklogs.length > 0) {
        worklogsByDay.push({ day, worklogs: dayWorklogs })
      }
    })
    
    return worklogsByDay
  }
}

export default PDFExportService 