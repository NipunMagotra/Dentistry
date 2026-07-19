'use server'

import { getTenantSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getAppointments(date?: string) {
  try {
    const { supabase } = await getTenantSupabase()
    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        doctor_name,
        status,
        reason,
        notes,
        created_at,
        patients ( name, phone )
      `)
      .neq('status', 'Pending')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    if (date) {
       query = query.eq('appointment_date', date)
    }

    const { data, error } = await query
    if (error) throw error
    
    // Map to frontend expected format
    return (data || []).map((a: any) => ({
      id: a.id,
      time: a.appointment_time,
      date: a.appointment_date,
      patient: a.patients?.name || 'Unknown',
      phone: a.patients?.phone || '',
      doctor: a.doctor_name,
      status: a.status,
      reason: a.reason,
      notes: a.notes
    }))
  } catch (error) {
    console.error('Failed to get appointments:', error)
    return []
  }
}

export async function getPendingRequests() {
  try {
    const { supabase } = await getTenantSupabase()
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        doctor_name,
        status,
        reason,
        created_at,
        patients ( name, phone )
      `)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map((a: any) => ({
      id: a.id,
      date: a.appointment_date,
      time: a.appointment_time,
      patient: a.patients?.name || 'Unknown',
      phone: a.patients?.phone || '',
      doctor: a.doctor_name,
      status: a.status,
      reason: a.reason || 'General Consultation',
      createdAt: a.created_at
    }))
  } catch (error) {
    console.error('Failed to get pending requests:', error)
    return []
  }
}

export async function createAppointment(data: any) {
  try {
    const { supabase, tenantId } = await getTenantSupabase()
    
    // First ensure patient exists or create new
    let patientId = data.patientId
    if (!patientId) {
      const { data: patient, error: pError } = await supabase
        .from('patients')
        .insert([{ tenant_id: tenantId, name: data.patientName, phone: data.patientPhone }])
        .select()
        .single()
      
      if (pError) throw pError
      patientId = patient.id
    }

    const { error: aError } = await supabase
      .from('appointments')
      .insert([{
        tenant_id: tenantId,
        patient_id: patientId,
        doctor_name: data.doctorName,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        status: data.status || 'Scheduled',
        reason: data.reason || 'General Consultation'
      }])

    if (aError) throw aError

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to create appointment:', error)
    return { success: false, error }
  }
}

export async function updateAppointmentStatus(id: string, status: string) {
  try {
    const { supabase } = await getTenantSupabase()
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      
    if (error) throw error

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to update appointment:', error)
    return { success: false, error }
  }
}

export async function updateAppointmentDetails(id: string, data: any) {
  try {
    const { supabase } = await getTenantSupabase()
    
    const { error: aError } = await supabase
      .from('appointments')
      .update({
        doctor_name: data.doctor,
        appointment_date: data.date,
        appointment_time: data.time,
        status: data.status
      })
      .eq('id', id)

    if (aError) throw aError

    // Note: We don't update patient name/phone here since they belong to the patients table
    // and would require a separate update if they changed.

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to update appointment details:', error)
    return { success: false, error }
  }
}

export async function getDoctors() {
  try {
    const { supabase } = await getTenantSupabase()
    // Query memberships for doctors and join staff_accounts to get their names
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        staff_id,
        staff_accounts ( first_name, last_name )
      `)
      .eq('role_id', 'doctor')

    if (error) throw error
    
    // Transform data for UI consumption
    return (data || []).map((m: any) => ({
      id: m.staff_id,
      name: `Dr. ${m.staff_accounts.first_name} ${m.staff_accounts.last_name}`
    }))
  } catch (error) {
    console.error('Failed to get doctors:', error)
    return []
  }
}

export async function searchPatients(query: string = '', filter: string = 'All') {
  try {
    const { supabase } = await getTenantSupabase()
    let dbQuery = supabase
      .from('patients')
      .select(`
        *,
        appointments ( appointment_date, status, reason, notes, doctor_name ),
        prescriptions ( id, medications, created_at )
      `)
      .order('created_at', { ascending: false })

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    }

    if (filter === 'Male' || filter === 'Female') {
      dbQuery = dbQuery.eq('gender', filter)
    }

    const { data, error } = await dbQuery
    if (error) throw error

    let patients = data || []
    
    if (filter === 'Recent') {
      // Filter patients who have at least one appointment
      patients = patients.filter((p: any) => p.appointments && p.appointments.length > 0)
    }

    return patients
  } catch (error) {
    console.error('Failed to search patients:', error)
    return []
  }
}

export async function deletePatient(id: string) {
  try {
    const { supabase } = await getTenantSupabase()
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id)
      
    if (error) throw error

    revalidatePath('/[tenant]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete patient:', error)
    return { success: false, error }
  }
}

export async function createSecurePrescription(data: any) {
  try {
    const { supabase, tenantId } = await getTenantSupabase()
    
    // If no appointmentId is provided (as the current UI just selects a patient), 
    // fetch the most recent active appointment for this patient to link the prescription.
    let appointmentId = data.appointmentId
    if (!appointmentId) {
       const { data: apts, error: aptError } = await supabase
         .from('appointments')
         .select('id')
         .eq('patient_id', data.patientId)
         .order('appointment_date', { ascending: false })
         .limit(1)
         
       if (aptError || !apts || apts.length === 0) {
          throw new Error("Patient has no active appointments to link this prescription to.")
       }
       appointmentId = apts[0].id
    }

    // Call the PostgreSQL RPC function we created in encryption.sql
    const { data: result, error } = await supabase.rpc('insert_secure_prescription', {
      p_tenant_id: tenantId,
      p_appointment_id: appointmentId,
      p_medications: data.medications,
      p_sensitive_notes: data.sensitiveNotes || 'Standard E-Prescription issued.'
    })

    if (error) throw error

    revalidatePath('/[tenant]', 'page')
    return { success: true, id: result }
  } catch (error) {
    console.error('Failed to create secure prescription:', error)
    return { success: false, error }
  }
}

export async function getClinicStats() {
  try {
    const { supabase } = await getTenantSupabase()
    
    // 1. Total Patients
    const { count: totalPatients, error: pError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      
    if (pError) throw pError

    // 2. Patients this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { count: patientsThisWeek, error: pwError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    if (pwError) throw pwError

    // 3. Revenue Today & Completed Today Count
    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    
    const { data: todayApts, error: aError } = await supabase
      .from('appointments')
      .select('status')
      .eq('appointment_date', todayStr)

    if (aError) throw aError

    let completedTodayCount = 0
    todayApts?.forEach(apt => {
      if (apt.status === 'Completed') completedTodayCount++
    })
    const revenueToday = completedTodayCount * 150

    // 4. No-Show Rate for the week
    const { data: weekApts, error: wError } = await supabase
      .from('appointments')
      .select('status')
      .gte('created_at', oneWeekAgo.toISOString())

    if (wError) throw wError

    let noShowCount = 0
    let totalScheduledCount = weekApts?.length || 0

    weekApts?.forEach(apt => {
      if (apt.status === 'Cancelled' || apt.status === 'No Show') {
        noShowCount++
      }
    })

    const noShowRate = totalScheduledCount > 0 
      ? Math.round((noShowCount / totalScheduledCount) * 100) 
      : 0

    return {
      totalPatients: totalPatients || 0,
      patientsThisWeek: patientsThisWeek || 0,
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
