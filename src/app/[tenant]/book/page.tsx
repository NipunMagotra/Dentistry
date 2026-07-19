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
  const [selectedDocId, setSelectedDocId] = useState("1")
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

    // Load full dynamic doctors list
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

    // Simulate database write delay
    setTimeout(() => {
      const selectedDoc = doctorsList.find(d => d.id === selectedDocId)?.name || "Doctor"
      
      const newRequest = {
        id: Date.now().toString(),
        patient: name,
        phone: phone,
        doctor: selectedDoc,
        date: date,
        time: time,
        reason: reason || "General Consultation",
        status: "Pending", // Pending receptionist verification
        createdAt: new Date().toISOString()
      }

      // Add to pending appointments list in localStorage
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

      // Trigger custom event just in case dashboard is open in another tab
      window.dispatchEvent(new Event("pending-appointments-updated"))

      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 800)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-slate-200 shadow-xl bg-white text-center p-6 md:p-8">
          <div className="mx-auto w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-2xl font-bold text-slate-800">Booking Requested!</CardTitle>
            <CardDescription className="text-slate-500 text-sm mt-1">
              Your appointment request has been sent to {profile.clinicName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-slate-700">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Doctor:</span>
                <span className="font-semibold text-slate-700">
                  {doctorsList.find(d => d.id === selectedDocId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-slate-700">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="font-semibold text-slate-700">{time}</span>
              </div>
            </div>
            
            <div className="text-xs text-slate-400 leading-relaxed">
              We will send you a confirmation message via WhatsApp/SMS once our front desk approves your slot.
            </div>

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
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold h-11"
            >
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row items-stretch">
      {/* Left Panel: Clinic Info & Trust Indicators */}
      <div className="md:w-5/12 bg-gradient-to-br from-primary to-primary/80 text-white p-8 md:p-12 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Clinic Brand */}
          <div className="flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-white/90" />
            <span className="text-xl font-bold uppercase tracking-wider">Clinic OS Portal</span>
          </div>

          {/* Clinic Details */}
          <div className="space-y-4 pt-6">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {profile.clinicName}
            </h1>
            <p className="text-slate-100 text-sm leading-relaxed max-w-md">
              {profile.clinicBio}
            </p>
          </div>

          {/* Location & Contact Info */}
          <div className="space-y-4 pt-6 border-t border-white/10 text-sm text-white/90">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-white/70" />
              <span>{profile.clinicAddress}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-white/70" />
              <span>{profile.clinicPhone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 shrink-0 text-white/70" />
              <span>{profile.clinicHours}</span>
            </div>
          </div>
        </div>

        {/* Quality Badges */}
        <div className="space-y-4 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-white/80">
            <ShieldCheck className="h-5 w-5 text-white/90" />
            <span>Verified Clinic Profile & Verified Doctor Credentials</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/80">
            <Sparkles className="h-5 w-5 text-white/90" />
            <span>Instant WhatsApp Notification Trigger on Approval</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Booking Form */}
      <div className="flex-1 p-6 md:p-12 flex items-center justify-center">
        <Card className="max-w-lg w-full border-slate-200 shadow-md bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-slate-800">Book Appointment</CardTitle>
            <CardDescription>
              Select your preferred provider and schedule your visit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="patient-name" className={nameTouched && !isNameValid ? "text-red-500 font-semibold" : ""}>
                  Your Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="patient-name" 
                    placeholder="Enter your full name" 
                    className={cn("pl-9 bg-slate-50/50", nameTouched && !isNameValid ? "border-red-400 focus:ring-red-200" : "")}
                    value={name}
                    onBlur={() => setNameTouched(true)}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                {nameTouched && !isNameValid && (
                  <span className="text-[11px] text-red-500 font-medium">Please enter at least 2 letters (no special characters).</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patient-phone" className={phoneTouched && !isPhoneValid ? "text-red-500 font-semibold" : ""}>
                  Mobile / WhatsApp Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="patient-phone" 
                    placeholder="e.g. +1 (555) 123-4567" 
                    className={cn("pl-9 bg-slate-50/50", phoneTouched && !isPhoneValid ? "border-red-400 focus:ring-red-200" : "")}
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
                  <span className="text-[11px] text-red-500 font-medium">Please enter a valid phone number (minimum 7 digits).</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Preferred Doctor</Label>
                  <Select value={selectedDocId} onValueChange={(val) => setSelectedDocId(val || "1")}>
                    <SelectTrigger className="bg-slate-50/50">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorsList.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="appointment-date">Preferred Date</Label>
                  <Input 
                    id="appointment-date" 
                    type="date" 
                    className="bg-slate-50/50"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Preferred Time Slot</Label>
                  <Select value={time} onValueChange={(val) => setTime(val || "")}>
                    <SelectTrigger className="bg-slate-50/50">
                      <SelectValue placeholder="Select Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visit-reason">Reason for Visit (Optional)</Label>
                  <Input 
                    id="visit-reason" 
                    placeholder="e.g. Toothache, Scaling" 
                    className="bg-slate-50/50"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !isFormValid}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold h-11 mt-6"
              >
                {isSubmitting ? "Submitting Request..." : "Request Appointment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
