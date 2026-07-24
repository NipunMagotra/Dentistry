/**
 * Self-Hosted WhatsApp Gateway Helper for Clinic OS
 * Supports Baileys / WhatsApp Web JS / Evolution API / Green API HTTP Gateways.
 */

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL
  const secretKey = process.env.WHATSAPP_GATEWAY_SECRET

  if (!gatewayUrl) {
    console.warn('[WhatsApp Gateway] WHATSAPP_GATEWAY_URL not configured. Mocking dispatch:', { to, message })
    return false
  }

  // Format phone number (ensure country code digits without '+' or dashes)
  const cleanPhone = to.replace(/\D/g, '')

  try {
    const res = await fetch(`${gatewayUrl.replace(/\/$/, '')}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secretKey ? { 'X-Api-Key': secretKey } : {})
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message
      })
    })

    if (!res.ok) {
      console.error('[WhatsApp Gateway] Dispatch failed:', await res.text())
      return false
    }

    console.log(`[WhatsApp Gateway] Successfully sent message to ${cleanPhone}`)
    return true
  } catch (error) {
    console.error('[WhatsApp Gateway] Exception during dispatch:', error)
    return false
  }
}
