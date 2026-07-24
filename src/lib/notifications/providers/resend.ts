import { Resend } from 'resend'
import { NotificationProvider, AppointmentReminderData, NotificationResult } from '../types'
import { renderAppointmentReminderEmail } from '../templates/emailReminder'

export class ResendProvider implements NotificationProvider {
  public name = 'Resend'
  private client: Resend | null = null
  private defaultFromEmail: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    this.defaultFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    if (apiKey) {
      this.client = new Resend(apiKey)
    } else {
      console.warn('[ResendProvider] RESEND_API_KEY environment variable is not set. Email dispatches will be mocked.')
    }
  }

  public async sendAppointmentReminder(data: AppointmentReminderData): Promise<NotificationResult> {
    if (!data.patientEmail) {
      console.warn('[ResendProvider] Skipping email dispatch: patient email is missing.', { patientName: data.patientName })
      return {
        success: false,
        provider: this.name,
        error: 'Patient email address is missing'
      }
    }

    const { subject, html, text } = renderAppointmentReminderEmail(data)

    if (!this.client) {
      console.log('[ResendProvider] (Mock Dispatch) Would send email to:', data.patientEmail, { subject })
      return {
        success: true,
        provider: this.name,
        id: `mock-resend-${Date.now()}`
      }
    }

    try {
      const fromEmail = this.defaultFromEmail.includes('<') 
        ? this.defaultFromEmail 
        : `${data.clinicName} <${this.defaultFromEmail}>`

      const response = await this.client.emails.send({
        from: fromEmail,
        to: [data.patientEmail],
        subject,
        html,
        text
      })

      if (response.error) {
        console.error('[ResendProvider] Resend API Error:', response.error)
        return {
          success: false,
          provider: this.name,
          error: response.error.message || 'Failed to dispatch email via Resend'
        }
      }

      console.log(`[ResendProvider] Successfully sent appointment reminder email to ${data.patientEmail} (ID: ${response.data?.id})`)
      return {
        success: true,
        provider: this.name,
        id: response.data?.id
      }
    } catch (error: any) {
      console.error('[ResendProvider] Exception during email dispatch:', error)
      return {
        success: false,
        provider: this.name,
        error: error.message || 'Unexpected exception during Resend email dispatch'
      }
    }
  }
}
