import { serve } from "@upstash/workflow/nextjs"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

interface BookingPayload {
  patientPhone: string
  patientName: string
  doctorName: string
  appointmentDate: string // ISO string representation
  appointmentTime: string
}

// Regex for E.164 phone number format (e.g. +14155552671 or +919876543210)
const E164_PHONE_REGEX = /^\+?[1-9]\d{1,14}$/

async function sendTwilioMessage(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[Twilio] Missing credentials. Mocking message dispatch:", { to, body })
    return
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const data = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body
  })

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64")
      },
      body: data.toString()
    })
    
    if (!res.ok) {
      console.error("[Twilio] Failed to send message:", await res.text())
    }
  } catch (error) {
    console.error("[Twilio] Exception during fetch:", error)
  }
}

// Next.js API route that handles Upstash Workflow execution with signature verification
export const { POST } = serve<BookingPayload>(
  async (context) => {
    const { 
      patientPhone, 
      patientName, 
      doctorName, 
      appointmentDate, 
      appointmentTime 
    } = context.requestPayload

    // --------------------------------------------------------------------------
    // 1. STRICT PAYLOAD VALIDATION & SANITIZATION
    // --------------------------------------------------------------------------
    if (!patientPhone || !patientName || !doctorName || !appointmentDate || !appointmentTime) {
      console.error("[Workflow] Missing required payload fields:", context.requestPayload)
      return
    }

    // Sanitize phone number (strip whitespace/dashes)
    const cleanPhone = patientPhone.replace(/[\s\-()]/g, '')
    if (!E164_PHONE_REGEX.test(cleanPhone)) {
      console.error("[Workflow] Invalid phone number format:", patientPhone)
      return
    }

    // Validate ISO appointment date
    const parsedDate = new Date(appointmentDate)
    if (isNaN(parsedDate.getTime())) {
      console.error("[Workflow] Invalid appointmentDate:", appointmentDate)
      return
    }

    // Sanitize input strings against CRLF injection in SMS body
    const cleanPatientName = patientName.replace(/[\r\n]/g, ' ').slice(0, 100)
    const cleanDoctorName = doctorName.replace(/[\r\n]/g, ' ').slice(0, 100)

    // --------------------------------------------------------------------------
    // 2. STEP 1: IMMEDIATE CONFIRMATION (SMS + WHATSAPP)
    // --------------------------------------------------------------------------
    await context.run("send-immediate-confirmation", async () => {
      const msg = `Hello ${cleanPatientName}, your appointment with ${cleanDoctorName} is confirmed for ${parsedDate.toLocaleDateString()} at ${appointmentTime}.`
      
      await Promise.allSettled([
        sendTwilioMessage(cleanPhone, msg),
        sendWhatsAppMessage(cleanPhone, msg)
      ])
      
      console.log("===============================================================")
      console.log(`[Notification Pipeline] -> Sent CONFIRMATION to ${cleanPhone}`)
      console.log("===============================================================")
    })

    // --------------------------------------------------------------------------
    // 3. STEP 2: DURABLE SLEEP (ZERO COMPUTE DURING SLEEP)
    // --------------------------------------------------------------------------
    const reminderDate = new Date(parsedDate)
    reminderDate.setHours(10, 0, 0, 0)

    if (reminderDate.getTime() > Date.now()) {
      await context.sleepUntil("wait-until-10am-appointment-day", reminderDate)
    }

    // --------------------------------------------------------------------------
    // 4. STEP 3: DAY-OF-TREATMENT REMINDER (SMS + WHATSAPP)
    // --------------------------------------------------------------------------
    await context.run("send-day-of-reminder", async () => {
      const msg = `Reminder: You have a dental appointment today at ${appointmentTime} with ${cleanDoctorName}.`
      
      await Promise.allSettled([
        sendTwilioMessage(cleanPhone, msg),
        sendWhatsAppMessage(cleanPhone, msg)
      ])
      
      console.log("===============================================================")
      console.log(`[Notification Pipeline] -> Sent REMINDER to ${cleanPhone}`)
      console.log("===============================================================")
    })
  },
  {
    // Enable QStash signature verification via environment variables:
    // - QSTASH_CURRENT_SIGNING_KEY
    // - QSTASH_NEXT_SIGNING_KEY
    baseUrl: process.env.NEXT_PUBLIC_ROOT_DOMAIN 
      ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` 
      : undefined
  }
)
