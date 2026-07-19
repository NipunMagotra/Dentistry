"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { BookingWizard } from "@/components/BookingWizard"
import { EPrescriptionForm } from "@/components/EPrescriptionForm"
import { PatientDirectory } from "@/components/PatientDirectory"
import { RescheduleModal } from "@/components/RescheduleModal"
import { AppointmentDetailsModal } from "@/components/AppointmentDetailsModal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, User, CalendarRange, FileText, Bell, Inbox, Trash2, CheckSquare } from "lucide-react"
import Image from "next/image"
import { ProfileModal } from "@/components/ProfileModal"
import { ProcessRequestModal } from "@/components/ProcessRequestModal"
import { Button } from "@/components/ui/button"

type Appointment = {
  id: string
  time: string
  patient: string
  doctor: string
  status: string
}

const DEFAULT_APPOINTMENTS: Appointment[] = [
  { id: "1", time: "09:30 AM", patient: "Alice Smith", doctor: "Dr. Sarah Jenkins", status: "Scheduled" },
  { id: "2", time: "10:30 AM", patient: "Bob Johnson", doctor: "Dr. Michael Chen", status: "In Progress" },
  { id: "3", time: "02:00 PM", patient: "Charlie Davis", doctor: "Dr. Emily Rodriguez", status: "Scheduled" }
]

export default function Dashboard() {
  const params = useParams()
  const tenant = params?.tenant as string || "default-clinic"
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profile, setProfile] = useState({
    clinicName: "City Dental Clinic",
    doctorName: "Dr. Sarah Jenkins"
  })

  // Pending requests state & modals
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)

  // Reschedule Modal states
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)

  // Appointment Details Modal states
  const [selectedDetailsApt, setSelectedDetailsApt] = useState<Appointment | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Load active appointments from localStorage or fall back to defaults
  useEffect(() => {
    const saved = localStorage.getItem("active_appointments")
    if (saved) {
      try {
        setAppointments(JSON.parse(saved))
      } catch (e) {
        console.error(e)
        setAppointments(DEFAULT_APPOINTMENTS)
      }
    } else {
      localStorage.setItem("active_appointments", JSON.stringify(DEFAULT_APPOINTMENTS))
      setAppointments(DEFAULT_APPOINTMENTS)
    }
  }, [])

  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsThisWeek: 0,
    revenueToday: 0,
    completedTodayCount: 0
  })

  // Load stats from patient directory
  const loadStats = () => {
    const saved = localStorage.getItem("patient_directory_list")
    let patientList = []
    if (saved) {
      try {
        patientList = JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
    
    // Baseline offsets matching the requested visual mockup
    const totalPatients = 1248 + patientList.filter((p: any) => p.id.startsWith("p_")).length
    const patientsThisWeek = 12 + patientList.filter((p: any) => p.id.startsWith("p_")).length
    
    const currentDateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    
    let calculatedRevenueToday = 0
    let calculatedCompletedTodayCount = 0
    
    patientList.forEach((patient: any) => {
      patient.history?.appointments?.forEach((apt: any) => {
        // Only sum appointments completed today that were dynamically added/completed in session
        if (apt.date === currentDateStr && apt.status === "Completed" && (patient.id.startsWith("p_") || apt.isDynamic)) {
          calculatedCompletedTodayCount++
          if (apt.doctor.includes("Jenkins")) {
            calculatedRevenueToday += 150
          } else if (apt.doctor.includes("Chen")) {
            calculatedRevenueToday += 200
          } else if (apt.doctor.includes("Rodriguez")) {
            calculatedRevenueToday += 180
          } else {
            calculatedRevenueToday += 150
          }
        }
      })
    })
    
    setStats({
      totalPatients,
      patientsThisWeek,
      revenueToday: 840 + calculatedRevenueToday,
      completedTodayCount: 4 + calculatedCompletedTodayCount
    })
  }

  useEffect(() => {
    loadStats()
    window.addEventListener("patient-directory-updated", loadStats)
    window.addEventListener("storage", loadStats)
    return () => {
      window.removeEventListener("patient-directory-updated", loadStats)
      window.removeEventListener("storage", loadStats)
    }
  }, [])

  // Load clinic settings
  useEffect(() => {
    const loadProfile = () => {
      const saved = localStorage.getItem("clinic_profile_settings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setProfile({
            clinicName: parsed.clinicName || "City Dental Clinic",
            doctorName: parsed.doctorName || "Dr. Sarah Jenkins"
          })
        } catch (e) {
          console.error("Error loading profile in dashboard", e)
        }
      }
    }
    loadProfile()
    window.addEventListener("clinic-profile-updated", loadProfile)
    return () => window.removeEventListener("clinic-profile-updated", loadProfile)
  }, [])

  // Sync pending requests from localStorage
  useEffect(() => {
    const loadPending = () => {
      const saved = localStorage.getItem("pending_appointments")
      if (saved) {
        try {
          setPendingRequests(JSON.parse(saved))
        } catch (e) {
          console.error(e)
        }
      } else {
        setPendingRequests([])
      }
    }
    loadPending()
    window.addEventListener("pending-appointments-updated", loadPending)
    window.addEventListener("storage", loadPending)
    return () => {
      window.removeEventListener("pending-appointments-updated", loadPending)
      window.removeEventListener("storage", loadPending)
    }
  }, [])

  const updateAppointments = (newApts: Appointment[]) => {
    setAppointments(newApts)
    localStorage.setItem("active_appointments", JSON.stringify(newApts))
  }

  const handleAddAppointment = (newApt: Omit<Appointment, "id">) => {
    const list = [
      ...appointments,
      { ...newApt, id: Date.now().toString() }
    ]
    updateAppointments(list)
  }

  const handleApproveRequest = async (approvedApt: {
    patient: string
    phone: string
    doctor: string
    date: string
    time: string
    status: string
  }) => {
    if (!selectedRequest) return

    // 1. Add to active appointments
    const list = [
      ...appointments,
      {
        id: Date.now().toString(),
        time: approvedApt.time,
        patient: approvedApt.patient,
        doctor: approvedApt.doctor,
        status: approvedApt.status
      }
    ]
    updateAppointments(list)

    // 2. Remove from pending requests
    const updatedPending = pendingRequests.filter(r => r.id !== selectedRequest.id)
    setPendingRequests(updatedPending)
    localStorage.setItem("pending_appointments", JSON.stringify(updatedPending))

    // 3. Trigger SMS/WhatsApp workflow API call
    try {
      await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientPhone: approvedApt.phone,
          patientName: approvedApt.patient,
          doctorName: approvedApt.doctor,
          appointmentDate: approvedApt.date,
          appointmentTime: approvedApt.time
        })
      })
    } catch (err) {
      console.error("Failed to trigger workflow", err)
    }

    setIsProcessModalOpen(false)
    setSelectedRequest(null)
  }

  const handleDeclineRequest = (id: string) => {
    const updatedPending = pendingRequests.filter(r => r.id !== id)
    setPendingRequests(updatedPending)
    localStorage.setItem("pending_appointments", JSON.stringify(updatedPending))
  }

  const handleCancelAppointment = (id: string) => {
    const list = appointments.filter((apt) => apt.id !== id)
    updateAppointments(list)
  }

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const list = appointments.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    updateAppointments(list)
  }

  const handleRescheduleClick = (apt: Appointment) => {
    setSelectedRescheduleApt(apt)
    setIsRescheduleModalOpen(true)
  }

  const handleReschedule = (id: string, newDate: string, newTime: string) => {
    const list = appointments.map((apt) => (apt.id === id ? { ...apt, time: newTime, status: "Rescheduled" } : apt))
    updateAppointments(list)

    const rescheduledApt = appointments.find(a => a.id === id)
    if (rescheduledApt) {
      try {
        fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientPhone: "+1 (555) 123-4567",
            patientName: rescheduledApt.patient,
            doctorName: rescheduledApt.doctor,
            appointmentDate: newDate,
            appointmentTime: newTime,
            type: "Rescheduled"
          })
        })
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleCompleteAppointment = (apt: Appointment) => {
    // Remove from active appointments list
    const list = appointments.filter(a => a.id !== apt.id)
    updateAppointments(list)

    // Add record to the patient in localStorage directory
    const savedPatients = localStorage.getItem("patient_directory_list")
    let patientList = []
    if (savedPatients) {
      try {
        patientList = JSON.parse(savedPatients)
      } catch (e) {
        console.error(e)
      }
    }

    const currentDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    let existingPatient = patientList.find((p: any) => p.name.toLowerCase() === apt.patient.toLowerCase())
    if (existingPatient) {
      existingPatient.history.appointments.push({
        date: currentDate,
        doctor: apt.doctor,
        status: "Completed",
        isDynamic: true
      })
    } else {
      existingPatient = {
        id: `p_${Date.now()}`,
        name: apt.patient,
        phone: "+1 (555) 0199",
        gender: "Male",
        history: {
          appointments: [
            { date: currentDate, doctor: apt.doctor, status: "Completed", isDynamic: true }
          ],
          prescriptions: []
        }
      }
      patientList.push(existingPatient)
    }

    localStorage.setItem("patient_directory_list", JSON.stringify(patientList))

    // Dispatch directory update custom event
    window.dispatchEvent(new Event("patient-directory-updated"))
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full">
        
        {/* Header (Hidden on print) */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <Image 
              src="/horizontal-logo.png" 
              alt="Clinic OS Logo" 
              width={200} 
              height={50} 
              className="h-12 w-auto object-contain mb-1"
              priority 
            />
            <p className="text-slate-500">
              Welcome, <span className="font-semibold text-slate-700">{profile.doctorName}</span>. Manage <span className="font-semibold text-slate-700">{profile.clinicName}</span> from one place.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {pendingRequests.length > 0 && (
              <div className="relative p-2 bg-amber-50 rounded-full border border-amber-100 text-amber-600 animate-bounce-subtle">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              </div>
            )}
            <ProfileModal tenant={tenant} />
          </div>
        </div>

        {/* Tabs (Hidden on print) */}
        <div className="print:hidden">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList 
              style={{ display: "grid", width: "100%" }}
              className="grid w-full max-w-3xl grid-cols-4 mb-8 bg-slate-100 p-1 rounded-xl"
            >
              <TabsTrigger value="appointments" className="flex items-center justify-center gap-2">
                <CalendarRange className="h-4 w-4" /> Appointments
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" /> E-Prescriptions
              </TabsTrigger>
              <TabsTrigger value="directory" className="flex items-center justify-center gap-2">
                <User className="h-4 w-4" /> Patient Directory
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center justify-center gap-2 relative">
                <Inbox className="h-4 w-4" /> 
                <span>Requests Queue</span>
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-white">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Appointments Tab Content */}
            <TabsContent value="appointments" className="mt-0 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Side Panel: Today's Appointments */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="h-[75vh] flex flex-col border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-xl font-bold text-slate-800">Today's Appointments</CardTitle>
                      <CardDescription>You have {appointments.length} appointments today.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                      {appointments.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 italic">
                          No appointments booked yet. Use the wizard to add one.
                        </div>
                      ) : (
                        appointments.map((apt) => (
                          <div 
                            key={apt.id} 
                            onClick={() => {
                              setSelectedDetailsApt(apt)
                              setIsDetailsModalOpen(true)
                            }}
                            className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col gap-3 transition-all hover:shadow-md hover:border-slate-200 cursor-pointer"
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-semibold text-slate-800">{apt.patient}</div>
                              <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                apt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                apt.status === 'Rescheduled' ? 'bg-amber-50 text-amber-800 border border-amber-200/50' :
                                apt.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {apt.status}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-400" /> {apt.doctor}
                              </div>
                              <div className="text-sm text-blue-600 font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" /> {apt.time}
                              </div>
                            </div>

                            <div className="flex gap-1.5 border-t pt-3 mt-1 text-[11px]">
                              {(apt.status === "Scheduled" || apt.status === "Rescheduled") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateStatus(apt.id, "In Progress")
                                  }}
                                  className="px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded font-semibold transition-colors"
                                >
                                  Start
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRescheduleClick(apt)
                                }}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCompleteAppointment(apt)
                                }}
                                className="px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded font-semibold transition-colors"
                              >
                                Complete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelAppointment(apt.id)
                                }}
                                className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded font-semibold transition-colors ml-auto"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
                  <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        Front Desk
                      </h2>
                      <p className="text-slate-500 text-lg max-w-lg mx-auto">
                        Welcome! Use the button below to quickly onboard a new patient and book their consultation.
                      </p>
                    </div>
                    
                    <div className="max-w-md mx-auto pt-8">
                      <BookingWizard onBookAppointment={handleAddAppointment} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Patients</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-slate-800">{stats.totalPatients}</div>
                        <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                          +{stats.patientsThisWeek} this week
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-slate-500 text-sm font-medium uppercase tracking-wider">Revenue Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-slate-800">${stats.revenueToday}</div>
                        <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                          {stats.completedTodayCount} appointments completed
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* E-Prescriptions Tab Content */}
            <TabsContent value="prescriptions" className="mt-0 outline-none">
              <EPrescriptionForm />
            </TabsContent>

            {/* Patient Directory Tab Content */}
            <TabsContent value="directory" className="mt-0 outline-none">
              <PatientDirectory />
            </TabsContent>

            {/* Requests Queue Tab Content */}
            <TabsContent value="requests" className="mt-0 outline-none">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-xl font-bold text-slate-800">Incoming Appointment Requests</CardTitle>
                  <CardDescription>
                    Verify details, fill in missing intake information, and approve requests sent via your public portal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {pendingRequests.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100">
                        <CheckSquare className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-slate-800 text-lg">All caught up!</h3>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto">
                        No pending requests from your booking page. Keep sharing your public booking link on Google and WhatsApp!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pendingRequests.map((req) => (
                        <Card key={req.id} className="border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-none">
                          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-slate-800 text-lg">{req.patient}</h4>
                                  <p className="text-xs text-slate-400 mt-0.5">Submitted: {new Date(req.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                                  {req.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                                <div>
                                  <span className="text-xs text-slate-400 block">Phone</span>
                                  <span className="font-medium text-xs break-all">{req.phone}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-slate-400 block">Assigned Doctor</span>
                                  <span className="font-medium text-xs">{req.doctor}</span>
                                </div>
                                <div className="mt-1">
                                  <span className="text-xs text-slate-400 block">Date</span>
                                  <span className="font-semibold text-xs text-primary">{req.date}</span>
                                </div>
                                <div className="mt-1">
                                  <span className="text-xs text-slate-400 block">Time Slot</span>
                                  <span className="font-semibold text-xs text-primary">{req.time}</span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-500 italic bg-blue-50/30 p-2.5 rounded border border-blue-50">
                                <span className="font-bold not-italic">Note:</span> "{req.reason}"
                              </p>
                            </div>

                            <div className="flex gap-2 border-t pt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeclineRequest(req.id)}
                                className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50/50 border-red-100 hover:border-red-200 gap-1 h-9"
                              >
                                <Trash2 className="w-4 h-4" /> Decline
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedRequest(req)
                                  setIsProcessModalOpen(true)
                                }}
                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 gap-1 h-9"
                              >
                                <CheckSquare className="w-4 h-4" /> Process
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Process Request Modal */}
        {selectedRequest && (
          <ProcessRequestModal
            isOpen={isProcessModalOpen}
            onClose={() => {
              setIsProcessModalOpen(false)
              setSelectedRequest(null)
            }}
            request={selectedRequest}
            onApprove={handleApproveRequest}
          />
        )}

        {/* Reschedule Modal */}
        {selectedRescheduleApt && (
          <RescheduleModal
            isOpen={isRescheduleModalOpen}
            onClose={() => {
              setIsRescheduleModalOpen(false)
              setSelectedRescheduleApt(null)
            }}
            appointment={selectedRescheduleApt}
            onReschedule={handleReschedule}
          />
        )}

        {/* Appointment Details Modal */}
        {selectedDetailsApt && (
          <AppointmentDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false)
              setSelectedDetailsApt(null)
            }}
            appointment={selectedDetailsApt}
            onDelete={handleCancelAppointment}
            onStart={(id) => handleUpdateStatus(id, "In Progress")}
            onReschedule={handleRescheduleClick}
          />
        )}

        {/* E-Prescription Print Output - It needs to be rendered without Tab wrappers hiding it during print */}
        {/* We keep EPrescriptionForm logic inside the tab, but since the form itself contains the print:block logic, 
            it will only print if the tab is active. That's usually fine since the doctor will click Print while on the tab. */}
      </div>
    </div>
  )
}
