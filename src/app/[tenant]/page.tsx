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
import { Clock, User, CalendarRange, FileText, Bell, Inbox, Trash2, CheckSquare, MoreHorizontal, CheckCircle2, AlertTriangle, CalendarX, TrendingUp, Users, DollarSign, Activity } from "lucide-react"
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

  const handleAddAppointment = (newApt: any) => {
    const optimisticApt = {
      id: Date.now().toString(),
      time: newApt.time,
      patient: newApt.patient,
      doctor: newApt.doctor,
      status: newApt.status || "Scheduled"
    }
    setAppointments((prev) => [...prev, optimisticApt])
    
    startTransition(async () => {
      try {
        const apts = await getAppointments()
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

    setPendingRequests(prev => prev.filter(req => req.id !== selectedRequest.id))
    const optimisticApt = {
      id: selectedRequest.id,
      patient: approvedApt.patient,
      doctor: approvedApt.doctor,
      time: approvedApt.time,
      status: approvedApt.status
    }
    setAppointments(prev => [...prev, optimisticApt])

    const result = await updateAppointmentDetails(selectedRequest.id, {
       doctor: approvedApt.doctor,
       date: approvedApt.date,
       time: approvedApt.time,
       status: approvedApt.status
    })

    if (!result.success) {
      showToast("❌ Failed to approve appointment.")
      startTransition(() => loadAppointments())
      return
    }

    startTransition(() => {
      loadAppointments()
    })

    setIsProcessModalOpen(false)
    setSelectedRequest(null)
    showToast(`Confirmed appointment for ${approvedApt.patient}`)

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
    setPendingRequests(prev => prev.filter(req => req.id !== id))
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
    
    setAppointments(prev => prev.map(a => 
      a.id === cancelTargetId ? { ...a, status: "Cancelled" } : a
    ))

    await updateAppointmentStatus(cancelTargetId, "Cancelled")
    startTransition(() => {
      loadAppointments()
    })
    setCancelTargetId(null)
    if (apt) showToast(`Appointment for ${apt.patient} cancelled`)
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setAppointments(prev => prev.map(apt => 
        apt.id === id ? { ...apt, status: newStatus } : apt
      ))
      
      const result = await updateAppointmentStatus(id, newStatus)
      if (result && result.error) {
        showToast(`❌ Error: ${(result.error as any).message || "Failed"}`)
        startTransition(() => { loadAppointments() })
        return
      }
      startTransition(() => {
        loadAppointments()
      })
    } catch (error: any) {
      showToast(`❌ Error: ${error.message || "Unknown error"}`)
      startTransition(() => { loadAppointments() })
    }
  }

  const handleRescheduleClick = (apt: Appointment) => {
    setSelectedRescheduleApt(apt)
    setIsRescheduleModalOpen(true)
  }

  const handleReschedule = async (id: string, newDate: string, newTime: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, time: newTime, status: "Rescheduled" } : apt
    ))

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
    setAppointments(prev => prev.map(a => 
      a.id === apt.id ? { ...a, status: "Completed" } : a
    ))

    await updateAppointmentStatus(apt.id, "Completed")
    startTransition(() => {
      loadAppointments()
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 lg:p-12 relative overflow-hidden">
      
      {/* Background Decorative Ambient Orbs (Apple M3 Ambient Mesh) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-subtle-float" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-subtle-float" style={{ animationDelay: "3s" }} />

      <div className="max-w-7xl w-full relative z-10 space-y-8 animate-fade-in-up">
        
        {/* Header Glass Dock (Apple Style Top Nav Bar) */}
        <header className="glass-panel rounded-3xl p-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden transition-spring hover:shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-2xl border border-primary/20 transition-transform hover:scale-105">
              <Image 
                src="/horizontal-logo.png" 
                alt="Clinic OS Logo" 
                width={180} 
                height={45} 
                className="h-9 w-auto object-contain dark:brightness-200"
                priority 
              />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                {profile.clinicName}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-2">
                <span>Welcome back, <strong className="text-primary font-semibold">{profile.doctorName}</strong></span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {pendingRequests.length > 0 && (
              <div className="relative p-2.5 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse-glow">
                <Bell className="size-5" />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] size-5 rounded-full flex items-center justify-center font-bold shadow-md">
                  {pendingRequests.length}
                </span>
              </div>
            )}
            <ProfileModal tenant={tenant} />
          </div>
        </header>

        {/* Navigation Tabs (Apple Segmented Glass Control) */}
        <div className="print:hidden">
          <Tabs defaultValue="appointments" className="w-full space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-3xl h-14 p-1.5 glass-panel rounded-full shadow-lg">
                <TabsTrigger value="appointments" className="text-sm font-semibold rounded-full gap-2">
                  <CalendarRange className="size-4" /> Appointments
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="text-sm font-semibold rounded-full gap-2">
                  <FileText className="size-4" /> E-Prescriptions
                </TabsTrigger>
                <TabsTrigger value="directory" className="text-sm font-semibold rounded-full gap-2">
                  <User className="size-4" /> Patients
                </TabsTrigger>
                <TabsTrigger value="requests" className="text-sm font-semibold rounded-full gap-2 relative">
                  <Inbox className="size-4" /> Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {pendingRequests.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Appointments Tab Content */}
            <TabsContent value="appointments" className="mt-0 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Today's Appointments List */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="h-[75vh] flex flex-col border border-white/40 dark:border-white/10 glass-panel">
                    <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">Today's Schedule</CardTitle>
                        <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
                          {appointments.filter(a => a.status !== "Completed").length} Pending
                        </span>
                      </div>
                      <CardDescription>Real-time queue management for {profile.doctorName}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-auto p-4 flex flex-col gap-3">
                      {appointments.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-center text-muted-foreground text-sm gap-3">
                          <div className="p-4 bg-muted/50 rounded-full">
                            <CalendarX className="size-8 text-muted-foreground/60" />
                          </div>
                          <p className="font-medium">No appointments scheduled for today.</p>
                        </div>
                      ) : (
                        appointments.map((apt) => (
                          <div 
                            key={apt.id} 
                            onClick={() => {
                              setSelectedDetailsApt(apt)
                              setIsDetailsModalOpen(true)
                            }}
                            className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                              apt.status === "Completed" 
                                ? "opacity-60 bg-muted/30 border-black/5 dark:border-white/5" 
                                : "glass-panel glass-card border-white/50 dark:border-white/10 shadow-sm hover:shadow-md"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-bold text-foreground text-base">{apt.patient}</div>
                              <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                                apt.status === 'In Progress' ? 'bg-primary text-primary-foreground shadow-xs' :
                                apt.status === 'Rescheduled' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                apt.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                              }`}>
                                {apt.status}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 mt-2">
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <User className="size-3.5 text-primary" /> {apt.doctor}
                              </div>
                              <div className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                                <Clock className="size-3.5 text-primary" /> {apt.time}
                              </div>
                            </div>

                            {apt.status !== "Completed" && (
                              <div className="flex items-center gap-2 border-t border-black/5 dark:border-white/5 pt-3 mt-3">
                                {(apt.status === "Scheduled" || apt.status === "Rescheduled") && (
                                  <Button
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(apt.id, "In Progress")
                                    }}
                                    className="bg-primary text-primary-foreground font-semibold rounded-full"
                                  >
                                    Start Consultation
                                  </Button>
                                )}
                                {apt.status === "In Progress" && (
                                  <Button
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCompleteAppointment(apt)
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full"
                                  >
                                    Complete
                                  </Button>
                                )}

                                <div className="ml-auto">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRescheduleClick(apt)
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Side: Quick Front Desk & Google M3 Metric Chips */}
                <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
                  <Card className="glass-panel border border-white/40 dark:border-white/10 p-8 md:p-10 text-center space-y-6">
                    <div className="space-y-3 max-w-xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase">
                        <Activity className="size-3.5" /> Front Desk Hub
                      </div>
                      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                        Book & Onboard Patient
                      </h2>
                      <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                        Select patient details below to quickly issue consultations, assign doctors, and notify patients via WhatsApp.
                      </p>
                    </div>
                    
                    <div className="max-w-md mx-auto pt-4">
                      <BookingWizard onBookAppointment={handleAddAppointment} />
                    </div>
                  </Card>

                  {/* Material M3 Metric Containers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Card className="glass-panel p-5 border border-white/40 dark:border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Patients</span>
                        <div className="p-2 bg-primary/10 text-primary rounded-full">
                          <Users className="size-4" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-3xl font-extrabold text-foreground">{stats.totalPatients}</div>
                        <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <TrendingUp className="size-3.5" /> +{stats.patientsThisWeek} this week
                        </p>
                      </div>
                    </Card>

                    <Card className="glass-panel p-5 border border-white/40 dark:border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Revenue</span>
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                          <DollarSign className="size-4" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-3xl font-extrabold text-foreground">${stats.revenueToday}</div>
                        <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" /> {stats.completedTodayCount} consultations
                        </p>
                      </div>
                    </Card>

                    <Card className="glass-panel p-5 border border-white/40 dark:border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">No-Show Rate</span>
                        <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                          <Clock className="size-4" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-3xl font-extrabold text-foreground">{stats.noShowRate}%</div>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                          Optimized via SMS reminders
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* E-Prescriptions Tab */}
            <TabsContent value="prescriptions" className="mt-0 outline-none">
              <EPrescriptionForm />
            </TabsContent>

            {/* Patient Directory Tab */}
            <TabsContent value="directory" className="mt-0 outline-none">
              <PatientDirectory />
            </TabsContent>

            {/* Requests Queue Tab */}
            <TabsContent value="requests" className="mt-0 outline-none">
              <Card className="glass-panel p-6 border border-white/40 dark:border-white/10">
                <CardHeader className="border-b border-black/5 dark:border-white/5 pb-4">
                  <CardTitle className="text-xl font-bold">Incoming Appointment Requests</CardTitle>
                  <CardDescription>
                    Review patient requests submitted through your online portal and add them directly to your schedule.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {pendingRequests.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <div className="mx-auto size-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckSquare className="size-6" />
                      </div>
                      <h3 className="font-bold text-foreground text-lg">All requests processed!</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        There are no pending requests in the queue. Share your online booking link to receive new appointments.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pendingRequests.map((req) => (
                        <Card key={req.id} className="glass-panel p-5 border border-white/40 dark:border-white/10 hover:shadow-xl transition-all">
                          <CardContent className="p-0 flex flex-col justify-between h-full gap-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-foreground text-lg">{req.patient}</h4>
                                  <p className="text-xs text-muted-foreground">Received: {new Date(req.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-amber-500/20">
                                  {req.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-2xl border border-black/5 dark:border-white/5">
                                <div>
                                  <span className="text-muted-foreground block text-[10px]">Phone</span>
                                  <span className="font-semibold">{req.phone}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block text-[10px]">Assigned Doctor</span>
                                  <span className="font-semibold">{req.doctor}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block text-[10px]">Requested Date</span>
                                  <span className="font-bold text-primary">{req.date}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block text-[10px]">Time Slot</span>
                                  <span className="font-bold text-primary">{req.time}</span>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground italic bg-primary/5 p-3 rounded-xl border border-primary/10">
                                <span className="font-bold not-italic">Reason:</span> "{req.reason}"
                              </p>
                            </div>

                            <div className="flex gap-3 border-t border-black/5 dark:border-white/5 pt-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeclineRequest(req.id)}
                                className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20 rounded-full"
                              >
                                <Trash2 className="size-4" /> Decline
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedRequest(req)
                                  setIsProcessModalOpen(true)
                                }}
                                className="flex-1 bg-primary text-primary-foreground font-semibold rounded-full shadow-md"
                              >
                                <CheckSquare className="size-4" /> Process & Confirm
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
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelTargetId} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> Cancel Appointment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex sm:justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelTargetId(null)} className="rounded-full">Keep Appointment</Button>
            <Button variant="destructive" onClick={confirmCancelAppointment} className="rounded-full font-semibold">Yes, Cancel It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 glass-panel bg-slate-950/90 text-white px-5 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border border-white/20">
          <CheckCircle2 className="size-5 text-emerald-400" />
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
