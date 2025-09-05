import nodemailer from 'nodemailer'

// Email service configuration
interface EmailConfig {
  service: string
  // host: string
  // port: number
  // secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface InvitationEmailData {
  firstName: string
  lastName: string
  email: string
  invitationLink: string
  companyName: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    const config: EmailConfig = {
      // host: process.env.SMTP_HOST || 'smtp.gmail.com',
      // port: parseInt(process.env.SMTP_PORT || '587'),
      // secure: false, // true for 465, false for other ports
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER || 'murdochkhallz@gmail.com',
        pass: process.env.SMTP_PASS || 'hvmv owvh lskq iwfe'
      }
    }

    // Only create transporter if we have valid credentials
    if (config.auth.user && config.auth.pass) {
      this.transporter = nodemailer.createTransport(config)
    } else {
      console.warn('Email service not configured - missing SMTP credentials')
    }
  }

  /**
   * Send invitation email to new user
   */
  async sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not available - skipping email send')
      return false
    }

    try {
      const mailOptions = {
        from: `"${data.companyName}" <${process.env.SMTP_USER}>`,
        to: data.email,
        subject: `Welcome to ${data.companyName} - Complete Your Account Setup`,
        html: this.generateInvitationEmailHTML(data),
        text: this.generateInvitationEmailText(data)
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('Invitation email sent successfully:', info.messageId)
      return true
    } catch (error) {
      console.error('Error sending invitation email:', error)
      return false
    }
  }

  /**
   * Generate HTML version of invitation email
   */
  private generateInvitationEmailHTML(data: InvitationEmailData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${data.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${data.companyName}!</h1>
            <p>We're excited to have you join our team</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.firstName} ${data.lastName},</h2>
            
            <p>Your manager has created an account for you on our Worklog Tracker platform. This platform will help you:</p>
            
            <ul>
              <li>Track your daily work activities and time</li>
              <li>Monitor your productivity and contributions</li>
              <li>Collaborate with your team members</li>
              <li>Generate reports for performance reviews</li>
            </ul>
            
            <div class="highlight">
              <strong>Next Steps:</strong> Click the button below to complete your account setup and set your password.
            </div>
            
            <div style="text-align: center;">
              <a href="${data.invitationLink}" class="button">Complete Account Setup</a>
            </div>
            
            <p><strong>Important:</strong> This invitation link will expire in 24 hours for security reasons.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact your manager or our support team.</p>
            
            <p>Welcome aboard!</p>
            
            <p>Best regards,<br>The ${data.companyName} Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you didn't expect this invitation, please contact your manager immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate text version of invitation email
   */
  private generateInvitationEmailText(data: InvitationEmailData): string {
    return `
Welcome to ${data.companyName}!

Hello ${data.firstName} ${data.lastName},

Your manager has created an account for you on our Worklog Tracker platform. This platform will help you track your daily work activities, monitor productivity, collaborate with team members, and generate performance reports.

NEXT STEPS:
Click the following link to complete your account setup and set your password:
${data.invitationLink}

IMPORTANT: This invitation link will expire in 24 hours for security reasons.

If you have any questions or need assistance, please contact your manager or our support team.

Welcome aboard!

Best regards,
The ${data.companyName} Team

---
This is an automated message. Please do not reply to this email.
If you didn't expect this invitation, please contact your manager immediately.
    `
  }

  /**
   * Test email service configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false
    }

    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('Email service connection test failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()
export default emailService


