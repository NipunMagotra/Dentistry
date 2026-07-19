"use client"

import { useState, useEffect, useTransition } from "react"
import { useParams } from "next/navigation"
import { getAppointments, getPendingRequests, updateAppointmentStatus, updateAppointmentDetails, getClinicStats } from "@/app/actions"
import { BookingWizard } from "@/components/BookingWizard"
import { EPrescriptionForm } from "@/components/EPrescriptionForm"
import { PatientDirectory } from "@/components/PatientDirectory"
import { RescheduleModal } from "@/components/RescheduleModal"
import { AppointmentDetailsModal } from "@/components/AppointmentDetailsModal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, User, CalendarRange, FileText, Bell, Inbox, Trash2, CheckSquare, MoreHorizontal, CheckCircle2, AlertTriangle, CalendarX } from "lucide-react"
import Image from "next/image"
import { ProfileModal } from "@/components/ProfileModal"
import { ProcessRequestModal } from "@/components/ProcessRequestModal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

  // Cancel confirmation state
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false })
  const showToast = (message: string) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast({ message: "", visible: false }), 3000)
  }

  const [isPending, startTransition] = useTransition()

  const loadAppointments = async () => {
    try {
      const apts = await getAppointments()
      // Only overwrite if we have valid DB records, otherwise keep optimistic state
      if (apts && apts.length > 0) {
        setAppointments(apts)
      }
      
      const pending = await getPendingRequests()
      if (pending && pending.length > 0) {
        setPendingRequests(pending)
      }
      
      const clinicStats = await getClinicStats()
      setStats(clinicStats)
    } catch (e) {
      console.error(e)
    }
  }

  // Load active appointments from DB
  useEffect(() => {
    startTransition(() => {
      loadAppointments()
    })
  }, [])

  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsThisWeek: 0,
    revenueToday: 0,
    completedTodayCount: 0,
    noShowRate: 0
  })

  // Safe localStorage writer with quota error handling
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      console.error(`[Storage] Failed to write key "${key}" — quota may be exceeded`, e)
    }
  }

  // Load clinic settings & doctors list
  useEffect(() => {
    const loadProfile = () => {
      let nameFallback = "Dr. Sarah Jenkins"
      const savedDocs = localStorage.getItem("clinic_doctors_list")
      if (savedDocs) {
        try {
          const parsedDocs = JSON.parse(savedDocs)
          if (parsedDocs.length > 0) {
            nameFallback = parsedDocs[0].name
          }
        } catch (e) {
          console.error(e)
        }
      }

      const saved = localStorage.getItem("clinic_profile_settings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setProfile({
            clinicName: parsed.clinicName || "City Dental Clinic",
            doctorName: parsed.doctorName || nameFallback
          })
        } catch (e) {
          console.error("Error loading profile in dashboard", e)
        }
      } else {
        setProfile({
          clinicName: "City Dental Clinic",
          doctorName: nameFallback
        })
      }
    }
    loadProfile()
    window.addEventListener("clinic-profile-updated", loadProfile)
    window.addEventListener("clinic-doctors-updated", loadProfile)
    return () => {
      window.removeEventListener("clinic-profile-updated", loadProfile)
      window.removeEventListener("clinic-doctors-updated", loadProfile)
    }
  }, [])

  // Pending requests are now loaded via loadAppointments, so we remove the localStorage effect
  
  const handleAddAppointment = (newApt: any) => {
    // Optimistically update the UI to instantly show the new appointment
    const optimisticApt = {
      id: Date.now().toString(),
      time: newApt.time,
      patient: newApt.patient,
      doctor: newApt.doctor,
      status: newApt.status || "Scheduled"
    }
    setAppointments((prev) => [...prev, optimisticApt])
    
    // Then attempt to refresh from DB
    startTransition(async () => {
      try {
        const apts = await getAppointments()
        // Only overwrite if we actually fetched something from DB (protects against missing .env in demo)
        if (apts && apts.length > 0) {
          setAppointments(apts)
        }
      } catch (e) {
        console.error("Failed to sync appointments from DB", e)
      }
    })
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

    // 1. Update appointment in DB
    const result = await updateAppointmentDetails(selectedRequest.id, {
       doctor: approvedApt.doctor,
       date: approvedApt.date,
       time: approvedApt.time,
       status: approvedApt.status
    })

    if (!result.success) {
      showToast("❌ Failed to approve appointment.")
      return
    }

    // 2. Refresh local state via DB
    startTransition(() => {
      loadAppointments()
    })

    // 3. Close modal instantly to optimize INP
    setIsProcessModalOpen(false)
    setSelectedRequest(null)

    // 4. Show confirmation toast
    showToast(`✅ Appointment for ${approvedApt.patient} has been confirmed and added to today's schedule.`)

    // 4. Trigger SMS/WhatsApp workflow API call in background
    fetch("/api/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientPhone: approvedApt.phone,
        patientName: approvedApt.patient,
        doctorName: approvedApt.doctor,
        appointmentDate: approvedApt.date,
        appointmentTime: approvedApt.time
      })
    }).catch((err) => {
      console.error("Failed to trigger workflow", err)
    })
  }

  const handleDeclineRequest = async (id: string) => {
    await updateAppointmentStatus(id, "Declined")
    startTransition(() => {
      loadAppointments()
    })
  }

  const handleCancelAppointment = (id: string) => {
    setCancelTargetId(id)
  }

  const confirmCancelAppointment = async () => {
    if (!cancelTargetId) return
    const apt = appointments.find(a => a.id === cancelTargetId)
    await updateAppointmentStatus(cancelTargetId, "Cancelled")
    startTransition(() => {
      loadAppointments()
    })
    setCancelTargetId(null)
    if (apt) showToast(`Appointment for ${apt.patient} has been cancelled.`)
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    await updateAppointmentStatus(id, newStatus)
    startTransition(() => {
      loadAppointments()
    })
  }

  const handleRescheduleClick = (apt: Appointment) => {
    setSelectedRescheduleApt(apt)
    setIsRescheduleModalOpen(true)
  }

  const handleReschedule = async (id: string, newDate: string, newTime: string) => {
    await updateAppointmentDetails(id, { date: newDate, time: newTime, status: "Rescheduled" })
    startTransition(() => {
      loadAppointments()
    })

    const rescheduledApt = appointments.find(a => a.id === id)
    if (rescheduledApt) {
      fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientPhone: "+1 (555) 123-4567",
          patientName: rescheduledApt.patient,
          doctorName: rescheduledApt.doctor,
          appointmentDate: newDate,
          appointmentTime: newTime
        })
      }).catch((err) => {
        console.error("Failed to trigger reschedule workflow", err)
      })
    }
  }

  const handleCompleteAppointment = async (apt: Appointment) => {
    // Update status to Completed natively via DB
    await updateAppointmentStatus(apt.id, "Completed")
    startTransition(() => {
      loadAppointments()
    })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full">
        
        {/* Header (Hidden on print) */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200 print:hidden">
          <div>
            <Image 
              src="/horizontal-logo.png" 
              alt="Clinic OS Logo" 
              width={200} 
              height={50} 
              className="h-12 w-auto object-contain mb-2"
              priority 
            />
            <p className="text-slate-500 text-sm mt-1">
              Welcome, <span className="font-semibold text-slate-700">{profile.doctorName}</span>. Manage {profile.clinicName} from one place.
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
              style={{ display: "grid", width: "100%", height: "auto" }}
              className="grid w-full max-w-4xl grid-cols-4 mb-8 bg-slate-200/60 p-1.5 rounded-2xl h-auto"
            >
              <TabsTrigger value="appointments" className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all">
                <CalendarRange className="h-4 w-4" /> Appointments
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all">
                <FileText className="h-4 w-4" /> E-Prescriptions
              </TabsTrigger>
              <TabsTrigger value="directory" className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all">
                <User className="h-4 w-4" /> Patient Directory
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all relative">
                <Inbox className="h-4 w-4" /> 
                <span>Requests Queue</span>
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
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
                    <CardDescription>You have {appointments.filter(a => a.status !== "Completed").length} appointment{appointments.filter(a => a.status !== "Completed").length !== 1 ? "s" : ""} today.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-4 flex flex-col space-y-4">
                      {appointments.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-center text-slate-400 text-sm space-y-3">
                          <CalendarX className="w-12 h-12 text-slate-200" />
                          <p>No appointments booked yet. Use the wizard to add one.</p>
                        </div>
                      ) : (
                        appointments.map((apt) => (
                          <div 
                            key={apt.id} 
                            onClick={() => {
                              setSelectedDetailsApt(apt)
                              setIsDetailsModalOpen(true)
                            }}
                            className={`p-4 border border-slate-100 rounded-xl shadow-sm flex flex-col gap-3 transition-all cursor-pointer ${
                              apt.status === "Completed" ? "opacity-60 bg-slate-50" : "bg-white hover:shadow-md hover:border-slate-200"
                            }`}
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

                            {apt.status !== "Completed" && (
                              <div className="flex items-center gap-1.5 border-t pt-3 mt-1 text-[11px]">
                                {/* Primary action button */}
                                {(apt.status === "Scheduled" || apt.status === "Rescheduled") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(apt.id, "In Progress")
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-semibold transition-colors"
                                  >
                                    Start
                                  </button>
                                )}
                                {apt.status === "In Progress" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCompleteAppointment(apt)
                                    }}
                                    className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-md font-semibold transition-colors"
                                  >
                                    Complete
                                  </button>
                                )}

                                {/* Secondary actions — ellipsis menu */}
                                <div className="relative ml-auto group">
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                  <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[130px] z-20">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRescheduleClick(apt)
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                      Reschedule
                                    </button>
                                    {(apt.status === "Scheduled" || apt.status === "Rescheduled") && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCompleteAppointment(apt)
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                      >
                                        Mark Complete
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleCancelAppointment(apt.id)
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
                  <div className="bg-white py-6 px-8 md:px-12 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-slate-600 text-sm font-medium uppercase tracking-wider">Total Patients</CardTitle>
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
                        <CardTitle className="text-slate-600 text-sm font-medium uppercase tracking-wider">Revenue Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-slate-800">${stats.revenueToday}</div>
                        <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                          {stats.completedTodayCount} appointments
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-slate-600 text-sm font-medium uppercase tracking-wider">No-Show Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-slate-800">{stats.noShowRate}%</div>
                        <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1">
                          vs previous week
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

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelTargetId} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Cancel Appointment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex sm:justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelTargetId(null)}>Keep Appointment</Button>
            <Button variant="destructive" onClick={confirmCancelAppointment} className="bg-red-600 hover:bg-red-700">Yes, Cancel It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          {toast.message.includes("✅") ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
          )}
          <span className="font-medium text-sm">{toast.message.replace("✅ ", "")}</span>
        </div>
      )}
    </div>
  )
}
