"use client"

import { useState, useEffect } from "react"
import { getDoctors, createAppointment } from "@/app/actions"
import { queueOfflineAction, isOnline } from "@/lib/offlineSync"
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
import { CalendarIcon, Check, ChevronsUpDown, AlertCircle, FileUp, X, Paperclip, Tag } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const DEFAULT_DOCTORS: any[] = []

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [nameTouched, setNameTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [nationalityTouched, setNationalityTouched] = useState(false)
  const [genderTouched, setGenderTouched] = useState(false)

  const isNameValid = patientData.name.trim().length >= 2 && /^[a-zA-Z\s.]{2,}$/.test(patientData.name)
  const isPhoneValid = /^\+?[0-9\s\-()]{7,}$/.test(patientData.phone)
  const isNationalityValid = !!patientData.nationality
  const isGenderValid = !!patientData.gender

  const doctorCharge = doctorsList.find(d => d.name === selectedDoctor || d.id === selectedDoctor)?.charge

  // Step 4: Media attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [uploadCategory, setUploadCategory] = useState<'xray' | 'lab_report' | 'other'>('xray')
  const [uploadCaption, setUploadCaption] = useState("")
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [mediaUploadError, setMediaUploadError] = useState("")

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const newFiles = Array.from(files)
    const combined = [...attachedFiles, ...newFiles].slice(0, 3) // Max 3 files
    setAttachedFiles(combined)
    setMediaUploadError("")
    e.target.value = ""
  }

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    setNameTouched(true)
    setPhoneTouched(true)
    setNationalityTouched(true)
    setGenderTouched(true)
    
    if (step === 1 && (!isNameValid || !isPhoneValid || !isNationalityValid || !isGenderValid)) {
      return
    }
    setStep((s) => Math.min(s + 1, 4))
  }
  
  const handleBack = () => setStep((s) => Math.max(s - 1, 1))
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const uploadAttachedMedia = async (patientPhone: string) => {
    if (attachedFiles.length === 0) return

    setIsUploadingMedia(true)
    try {
      // We need a patient ID — find or create via the phone number
      // The appointment creation already handles patient creation, so we use the phone as lookup
      const formData = new FormData()
      // We'll pass patientId as "pending" — the API will need to look up by phone
      // For now, we upload to a temporary holding area
      formData.append("patientId", "pending_" + patientPhone.replace(/[^0-9]/g, ""))
      formData.append("category", uploadCategory)
      formData.append("caption", uploadCaption.trim())
      
      for (const file of attachedFiles) {
        formData.append("files", file)
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        setMediaUploadError(data.error || "Upload failed")
      }
    } catch (err: any) {
      console.error("[BookingWizard] Media upload failed:", err)
      setMediaUploadError("File upload failed. The appointment was booked successfully.")
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    
    const docName = doctorsList.find(d => d.id === selectedDoctor)?.name || selectedDoctor
    const payload = {
      patientName: patientData.name,
      patientPhone: `${patientData.countryCode} ${patientData.phone}`,
      doctorName: docName,
      appointmentDate: date ? format(date, "yyyy-MM-dd") : "",
      appointmentTime: selectedTime,
      status: "Scheduled"
    }

    if (isOnline()) {
      const result = await createAppointment(payload)
      if (!result.success) {
        setIsSubmitting(false)
        if (result.error === "CONFLICT") {
          alert(`❌ ${result.message || "Time slot is already occupied for this doctor."}`)
          return
        }
        console.error("Failed to create appointment", result.error)
      }

      // Upload attached media if any
      if (attachedFiles.length > 0) {
        await uploadAttachedMedia(payload.patientPhone)
      }
    } else {
      queueOfflineAction("BOOK_APPOINTMENT", payload)
    }

    setIsSubmitting(false)
    if (onBookAppointment) {
      onBookAppointment({
        time: selectedTime,
        patient: patientData.name,
        phone: `${patientData.countryCode} ${patientData.phone}`,
        doctor: docName,
        status: "Scheduled"
      })
    }
    
    setOpen(false)
    setStep(1)
    setIsSubmitting(false)
    setAttachedFiles([])
    setUploadCaption("")
    setMediaUploadError("")

    if (isOnline()) {
      fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientPhone: `${patientData.countryCode} ${patientData.phone}`,
          patientName: patientData.name,
          doctorName: docName,
          appointmentDate: date?.toISOString(),
          appointmentTime: selectedTime
        })
      }).catch((err) => {
        console.error("Failed to trigger workflow", err)
      })
    }
  }

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
      setAttachedFiles([])
      setUploadCaption("")
      setMediaUploadError("")
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button size="lg" className="w-full text-sm sm:text-base h-11 sm:h-13 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-lg shadow-primary/25 transition-all" />
      }>
        + Book New Consultation
      </DialogTrigger>
      <DialogContent className="w-[94vw] max-w-[500px] max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Appointment Booking Wizard</DialogTitle>
          <DialogDescription className="sr-only">
            Book a new appointment wizard
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* M3 Segmented Progress Line — 4 steps now */}
          <div className="flex items-center gap-2 mb-6">
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", step >= 1 ? "bg-primary" : "bg-primary/20")} />
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", step >= 2 ? "bg-primary" : "bg-primary/20")} />
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", step >= 3 ? "bg-primary" : "bg-primary/20")} />
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", step >= 4 ? "bg-primary" : "bg-primary/20")} />
          </div>

          {step === 1 && (
            <div className="grid gap-4 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">New Patient Intake</h3>
                <p className="text-xs text-muted-foreground">Enter basic patient details to initiate consultation.</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="name" className={nameTouched && !isNameValid ? "text-destructive font-semibold" : ""}>
                  Full Name
                </Label>
                <Input 
                  id="name" 
                  placeholder="e.g. John Doe" 
                  value={patientData.name} 
                  onBlur={() => setNameTouched(true)}
                  onChange={(e) => setPatientData({...patientData, name: e.target.value})} 
                  className={nameTouched && !isNameValid ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone" className={phoneTouched && !isPhoneValid ? "text-destructive font-semibold" : ""}>
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={patientData.countryCode} 
                    onValueChange={(val) => setPatientData({...patientData, countryCode: val || "+91"})}
                  >
                    <SelectTrigger className="w-[110px] rounded-full h-10 px-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl glass-panel">
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    id="phone" 
                    placeholder="98765 43210" 
                    value={patientData.phone} 
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => setPatientData({...patientData, phone: e.target.value.replace(/[^0-9\s\-()]/g, "")})} 
                    className={cn("flex-1", phoneTouched && !isPhoneValid ? "border-destructive" : "")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className={nationalityTouched && !isNationalityValid ? "text-destructive font-semibold" : ""}>
                    Nationality
                  </Label>
                  <Select 
                    value={patientData.nationality} 
                    onValueChange={(val) => setPatientData({...patientData, nationality: val || ""})}
                  >
                    <SelectTrigger className="rounded-full h-10 px-4">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl glass-panel">
                      {NATIONALITIES.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className={genderTouched && !isGenderValid ? "text-destructive font-semibold" : ""}>
                    Gender
                  </Label>
                  <Select 
                    value={patientData.gender} 
                    onValueChange={(val) => setPatientData({...patientData, gender: val || ""})}
                  >
                    <SelectTrigger className="rounded-full h-10 px-4">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl glass-panel">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Doctor Selection</h3>
                <p className="text-xs text-muted-foreground">Select an available dental specialist for this consultation.</p>
              </div>

              <div className="grid gap-3">
                {doctorsList.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                      selectedDoctor === doc.id 
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-sm" 
                        : "glass-panel border-black/5 dark:border-white/10 hover:border-primary/40 text-foreground"
                    )}
                  >
                    <div>
                      <div className="text-sm font-bold">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">Consultation Charge: ₹{doc.charge}</div>
                    </div>
                    {selectedDoctor === doc.id && <Check className="size-5 text-primary" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Date & Time Slot</h3>
                <p className="text-xs text-muted-foreground">Choose a date and available time slot for consultation.</p>
              </div>

              <div className="space-y-2">
                <Label>Select Date</Label>
                <Input 
                  type="date" 
                  value={date ? format(date, "yyyy-MM-dd") : ""}
                  onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {(() => {
                const selDocObj = doctorsList.find(d => d.id === selectedDoctor || d.name === selectedDoctor)
                const dayName = date ? format(date, "EEEE") : ""
                const daySched = selDocObj?.weeklySchedule?.find((s: any) => s.day === dayName)
                const isClosed = daySched ? daySched.isClosed : (dayName === "Sunday" && (!selDocObj?.timings || selDocObj?.timings.includes("Sun: CLOSED")))

                if (date && isClosed) {
                  return (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
                      <AlertCircle className="size-5 shrink-0" />
                      <div>
                        <div>{selDocObj?.name || "Practitioner"} is CLOSED on {dayName}s.</div>
                        <div className="text-[11px] font-normal text-muted-foreground mt-0.5">Please choose an open operating day to proceed.</div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Available Slots</Label>
                      {daySched && !daySched.isClosed && (
                        <span className="text-[10px] font-mono text-primary font-bold">Hours: {daySched.startTime} - {daySched.endTime}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            "py-2 px-3 text-xs font-semibold rounded-full border transition-all cursor-pointer",
                            selectedTime === slot 
                              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                              : "glass-panel text-muted-foreground hover:text-foreground border-black/5 dark:border-white/10"
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Step 4: Optional Media Attachment */}
          {step === 4 && (
            <div className="grid gap-4 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Attach X-Rays or Reports</h3>
                <p className="text-xs text-muted-foreground">Optionally attach up to 3 diagnostic files. You can skip this step.</p>
              </div>

              {/* Category & Caption */}
              <div className="flex items-center gap-2">
                <Select value={uploadCategory} onValueChange={(val: any) => setUploadCategory(val || 'xray')}>
                  <SelectTrigger className="w-[120px] h-9 rounded-full text-xs font-bold">
                    <Tag className="size-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl glass-panel">
                    <SelectItem value="xray">X-Ray</SelectItem>
                    <SelectItem value="lab_report">Lab Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Caption (optional)"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
              </div>

              {/* File Picker */}
              <label className="cursor-pointer rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 hover:border-primary/40 p-6 flex flex-col items-center gap-2 transition-all">
                <FileUp className="size-8 text-primary/60" />
                <span className="text-xs font-bold text-muted-foreground">Click to select files</span>
                <span className="text-[10px] text-muted-foreground">JPEG, PNG, WebP, PDF — max 10 MB each</span>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,application/pdf" 
                  multiple
                  className="hidden" 
                  onChange={handleAddFiles} 
                />
              </label>

              {/* Attached Files List */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  {attachedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl glass-panel border border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip className="size-3.5 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                      <button onClick={() => handleRemoveFile(i)} className="text-destructive hover:opacity-80 p-1">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {mediaUploadError && (
                <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-semibold">
                  {mediaUploadError}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex sm:justify-between items-center gap-2 border-t border-black/5 dark:border-white/5 pt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="rounded-full">Back</Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={handleNext} className="rounded-full font-semibold px-6">Continue</Button>
          ) : step === 3 ? (
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setStep(4)} 
                disabled={!date || !selectedTime}
                variant="outline"
                className="rounded-full font-semibold px-4 text-xs"
              >
                <Paperclip className="size-3.5 mr-1" /> Attach Files
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={isSubmitting || !date || !selectedTime}
                className="rounded-full font-semibold px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                {isSubmitting ? "Booking..." : "Confirm & Save"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleComplete} 
                disabled={isSubmitting || isUploadingMedia}
                className="rounded-full font-semibold px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                {isSubmitting || isUploadingMedia 
                  ? "Saving..." 
                  : attachedFiles.length > 0 
                    ? `Confirm with ${attachedFiles.length} file${attachedFiles.length > 1 ? "s" : ""}`
                    : "Skip & Confirm"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
