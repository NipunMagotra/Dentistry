"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Building2, Calendar, Clock, User, Phone, MapPin, CheckCircle, ShieldCheck, HeartPulse, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "02:00 PM", "02:30 PM", "05:30 PM", "06:00 PM", "06:30 PM"
]

export default function PublicBookingPage() {
  const params = useParams()
  const tenant = params?.tenant as string

  // State for clinic bio
  const [profile, setProfile] = useState({
    clinicName: "City Dental Clinic",
    clinicAddress: "123 Health Avenue, Medical District",
    clinicPhone: "+1 (555) 123-4567",
    clinicBio: "Welcome to our patient booking portal. Schedule a consultation, dental check-up, or specialized treatment with our dental professionals in just a few clicks.",
    clinicHours: "Mon - Sat: 9:00 AM - 7:00 PM",
    doctorHours: "Mon - Fri: 10:00 AM - 5:00 PM",
    doctorName: "Dr. Sarah Jenkins",
    doctorDegrees: "BDS, MDS (Periodontics)"
  })

  // Doctors list (merges customized doctor dynamically)
  const [doctorsList, setDoctorsList] = useState([
    { id: "1", name: "Dr. Sarah Jenkins", specialty: "Periodontics & Implants (Mon - Fri: 10:00 AM - 5:00 PM)" },
    { id: "2", name: "Dr. Michael Chen", specialty: "Cosmetic Dentistry (Mon - Fri: 9:00 AM - 6:00 PM)" },
    { id: "3", name: "Dr. Emily Rodriguez", specialty: "Orthodontics (Mon, Wed, Fri: 11:00 AM - 4:00 PM)" }
  ])

  // Form State
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedDocId, setSelectedDocId] = useState("Dr. Sarah Jenkins")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [reason, setReason] = useState("")

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation touch states
  const [nameTouched, setNameTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)

  // Validation rules
  const isNameValid = name.trim().length >= 2 && /^[a-zA-Z\s.]{2,}$/.test(name)
  const isPhoneValid = /^\+?[0-9\s\-()]{7,}$/.test(phone)
  const isFormValid = isNameValid && isPhoneValid && !!date && !!time

  // Load clinic settings & dynamic doctors list
  useEffect(() => {
    const saved = localStorage.getItem("clinic_profile_settings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProfile({
          clinicName: parsed.clinicName || "City Dental Clinic",
          clinicAddress: parsed.clinicAddress || "123 Health Avenue, Medical District",
          clinicPhone: parsed.clinicPhone || "+1 (555) 123-4567",
          clinicBio: parsed.clinicBio || "Welcome to our patient booking portal. Schedule a consultation, dental check-up, or specialized treatment with our dental professionals in just a few clicks.",
          clinicHours: parsed.clinicHours || "Mon - Sat: 9:00 AM - 7:00 PM",
          doctorHours: parsed.doctorHours || "Mon - Fri: 10:00 AM - 5:00 PM",
          doctorName: parsed.doctorName || "Dr. Sarah Jenkins",
          doctorDegrees: parsed.doctorDegrees || "BDS, MDS (Periodontics)"
        })
      } catch (e) {
        console.error(e)
      }
    }

    const savedDocs = localStorage.getItem("clinic_doctors_list")
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDoctorsList(parsed.map((d: any) => ({
            id: d.id,
            name: d.name,
            specialty: `${d.specialty || d.degrees || "General Dentistry"} (${d.timings || "Mon - Fri"})`
          })))
        }
      } catch (e) {
        console.error("Error loading doctors list on booking page", e)
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNameTouched(true)
    phoneTouched && setPhoneTouched(true)
    
    if (!isFormValid) return

    setIsSubmitting(true)

    setTimeout(() => {
      const selectedDoc = doctorsList.find(d => d.name === selectedDocId)?.name || "Doctor"
      
      const newRequest = {
        id: Date.now().toString(),
        patient: name,
        phone: phone,
        doctor: selectedDoc,
        date: date,
        time: time,
        reason: reason || "General Consultation",
        status: "Pending",
        createdAt: new Date().toISOString()
      }

      const existing = localStorage.getItem("pending_appointments")
      let list = []
      if (existing) {
        try {
          list = JSON.parse(existing)
        } catch (e) {
          console.error(e)
        }
      }
      list.push(newRequest)
      localStorage.setItem("pending_appointments", JSON.stringify(list))

      window.dispatchEvent(new Event("pending-appointments-updated"))

      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 800)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <Card className="max-w-md w-full glass-panel border border-white/40 dark:border-white/10 shadow-2xl text-center p-8 relative z-10">
          <div className="mx-auto size-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="size-10" />
          </div>
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-2xl font-bold">Booking Requested!</CardTitle>
            <CardDescription className="text-muted-foreground text-sm mt-1">
              Your appointment request has been sent to {profile.clinicName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <div className="p-4 rounded-2xl glass-panel text-left text-sm space-y-3 border border-black/5 dark:border-white/5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold text-foreground">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor:</span>
                <span className="font-semibold text-foreground">
                  {doctorsList.find(d => d.name === selectedDocId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-semibold text-foreground">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-semibold text-foreground">{time}</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              We will send you a confirmation message via WhatsApp/SMS once our front desk approves your slot.
            </p>

            <Button 
              onClick={() => {
                setIsSubmitted(false)
                setName("")
                setPhone("")
                setReason("")
                setDate("")
                setTime("")
                setNameTouched(false)
                setPhoneTouched(false)
              }}
              className="w-full bg-primary text-primary-foreground font-semibold rounded-full h-11 shadow-lg shadow-primary/25"
            >
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Panel: Clinic Info (Apple Glass Aesthetic) */}
      <div className="md:w-5/12 glass-panel p-8 md:p-12 flex flex-col justify-between relative z-10 border-r border-white/20 dark:border-white/5">
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-md">
                <HeartPulse className="size-6" />
              </div>
              <span className="text-lg font-bold tracking-tight uppercase">Clinic OS Portal</span>
            </div>
            <ThemeToggle />
          </div>

          <div className="space-y-4 pt-4">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {profile.clinicName}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              {profile.clinicBio}
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5 text-sm">
            <div className="flex items-start gap-3 text-muted-foreground">
              <MapPin className="size-5 shrink-0 text-primary mt-0.5" />
              <span className="text-foreground font-medium">{profile.clinicAddress}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="size-5 shrink-0 text-primary" />
              <span className="text-foreground font-medium">{profile.clinicPhone}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="size-5 shrink-0 text-primary" />
              <span className="text-foreground font-medium">{profile.clinicHours}</span>
            </div>
          </div>
        </div>

        <div className="pt-8 text-xs text-muted-foreground font-medium">
          Powered by Clinic OS Patient Portal
        </div>
      </div>

      {/* Right Panel: Booking Form Card */}
      <div className="flex-1 p-6 md:p-12 flex items-center justify-center relative z-10">
        <Card className="max-w-xl w-full glass-panel border border-white/40 dark:border-white/10 shadow-2xl p-6 md:p-8">
          <CardHeader className="pb-6 p-0">
            <CardTitle className="text-2xl font-bold">Request Appointment</CardTitle>
            <CardDescription className="text-muted-foreground">
              Select your preferred provider and schedule your visit.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="patient-name" className={nameTouched && !isNameValid ? "text-destructive font-semibold" : ""}>
                  Your Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-3 size-4 text-muted-foreground" />
                  <Input 
                    id="patient-name" 
                    placeholder="Enter your full name" 
                    className={cn("pl-10", nameTouched && !isNameValid ? "border-destructive focus-visible:ring-destructive/20" : "")}
                    value={name}
                    onBlur={() => setNameTouched(true)}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                {nameTouched && !isNameValid && (
                  <span className="text-[11px] text-destructive font-medium">Please enter at least 2 letters.</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-phone" className={phoneTouched && !isPhoneValid ? "text-destructive font-semibold" : ""}>
                  Mobile / WhatsApp Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3 size-4 text-muted-foreground" />
                  <Input 
                    id="patient-phone" 
                    placeholder="e.g. +1 (555) 123-4567" 
                    className={cn("pl-10", phoneTouched && !isPhoneValid ? "border-destructive focus-visible:ring-destructive/20" : "")}
                    value={phone}
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9\s+\-()]/g, "")
                      setPhone(val)
                    }}
                    required
                  />
                </div>
                {phoneTouched && !isPhoneValid && (
                  <span className="text-[11px] text-destructive font-medium">Please enter a valid phone number.</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Preferred Doctor</Label>
                  <Select value={selectedDocId} onValueChange={(val) => setSelectedDocId(val || "Dr. Sarah Jenkins")}>
                    <SelectTrigger className="rounded-full h-10 px-4 border-black/10 dark:border-white/15 bg-white/70 dark:bg-zinc-900/60">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl glass-panel">
                      {doctorsList.map((doc) => (
                        <SelectItem key={doc.id} value={doc.name}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-date">Preferred Date</Label>
                  <Input 
                    id="appointment-date" 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Time Slot</Label>
                  <Select value={time} onValueChange={(val) => setTime(val || "")}>
                    <SelectTrigger className="rounded-full h-10 px-4 border-black/10 dark:border-white/15 bg-white/70 dark:bg-zinc-900/60">
                      <SelectValue placeholder="Select Time" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl glass-panel">
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visit-reason">Reason for Visit</Label>
                  <Input 
                    id="visit-reason" 
                    placeholder="e.g. Scaling, Pain" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isFormValid}
                  className="w-full bg-primary text-primary-foreground font-semibold h-11 rounded-full shadow-lg shadow-primary/25"
                >
                  {isSubmitting ? "Submitting Request..." : "Request Appointment"}
                </Button>

                <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                    <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                    <span>Verified Clinic Profile & Certified Specialists</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                    <Sparkles className="size-4 text-primary shrink-0" />
                    <span>Instant WhatsApp Confirmation Notification</span>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
