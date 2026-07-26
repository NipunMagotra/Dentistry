import { NotificationProvider, AppointmentReminderData, NotificationResult } from './types'
import { ResendProvider } from './providers/resend'
import { WhatsAppProvider } from './providers/whatsapp'

/**
 * Central Notification Service Facade.
 * Manages multiple notification providers (Resend, WhatsApp, SMS) and dispatches reminders cleanly.
 */
class NotificationServiceFacade {
  private providers: NotificationProvider[] = []

  constructor() {
    // Register Resend email and WhatsApp providers by default
    this.registerProvider(new ResendProvider())
    this.registerProvider(new WhatsAppProvider())
  }

  /**
   * Register a new notification provider (e.g. WhatsAppProvider, SmsProvider).
   */
  public registerProvider(provider: NotificationProvider) {
    this.providers.push(provider)
  }

  /**
   * Dispatches appointment reminders across registered notification providers.
   */
  public async sendAppointmentReminder(data: AppointmentReminderData): Promise<NotificationResult[]> {
    if (this.providers.length === 0) {
      console.warn('[NotificationService] No notification providers registered.')
      return []
    }

    const results: NotificationResult[] = []

    for (const provider of this.providers) {
      try {
        const result = await provider.sendAppointmentReminder(data)
        results.push(result)
      } catch (err: any) {
        console.error(`[NotificationService] Error executing provider ${provider.name}:`, err)
        results.push({
          success: false,
          provider: provider.name,
          error: err.message || 'Provider failure'
        })
      }
    }

    return results
  }
}

export const NotificationService = new NotificationServiceFacade()
export * from './types'
