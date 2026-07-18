import { serve } from "@upstash/workflow/nextjs"

interface BookingPayload {
  patientPhone: string
  patientName: string
  doctorName: string
  appointmentDate: string // ISO string representation
  appointmentTime: string
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
  // STEP 1: IMMEDIATE CONFIRMATION
  // --------------------------------------------------------------------------
  await context.run("send-immediate-confirmation", async () => {
    // In production, perform a POST request to Twilio/WhatsApp API here:
    // await fetch("https://api.twilio.com/2010-04-01/Accounts/.../Messages.json", { ... })
    
    console.log("===============================================================")
    console.log(`[Twilio/WhatsApp MOCK] -> Sending CONFIRMATION to ${patientPhone}`)
    console.log(`Message: "Hello ${patientName}, your appointment with ${doctorName} is confirmed for ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime}."`)
    console.log("===============================================================")
  })

  // --------------------------------------------------------------------------
  // STEP 2: DURABLE SLEEP
  // --------------------------------------------------------------------------
  // Calculate the timestamp for 10:00 AM on the day of the appointment
  const reminderDate = new Date(appointmentDate)
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
    // In production, perform the second POST request to Twilio/WhatsApp API here.
    console.log("===============================================================")
    console.log(`[Twilio/WhatsApp MOCK] -> Sending REMINDER to ${patientPhone}`)
    console.log(`Message: "Reminder: You have a dental appointment today at ${appointmentTime}."`)
    console.log("===============================================================")
  })
})
