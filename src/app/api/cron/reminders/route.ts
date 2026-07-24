import { NextResponse } from 'next/server'
import { getFirestoreDb } from '@/lib/firebase-admin'
import { NotificationService } from '@/lib/notifications'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * Background cron endpoint to send automated 24-hour appointment reminder emails.
 * 
 * Rules:
 * - Scans appointments scheduled for tomorrow (within 24 hours).
 * - Skips Cancelled, Declined, or Completed appointments.
 * - Skips appointments where reminderSent is already true.
 * - Updates Firestore with reminderSent: true, reminderSentAt: Timestamp, reminderType: "email".
 * - On failure: logs error and retries on next run without marking reminderSent.
 */
export async function GET(req: Request) {
  return handleReminders(req)
}

export async function POST(req: Request) {
  return handleReminders(req)
}

async function handleReminders(req: Request) {
  try {
    const db = getFirestoreDb()

    // Calculate tomorrow's date string (YYYY-MM-DD format)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]
    const tomorrowLocaleStr = tomorrow.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })

    // Fetch all clinics
    const clinicsSnap = await db.collection('clinics').get()
    
    let totalProcessed = 0
    let totalSent = 0
    let totalFailed = 0

    for (const clinicDoc of clinicsSnap.docs) {
      const tenantId = clinicDoc.id
      const clinicData = clinicDoc.data()
      
      const clinicName = clinicData.name || clinicData.clinicName || 'Clinic OS Dental'
      const clinicPhone = clinicData.phone || clinicData.clinicPhone || ''
      const clinicAddress = clinicData.address || clinicData.clinicAddress || ''
      const clinicLogoUrl = clinicData.logoUrl || ''

      const appointmentsRef = clinicDoc.ref.collection('appointments')
      const patientsRef = clinicDoc.ref.collection('patients')

      // Query appointments for tomorrow that are not cancelled or completed
      const snapshot = await appointmentsRef
        .where('status', 'in', ['Scheduled', 'Confirmed', 'Pending'])
        .get()

      for (const aptDoc of snapshot.docs) {
        const apt = aptDoc.data()

        // Skip if reminder was already sent
        if (apt.reminderSent === true) {
          continue
        }

        // Match date string (supports YYYY-MM-DD or formatted locale date)
        const aptDate = apt.appointment_date || ''
        const isTomorrow = aptDate === tomorrowDateStr || aptDate === tomorrowLocaleStr

        // Also process if specific date match or within 24h window
        if (!isTomorrow) {
          continue
        }

        totalProcessed++

        // Fetch patient details (name & email)
        let patientName = apt.patient_name || 'Patient'
        let patientEmail = apt.patient_email || ''
        let patientPhone = apt.patient_phone || ''

        if (apt.patient_id) {
          const patientDoc = await patientsRef.doc(apt.patient_id).get()
          if (patientDoc.exists) {
            const pData = patientDoc.data()
            patientName = pData?.name || patientName
            patientEmail = pData?.email || patientEmail
            patientPhone = pData?.phone || patientPhone
          }
        }

        if (!patientEmail) {
          console.warn(`[Cron Reminders] Skipping appointment ${aptDoc.id}: Patient ${patientName} has no email address.`)
          continue
        }

        // Dispatch email notification via NotificationService
        const results = await NotificationService.sendAppointmentReminder({
          patientName,
          patientEmail,
          patientPhone,
          clinicName,
          doctorName: apt.doctor_name || 'Clinic Specialist',
          appointmentDate: apt.appointment_date,
          appointmentTime: apt.appointment_time,
          clinicPhone,
          clinicAddress,
          clinicLogoUrl
        })

        const resendResult = results.find(r => r.provider === 'Resend')

        if (resendResult && resendResult.success) {
          // Update Firestore status upon successful delivery
          await aptDoc.ref.update({
            reminderSent: true,
            reminderSentAt: Timestamp.now(),
            reminderType: 'email',
            updated_at: new Date().toISOString()
          })
          totalSent++
        } else {
          console.error(`[Cron Reminders] Failed to send reminder email for appointment ${aptDoc.id}:`, resendResult?.error)
          totalFailed++
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      sent: totalSent,
      failed: totalFailed,
      targetDate: tomorrowDateStr
    })
  } catch (error: any) {
    console.error('[Cron Reminders] Execution error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process automated reminders' }, { status: 500 })
  }
}
