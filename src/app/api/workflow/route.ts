import { NextResponse } from "next/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

interface BookingPayload {
  patientPhone: string
  patientName: string
  doctorName: string
  appointmentDate: string
  appointmentTime: string
}

// Regex for basic phone validation
const E164_PHONE_REGEX = /^\+?[1-9]\d{1,14}$/

export async function POST(req: Request) {
  try {
    const body: BookingPayload = await req.json()
    const { 
      patientPhone, 
      patientName, 
      doctorName, 
      appointmentDate, 
      appointmentTime 
    } = body

    if (!patientPhone || !patientName || !doctorName || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required booking payload fields" },
        { status: 400 }
      )
    }

    // Sanitize phone number (strip whitespace/dashes/parentheses)
    const cleanPhone = patientPhone.replace(/[\s\-()]/g, '')
    if (!E164_PHONE_REGEX.test(cleanPhone)) {
      console.error("[WhatsApp Notify] Invalid phone number format:", patientPhone)
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      )
    }

    // Format date string safely
    let formattedDate = appointmentDate
    if (appointmentDate) {
      const parsedDate = new Date(appointmentDate)
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString()
      }
    }

    // Sanitize input strings
    const cleanPatientName = patientName.replace(/[\r\n]/g, ' ').slice(0, 100)
    const cleanDoctorName = doctorName.replace(/[\r\n]/g, ' ').slice(0, 100)

    const message = `Hello ${cleanPatientName}, your appointment with ${cleanDoctorName} is confirmed for ${formattedDate} at ${appointmentTime}.`

    // Dispatch WhatsApp message via free self-hosted gateway
    const success = await sendWhatsAppMessage(cleanPhone, message)

    console.log(`[WhatsApp Pipeline] -> Sent confirmation to ${cleanPhone} (Success: ${success})`)

    return NextResponse.json({ 
      success, 
      to: cleanPhone,
      message: success ? "WhatsApp notification sent successfully" : "WhatsApp dispatch attempted (gateway offline or unconfigured)"
    })
  } catch (error: any) {
    console.error("[WhatsApp Notify] Exception in notification endpoint:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process notification" },
      { status: 500 }
    )
  }
}
