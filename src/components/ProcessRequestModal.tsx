"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, User, Phone, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "02:00 PM", "02:30 PM", "05:30 PM", "06:00 PM", "06:30 PM"
]

const DEFAULT_DOCTORS: string[] = []

const NATIONALITIES = [
  "Indian", "Emirati", "American", "British", "Saudi", "Omani", "Qatari", "Kuwaiti", "Bahraini", "Filipino", "Pakistani", "Egyptian", "Other"
]

interface ProcessRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: {
    id: string
    patient: string
    phone: string
    doctor: string
    date: string
    time: string
    reason: string
  } | null
  onApprove: (approvedApt: {
    patient: string
    phone: string
    doctor: string
    date: string
    time: string
    nationality: string
    gender: string
    status: string
  }) => void
  onDecline?: (id: string) => void
}

export function ProcessRequestModal({ isOpen, onClose, request, onApprove, onDecline }: ProcessRequestModalProps) {
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [doctor, setDoctor] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("")
  const [nationality, setNationality] = useState("")
  const [gender, setGender] = useState("")
  const [doctorsList, setDoctorsList] = useState<string[]>(DEFAULT_DOCTORS)
  const [submittedOnce, setSubmittedOnce] = useState(false)

  useEffect(() => {
    const loadDoctors = () => {
      const saved = localStorage.getItem("clinic_doctors_list")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDoctorsList(parsed.map((d: any) => d.name))
          } else {
            setDoctorsList(DEFAULT_DOCTORS)
          }
        } catch (e) {
          console.error("Error loading doctors in ProcessRequestModal", e)
          setDoctorsList(DEFAULT_DOCTORS)
        }
      }
    }
    loadDoctors()
    window.addEventListener("clinic-doctors-updated", loadDoctors)
    return () => window.removeEventListener("clinic-doctors-updated", loadDoctors)
  }, [])

  const isNameValid = patientName.trim().length >= 2 && /^[a-zA-Z\s.]{2,}$/.test(patientName)
  const isPhoneValid = /^\+?[0-9\s\-()]{7,}$/.test(patientPhone)
  const isNationalityValid = !!nationality
  const isGenderValid = !!gender

  useEffect(() => {
    if (request) {
      setPatientName(request.patient || "")
      setPatientPhone(request.phone || "")
      setDoctor(request.doctor || doctorsList[0] || DEFAULT_DOCTORS[0])
      setDate(request.date ? new Date(request.date) : new Date())
      setTime(request.time || "")
      setNationality("")
      setGender("")
      setSubmittedOnce(false)
    }
  }, [request, isOpen])

  const handleConfirm = () => {
    setSubmittedOnce(true)
    if (!isNameValid || !isPhoneValid || !doctor || !date || !time || !isNationalityValid || !isGenderValid) {
      return
    }

    onApprove({
      patient: patientName,
      phone: patientPhone,
      doctor: doctor,
      date: date ? format(date, "yyyy-MM-dd") : "",
      time: time,
      nationality: nationality,
      gender: gender,
      status: "Scheduled"
    })
    onClose()
  }

  if (!request) return null

  const isNameInvalid = submittedOnce && !isNameValid
  const isPhoneInvalid = submittedOnce && !isPhoneValid
  const isNationalityMissing = submittedOnce && !isNationalityValid
  const isGenderMissing = submittedOnce && !isGenderValid

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-w-[92vw] glass-panel p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-3 border-b border-black/5 dark:border-white/5 shrink-0">
          <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary shrink-0" /> Process Appointment Request
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Verify patient information, fill in missing intake details, and confirm slot.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-3 pr-1 space-y-4 my-1">
          {/* Reason for Visit banner */}
          <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20 flex items-start gap-2.5 text-xs text-primary">
            <AlertCircle className="size-4 shrink-0 text-primary mt-0.5" />
            <div>
              <span className="font-bold">Patient Note / Reason: </span>
              <span className="font-medium text-foreground/90">{request.reason || "General Consultation"}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-name" className={cn("text-xs font-semibold", isNameInvalid ? "text-destructive" : "")}>
              Patient Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <Input
                id="req-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className={cn("pl-10 h-10 text-xs sm:text-sm rounded-xl", isNameInvalid ? "border-destructive focus-visible:ring-destructive/20" : "")}
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-phone" className={cn("text-xs font-semibold", isPhoneInvalid ? "text-destructive" : "")}>
              Phone / WhatsApp Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <Input
                id="req-phone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value.replace(/[^0-9\s+\-()]/g, ""))}
                className={cn("pl-10 h-10 text-xs sm:text-sm rounded-xl", isPhoneInvalid ? "border-destructive focus-visible:ring-destructive/20" : "")}
                placeholder="e.g. +1 (555) 123-4567"
                required
              />
            </div>
          </div>

          {/* Required Intake Details Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl glass-panel border border-amber-500/25 bg-amber-500/5">
            <div className="sm:col-span-2 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="size-3.5" /> Required Intake Details
            </div>
            
            <div className="space-y-1">
              <Label className={cn("text-xs font-semibold", isNationalityMissing ? "text-destructive" : "")}>
                Nationality {isNationalityMissing && "*"}
              </Label>
              <Select value={nationality} onValueChange={(val) => setNationality(val || "")}>
                <SelectTrigger className="rounded-xl h-10 px-3 text-xs sm:text-sm bg-white/70 dark:bg-zinc-900/60">
                  <SelectValue placeholder="Select Nationality" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl glass-panel">
                  {NATIONALITIES.map((nat) => (
                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className={cn("text-xs font-semibold", isGenderMissing ? "text-destructive" : "")}>
                Gender {isGenderMissing && "*"}
              </Label>
              <Select value={gender} onValueChange={(val) => setGender(val || "")}>
                <SelectTrigger className="rounded-xl h-10 px-3 text-xs sm:text-sm bg-white/70 dark:bg-zinc-900/60">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl glass-panel">
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assigned Doctor</Label>
              <Select value={doctor} onValueChange={(val) => setDoctor(val || "")}>
                <SelectTrigger className="rounded-xl h-10 px-3 text-xs sm:text-sm bg-white/70 dark:bg-zinc-900/60">
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl glass-panel">
                  {doctorsList.map((docName) => (
                    <SelectItem key={docName} value={docName}>{docName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Time Slot</Label>
              <Select value={time} onValueChange={(val) => setTime(val || "")}>
                <SelectTrigger className="rounded-xl h-10 px-3 text-xs sm:text-sm bg-white/70 dark:bg-zinc-900/60">
                  <SelectValue placeholder="Select Slot" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl glass-panel">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-col-reverse sm:flex-row gap-2.5 justify-between items-center shrink-0">
          {onDecline && request?.id ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onDecline(request.id)
                onClose()
              }} 
              className="rounded-full h-10 px-4 text-xs w-full sm:w-auto font-semibold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20"
            >
              Decline & Erase Request
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="rounded-full h-10 px-4 text-xs w-full sm:w-auto font-semibold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="rounded-full h-10 px-5 text-xs w-full sm:w-auto bg-primary text-primary-foreground font-bold shadow-md"
            >
              Confirm & Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
