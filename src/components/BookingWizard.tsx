"use client"

import { useState, useEffect } from "react"
import { getDoctors, createAppointment } from "@/app/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const DEFAULT_DOCTORS = [
  { id: "1", name: "Dr. Sarah Jenkins", charge: 150 },
  { id: "2", name: "Dr. Michael Chen", charge: 200 },
  { id: "3", name: "Dr. Emily Rodriguez", charge: 180 },
]

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "02:00 PM", "02:30 PM", "05:30 PM", "06:00 PM", "06:30 PM"
]

const NATIONALITIES = [
  "Indian", "Emirati", "American", "British", "Saudi", "Omani", "Qatari", "Kuwaiti", "Bahraini", "Filipino", "Pakistani", "Egyptian", "Other"
]

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91", country: "India" },
  { code: "+971", label: "🇦🇪 +971", country: "UAE" },
  { code: "+1", label: "🇺🇸 +1", country: "US" },
  { code: "+44", label: "🇬🇧 +44", country: "UK" },
  { code: "+966", label: "🇸🇦 +966", country: "Saudi" },
  { code: "+968", label: "🇴🇲 +968", country: "Oman" },
  { code: "+974", label: "🇶🇦 +974", country: "Qatar" },
  { code: "+965", label: "🇰🇼 +965", country: "Kuwait" },
  { code: "+973", label: "🇧🇭 +973", country: "Bahrain" },
  { code: "+63", label: "🇵🇭 +63", country: "Philippines" },
  { code: "+92", label: "🇵🇰 +92", country: "Pakistan" },
  { code: "+20", label: "🇪🇬 +20", country: "Egypt" },
]

type BookingWizardProps = {
  onBookAppointment?: (apt: { time: string; patient: string; phone?: string; doctor: string; status: string }) => void
}

export function BookingWizard({ onBookAppointment }: BookingWizardProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [doctorsList, setDoctorsList] = useState<any[]>(DEFAULT_DOCTORS)

  // Sync doctors list dynamically from DB
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const docs = await getDoctors()
        setDoctorsList(docs.length > 0 ? docs : DEFAULT_DOCTORS)
      } catch (e) {
        console.error("Error fetching doctors list in BookingWizard", e)
        setDoctorsList(DEFAULT_DOCTORS)
      }
    }
    loadDoctors()
  }, [open])

  // Form State
  const [patientData, setPatientData] = useState({
    name: "",
    countryCode: "+91",
    phone: "",
    nationality: "",
    gender: "",
  })
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [date, setDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")

  // Compute the start of today for disabling past dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Validation touch states
  const [nameTouched, setNameTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [nationalityTouched, setNationalityTouched] = useState(false)
  const [genderTouched, setGenderTouched] = useState(false)

  // Validation rules
  const isNameValid = patientData.name.trim().length >= 2 && /^[a-zA-Z\s.]{2,}$/.test(patientData.name)
  const isPhoneValid = /^\+?[0-9\s\-()]{7,}$/.test(patientData.phone)
  const isNationalityValid = !!patientData.nationality
  const isGenderValid = !!patientData.gender

  const doctorCharge = doctorsList.find(d => d.name === selectedDoctor)?.charge

  const handleNext = () => {
    // Enable touching all fields on next attempt to highlight errors if any
    setNameTouched(true)
    setPhoneTouched(true)
    setNationalityTouched(true)
    setGenderTouched(true)
    
    if (step === 1 && (!isNameValid || !isPhoneValid || !isNationalityValid || !isGenderValid)) {
      return
    }
    setStep((s) => Math.min(s + 1, 3))
  }
  
  const handleBack = () => setStep((s) => Math.max(s - 1, 1))
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleComplete = async () => {
    setIsSubmitting(true)
    console.log("Booking complete", { patientData, selectedDoctor, date, selectedTime })
    
    // Server Action
    const result = await createAppointment({
      patientName: patientData.name,
      patientPhone: `${patientData.countryCode} ${patientData.phone}`,
      doctorName: doctorsList.find(d => d.id === selectedDoctor)?.name || selectedDoctor, // We store ID in state now
      appointmentDate: date?.toISOString(),
      appointmentTime: selectedTime,
      status: "Scheduled"
    })

    if (!result.success) {
      console.error("Failed to create appointment", result.error)
    }

    // Update local UI state if prop provided
    if (onBookAppointment) {
      onBookAppointment({
        time: selectedTime,
        patient: patientData.name,
        phone: `${patientData.countryCode} ${patientData.phone}`,
        doctor: doctorsList.find(d => d.id === selectedDoctor)?.name || selectedDoctor,
        status: "Scheduled"
      })
    }
    
    // Close modal instantly to optimize INP response
    setOpen(false)
    setStep(1) // reset
    setIsSubmitting(false)

    // Trigger Upstash Workflow in background
    fetch("/api/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientPhone: `${patientData.countryCode} ${patientData.phone}`,
        patientName: patientData.name,
        doctorName: doctorsList.find(d => d.id === selectedDoctor)?.name || selectedDoctor,
        appointmentDate: date?.toISOString(),
        appointmentTime: selectedTime
      })
    }).catch((err) => {
      console.error("Failed to trigger workflow", err)
    })
  }

  // Handle dialog open/close explicitly to reset state on open
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStep(1)
      setPatientData({
        name: "",
        countryCode: "+91",
        phone: "",
        nationality: "",
        gender: "",
      })
      setNameTouched(false)
      setPhoneTouched(false)
      setNationalityTouched(false)
      setGenderTouched(false)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button size="lg" className="w-full text-lg h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all" />
      }>
        Book Appointment
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Book a New Appointment</DialogTitle>
          <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            STEP {step} OF 3
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="grid gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-slate-800">Patient Profile</h3>
                <p className="text-sm text-slate-500">Enter the patient's basic details.</p>
              </div>
              
              <div className="grid gap-1.5">
                <Label htmlFor="name" className={nameTouched && !isNameValid ? "text-red-500 font-semibold" : ""}>
                  Full Name
                </Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={patientData.name} 
                  onBlur={() => setNameTouched(true)}
                  onChange={(e) => setPatientData({...patientData, name: e.target.value})} 
                  className={nameTouched && !isNameValid ? "border-red-400 focus:ring-red-200" : ""}
                />
                {nameTouched && !isNameValid && (
                  <span className="text-[11px] text-red-500 font-medium">Please enter at least 2 letters (no special characters).</span>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="phone" className={phoneTouched && !isPhoneValid ? "text-red-500 font-semibold" : ""}>
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={patientData.countryCode} 
                    onValueChange={(val) => setPatientData({...patientData, countryCode: val || "+91"})}
                  >
                    <SelectTrigger className="w-[110px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>{cc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    id="phone" 
                    placeholder="98765 43210" 
                    value={patientData.phone} 
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9\s\-()]/g, "")
                      setPatientData({...patientData, phone: val})
                    }} 
                    className={phoneTouched && !isPhoneValid ? "border-red-400 focus:ring-red-200" : ""}
                  />
                </div>
                {phoneTouched && !isPhoneValid && (
                  <span className="text-[11px] text-red-500 font-medium">Please enter a valid phone number (minimum 7 digits).</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className={nationalityTouched && !isNationalityValid ? "text-red-500 font-semibold" : ""}>
                    Nationality
                  </Label>
                  <Select 
                    value={patientData.nationality} 
                    onValueChange={(val) => {
                      setNationalityTouched(true)
                      setPatientData({...patientData, nationality: val || ""})
                    }}
                  >
                    <SelectTrigger className={nationalityTouched && !isNationalityValid ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {NATIONALITIES.map((nat) => (
                        <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {nationalityTouched && !isNationalityValid && (
                    <span className="text-[11px] text-red-500 font-medium">Required.</span>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label className={genderTouched && !isGenderValid ? "text-red-500 font-semibold" : ""}>
                    Gender
                  </Label>
                  <Select 
                    value={patientData.gender} 
                    onValueChange={(val) => {
                      setGenderTouched(true)
                      setPatientData({...patientData, gender: val || ""})
                    }}
                  >
                    <SelectTrigger className={genderTouched && !isGenderValid ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {genderTouched && !isGenderValid && (
                    <span className="text-[11px] text-red-500 font-medium">Required.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-slate-800">Choose a Doctor</h3>
                <p className="text-sm text-slate-500">Select an available doctor for the consultation.</p>
              </div>
              <div className="grid gap-2">
                <Label>Doctor</Label>
                <Select value={selectedDoctor} onValueChange={(val) => setSelectedDoctor(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorsList.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {doctorCharge !== undefined && (
                <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                  <div className="text-sm font-medium">Consultation Charge</div>
                  <div className="text-2xl font-bold">${doctorCharge}</div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
               <div className="space-y-1">
                <h3 className="font-semibold text-lg text-slate-800">Date & Time</h3>
                <p className="text-sm text-slate-500">Choose when the appointment will take place.</p>
              </div>
              <div className="grid gap-2 flex flex-col">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger render={
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    />
                  }>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={{ before: today }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2 mt-2">
                <Label>Time Slot</Label>
                <Select value={selectedTime} onValueChange={(val) => setSelectedTime(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div /> // Placeholder to keep the Next button on the right
          )}
          
          {step < 3 ? (
            <Button onClick={handleNext} disabled={
              (step === 1 && (!isNameValid || !isPhoneValid || !isNationalityValid || !isGenderValid)) ||
              (step === 2 && !selectedDoctor)
            } className="disabled:cursor-not-allowed">Next</Button>
          ) : (
             <Button onClick={handleComplete} disabled={!date || !selectedTime || isSubmitting} className="bg-green-600 hover:bg-green-700 text-white disabled:cursor-not-allowed">
                {isSubmitting ? "Confirming..." : "Confirm Booking"}
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
