import { serve } from "@upstash/workflow/nextjs"
import { NextResponse } from "next/server"

interface BookingPayload {
  patientPhone: string
  patientName: string
  doctorName: string
  appointmentDate: string // ISO string representation
  appointmentTime: string
}

async function sendTwilioMessage(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[Twilio] Missing credentials. Mocking message:", { to, body })
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
      console.error("[Twilio] Failed to send message", await res.text())
    }
  } catch (error) {
    console.error("[Twilio] Exception during fetch", error)
  }
}

// Next.js API route that handles the Upstash Workflow execution
export const { POST } = serve<BookingPayload>(async (context) => {
  const { 
    patientPhone, 
    patientName, 
    doctorName, 
    appointmentDate, 
    appointmentTime 
  } = context.requestPayload

  // --------------------------------------------------------------------------
  // VALIDATION: Ensure required fields are present and well-formed
  // --------------------------------------------------------------------------
  if (!patientPhone || !patientName || !doctorName || !appointmentDate || !appointmentTime) {
    console.error("[Workflow] Missing required payload fields:", context.requestPayload)
    return // Exit early — Upstash will not retry on explicit return
  }

  const parsedDate = new Date(appointmentDate)
  if (isNaN(parsedDate.getTime())) {
    console.error("[Workflow] Invalid appointmentDate:", appointmentDate)
    return
  }

  // --------------------------------------------------------------------------
  // STEP 1: IMMEDIATE CONFIRMATION
  // --------------------------------------------------------------------------
  await context.run("send-immediate-confirmation", async () => {
    const msg = `Hello ${patientName}, your appointment with ${doctorName} is confirmed for ${parsedDate.toLocaleDateString()} at ${appointmentTime}.`
    await sendTwilioMessage(patientPhone, msg)
    
    console.log("===============================================================")
    console.log(`[Twilio SMS] -> Sent CONFIRMATION to ${patientPhone}`)
    console.log(`Message: "${msg}"`)
    console.log("===============================================================")
  })

  // --------------------------------------------------------------------------
  // STEP 2: DURABLE SLEEP
  // --------------------------------------------------------------------------
  // Calculate the timestamp for 10:00 AM on the day of the appointment
  const reminderDate = new Date(parsedDate)
  reminderDate.setHours(10, 0, 0, 0)

  // Only invoke sleepUntil if the calculated 10AM time is actually in the future.
  // E.g., if an appointment is booked at 11AM for the same day, we skip sleeping.
  if (reminderDate.getTime() > Date.now()) {
    await context.sleepUntil("wait-until-10am-appointment-day", reminderDate)
  }

  // --------------------------------------------------------------------------
  // STEP 3: DAY-OF-TREATMENT REMINDER
  // --------------------------------------------------------------------------
  await context.run("send-day-of-reminder", async () => {
    const msg = `Reminder: You have a dental appointment today at ${appointmentTime} with ${doctorName}.`
    await sendTwilioMessage(patientPhone, msg)
    
    console.log("===============================================================")
    console.log(`[Twilio SMS] -> Sent REMINDER to ${patientPhone}`)
    console.log(`Message: "${msg}"`)
    console.log("===============================================================")
  })
})
