/**
 * Data required to populate an appointment reminder.
 */
export interface AppointmentReminderData {
  patientName: string
  patientEmail?: string
  patientPhone?: string
  clinicName: string
  doctorName: string
  appointmentDate: string
  appointmentTime: string
  clinicPhone?: string
  clinicAddress?: string
  clinicLogoUrl?: string
}

/**
 * Standardized result returned by any notification provider.
 */
export interface NotificationResult {
  success: boolean
  provider: string
  id?: string
  error?: string
}

/**
 * Contract for extensible Notification Providers (Resend, WhatsApp, SMS, Telegram).
 */
export interface NotificationProvider {
  name: string
  sendAppointmentReminder(data: AppointmentReminderData): Promise<NotificationResult>
}
