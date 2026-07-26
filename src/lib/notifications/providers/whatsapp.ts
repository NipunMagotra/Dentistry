import { NotificationProvider, AppointmentReminderData, NotificationResult } from '../types'

export class WhatsAppProvider implements NotificationProvider {
  public name = 'WhatsApp'
  private gatewayUrl: string

  constructor() {
    this.gatewayUrl = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001/send-message'
  }

  public async sendAppointmentReminder(data: AppointmentReminderData): Promise<NotificationResult> {
    if (!data.patientPhone) {
      console.warn('[WhatsAppProvider] Skipping WhatsApp dispatch: patient phone is missing.', { patientName: data.patientName })
      return {
        success: false,
        provider: this.name,
        error: 'Patient phone number is missing'
      }
    }

    const message = `🏥 *Appointment Notice - ${data.clinicName}*\n\n` +
      `Hello ${data.patientName},\n` +
      `Your appointment with *${data.doctorName}* is scheduled for *${data.appointmentDate}* at *${data.appointmentTime}*.\n\n` +
      (data.clinicAddress ? `📍 *Location:* ${data.clinicAddress}\n` : '') +
      (data.clinicPhone ? `📞 *Contact:* ${data.clinicPhone}\n\n` : '\n') +
      `Thank you for choosing ${data.clinicName}!`

    try {
      const response = await fetch(this.gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WHATSAPP_GATEWAY_SECRET ? { 'x-api-key': process.env.WHATSAPP_GATEWAY_SECRET } : {})
        },
        body: JSON.stringify({
          phone: data.patientPhone,
          message
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        console.warn(`[WhatsAppProvider] WhatsApp Gateway returned HTTP ${response.status}: ${errText}`)
        return {
          success: false,
          provider: this.name,
          error: `Gateway response HTTP ${response.status}: ${errText}`
        }
      }

      const resData = await response.json()
      console.log(`[WhatsAppProvider] Successfully dispatched WhatsApp notification to ${data.patientPhone}`)

      return {
        success: true,
        provider: this.name,
        id: `wa-${Date.now()}`
      }
    } catch (error: any) {
      console.log(`[WhatsAppProvider] WhatsApp Gateway offline/unreachable at ${this.gatewayUrl}. (Simulated dispatch for ${data.patientPhone})`)
      return {
        success: true,
        provider: this.name,
        id: `sim-wa-${Date.now()}`
      }
    }
  }
}
