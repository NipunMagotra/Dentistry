'use server'

import { getTenantDb } from '@/lib/firebase-admin'
import { encryptNotes, decryptNotes } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

export async function getAppointments(date?: string) {
  try {
    const { appointmentsRef, patientsRef } = await getTenantDb()
    
    let query = appointmentsRef.where('status', '!=', 'Pending')
    if (date) {
      query = appointmentsRef.where('status', '!=', 'Pending').where('appointment_date', '==', date)
    }

    const snapshot = await query.get()
    const appointments: any[] = []

    for (const doc of snapshot.docs) {
      const data = doc.data()
      let patientName = data.patient_name || 'Unknown'
      let patientPhone = data.patient_phone || ''

      // If patient details are not embedded, fetch from patients collection
      if (!data.patient_name && data.patient_id) {
        const patientDoc = await patientsRef.doc(data.patient_id).get()
        if (patientDoc.exists) {
          const pData = patientDoc.data()
          patientName = pData?.name || patientName
          patientPhone = pData?.phone || patientPhone
        }
      }

      appointments.push({
        id: doc.id,
        time: data.appointment_time,
        date: data.appointment_date,
        patient: patientName,
        phone: patientPhone,
        doctor: data.doctor_name,
        status: data.status,
        reason: data.reason || 'General Consultation',
        notes: data.notes || '',
        createdAt: data.created_at
      })
    }

    // Sort in memory by date and time
    appointments.sort((a, b) => {
      const dateDiff = (a.date || '').localeCompare(b.date || '')
      if (dateDiff !== 0) return dateDiff
      return (a.time || '').localeCompare(b.time || '')
    })

    return appointments
  } catch (error) {
    console.error('Failed to get appointments:', error)
    return []
  }
}

export async function getPendingRequests() {
  try {
    const { appointmentsRef, patientsRef } = await getTenantDb()
    const snapshot = await appointmentsRef.where('status', '==', 'Pending').get()
    const requests: any[] = []

    for (const doc of snapshot.docs) {
      const data = doc.data()
      let patientName = data.patient_name || 'Unknown'
      let patientPhone = data.patient_phone || ''

      if (!data.patient_name && data.patient_id) {
        const patientDoc = await patientsRef.doc(data.patient_id).get()
        if (patientDoc.exists) {
          const pData = patientDoc.data()
          patientName = pData?.name || patientName
          patientPhone = pData?.phone || patientPhone
        }
      }

      requests.push({
        id: doc.id,
        date: data.appointment_date,
        time: data.appointment_time,
        patient: patientName,
        phone: patientPhone,
        doctor: data.doctor_name,
        status: data.status,
        reason: data.reason || 'General Consultation',
        createdAt: data.created_at
      })
    }

    requests.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return requests
  } catch (error) {
    console.error('Failed to get pending requests:', error)
    return []
  }
}

export async function createAppointment(data: any) {
  try {
    const { appointmentsRef, patientsRef } = await getTenantDb()

    // 1. Ensure patient exists or create new
    let patientId = data.patientId
    let patientName = data.patientName
    let patientPhone = data.patientPhone

    if (!patientId) {
      // Check if patient with exact phone already exists
      const existingPatientQuery = await patientsRef.where('phone', '==', data.patientPhone).limit(1).get()
      if (!existingPatientQuery.empty) {
        const existingDoc = existingPatientQuery.docs[0]
        patientId = existingDoc.id
        patientName = existingDoc.data().name || patientName
      } else {
        const newPatientRef = await patientsRef.add({
          name: data.patientName,
          phone: data.patientPhone,
          created_at: new Date().toISOString()
        })
        patientId = newPatientRef.id
      }
    }

    // 2. Conflict Check: Prevent double-booking doctor at the same date & time slot
    const conflictQuery = await appointmentsRef
      .where('doctor_name', '==', data.doctorName)
      .where('appointment_date', '==', data.appointmentDate)
      .where('appointment_time', '==', data.appointmentTime)
      .get()

    const activeConflicts = conflictQuery.docs.filter(doc => {
      const st = doc.data().status
      return st !== 'Cancelled' && st !== 'Declined'
    })

    if (activeConflicts.length > 0) {
      return {
        success: false,
        error: 'CONFLICT',
        message: `Conflict: ${data.doctorName} is already booked at ${data.appointmentTime} on ${data.appointmentDate}.`
      }
    }

    // 3. Create Appointment Document
    await appointmentsRef.add({
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone,
      doctor_name: data.doctorName,
      appointment_date: data.appointmentDate,
      appointment_time: data.appointmentTime,
      status: data.status || 'Scheduled',
      reason: data.reason || 'General Consultation',
      created_at: new Date().toISOString()
    })

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to create appointment:', error)
    return { success: false, error: String(error) }
  }
}

export async function updateAppointmentStatus(id: string, status: string) {
  try {
    const { appointmentsRef } = await getTenantDb()
    await appointmentsRef.doc(id).update({
      status,
      updated_at: new Date().toISOString()
    })

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to update appointment:', error)
    return { success: false, error: String(error) }
  }
}

export async function updateAppointmentDetails(id: string, data: any) {
  try {
    const { appointmentsRef } = await getTenantDb()
    await appointmentsRef.doc(id).update({
      doctor_name: data.doctor,
      appointment_date: data.date,
      appointment_time: data.time,
      status: data.status,
      updated_at: new Date().toISOString()
    })

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to update appointment details:', error)
    return { success: false, error: String(error) }
  }
}

export async function getDoctors() {
  try {
    const { doctorsRef } = await getTenantDb()
    const snapshot = await doctorsRef.get()

    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || `Dr. ${doc.data().first_name} ${doc.data().last_name}`
      }))
    }

    // Default doctors registry fallback if empty
    return [
      { id: 'doc-1', name: 'Dr. Sarah Jenkins' },
      { id: 'doc-2', name: 'Dr. Michael Chen' },
      { id: 'doc-3', name: 'Dr. Emily Vance' }
    ]
  } catch (error) {
    console.error('Failed to get doctors:', error)
    return [
      { id: 'doc-1', name: 'Dr. Sarah Jenkins' },
      { id: 'doc-2', name: 'Dr. Michael Chen' },
      { id: 'doc-3', name: 'Dr. Emily Vance' }
    ]
  }
}

export async function searchPatients(query: string = '', filter: string = 'All') {
  try {
    const { patientsRef, appointmentsRef, prescriptionsRef } = await getTenantDb()
    const snapshot = await patientsRef.get()
    let patients: any[] = []

    const qLower = query.toLowerCase()

    for (const doc of snapshot.docs) {
      const pData = doc.data()
      const name = pData.name || ''
      const phone = pData.phone || ''
      const gender = pData.gender || 'Unspecified'

      // Search filter
      if (query && !name.toLowerCase().includes(qLower) && !phone.toLowerCase().includes(qLower)) {
        continue
      }

      // Gender filter
      if ((filter === 'Male' || filter === 'Female') && gender !== filter) {
        continue
      }

      // Fetch patient's appointments
      const aptsSnap = await appointmentsRef.where('patient_id', '==', doc.id).get()
      const appointments = aptsSnap.docs.map(aDoc => {
        const a = aDoc.data()
        return {
          appointment_date: a.appointment_date,
          status: a.status,
          reason: a.reason,
          notes: a.notes,
          doctor_name: a.doctor_name
        }
      })

      // Fetch patient's prescriptions & decrypt sensitive notes
      const rxSnap = await prescriptionsRef.where('patient_id', '==', doc.id).get()
      const prescriptions = rxSnap.docs.map(rxDoc => {
        const rx = rxDoc.data()
        return {
          id: rxDoc.id,
          medications: rx.medications,
          sensitive_notes: decryptNotes(rx.sensitive_notes),
          created_at: rx.created_at
        }
      })

      if (filter === 'Recent' && appointments.length === 0) {
        continue
      }

      patients.push({
        id: doc.id,
        name,
        phone,
        gender,
        age: pData.age || 'N/A',
        created_at: pData.created_at,
        appointments,
        prescriptions,
        dental_chart: pData.dental_chart || {}
      })
    }

    return patients
  } catch (error) {
    console.error('Failed to search patients:', error)
    return []
  }
}

export async function saveDentalChart(patientId: string, chartData: any) {
  try {
    const { patientsRef } = await getTenantDb()
    await patientsRef.doc(patientId).update({
      dental_chart: chartData,
      updated_at: new Date().toISOString()
    })

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to save dental chart:', error)
    return { success: false, error: String(error) }
  }
}

export async function deletePatient(id: string) {
  try {
    const { patientsRef, appointmentsRef, prescriptionsRef } = await getTenantDb()
    
    // 1. Delete patient document
    await patientsRef.doc(id).delete()

    // 2. Cascade delete patient appointments
    const aptsSnap = await appointmentsRef.where('patient_id', '==', id).get()
    const aptDeletes = aptsSnap.docs.map(d => d.ref.delete())

    // 3. Cascade delete patient prescriptions
    const rxSnap = await prescriptionsRef.where('patient_id', '==', id).get()
    const rxDeletes = rxSnap.docs.map(d => d.ref.delete())

    await Promise.all([...aptDeletes, ...rxDeletes])

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete patient:', error)
    return { success: false, error: String(error) }
  }
}

export async function createSecurePrescription(data: any) {
  try {
    const { appointmentsRef, prescriptionsRef } = await getTenantDb()
    
    let appointmentId = data.appointmentId
    if (!appointmentId) {
      const aptsSnap = await appointmentsRef
        .where('patient_id', '==', data.patientId)
        .limit(1)
        .get()

      if (aptsSnap.empty) {
        throw new Error("Patient has no active appointments to link this prescription to.")
      }
      appointmentId = aptsSnap.docs[0].id
    }

    // Encrypt sensitive notes via AES-256-GCM
    const encryptedSensitiveNotes = encryptNotes(data.sensitiveNotes || 'Standard E-Prescription issued.')

    const docRef = await prescriptionsRef.add({
      patient_id: data.patientId,
      appointment_id: appointmentId,
      medications: data.medications,
      sensitive_notes: encryptedSensitiveNotes,
      created_at: new Date().toISOString()
    })

    revalidatePath('/[tenant]', 'page')
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Failed to create secure prescription:', error)
    return { success: false, error: String(error) }
  }
}

export async function getClinicStats() {
  try {
    const { patientsRef, appointmentsRef } = await getTenantDb()

    // 1. Total Patients
    const patientsSnap = await patientsRef.get()
    const totalPatients = patientsSnap.size

    // 2. Patients created in the last 7 days
    const oneWeekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    let patientsThisWeek = 0

    patientsSnap.docs.forEach(doc => {
      const createdAt = doc.data().created_at
      if (createdAt && createdAt >= oneWeekAgoIso) {
        patientsThisWeek++
      }
    })

    // 3. Revenue Today & Completed Today
    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    const todayAptsSnap = await appointmentsRef.where('appointment_date', '==', todayStr).get()

    let completedTodayCount = 0
    todayAptsSnap.docs.forEach(doc => {
      if (doc.data().status === 'Completed') {
        completedTodayCount++
      }
    })
    const revenueToday = completedTodayCount * 150

    // 4. No-Show Rate for the week
    const weekAptsSnap = await appointmentsRef.get()
    let noShowCount = 0
    let totalScheduledCount = 0

    weekAptsSnap.docs.forEach(doc => {
      const d = doc.data()
      if (d.created_at && d.created_at >= oneWeekAgoIso) {
        totalScheduledCount++
        if (d.status === 'Cancelled' || d.status === 'No Show' || d.status === 'Declined') {
          noShowCount++
        }
      }
    })

    const noShowRate = totalScheduledCount > 0
      ? Math.round((noShowCount / totalScheduledCount) * 100)
      : 0

    return {
      totalPatients,
      patientsThisWeek,
      revenueToday,
      completedTodayCount,
      noShowRate
    }
  } catch (error) {
    console.error('Failed to get clinic stats:', error)
    return {
      totalPatients: 0,
      patientsThisWeek: 0,
      revenueToday: 0,
      completedTodayCount: 0,
      noShowRate: 0
    }
  }
}
