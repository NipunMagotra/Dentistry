"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, User, Phone, Calendar, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "02:00 PM", "02:30 PM", "05:30 PM", "06:00 PM", "06:30 PM"
]

const DOCTORS = [
  "Dr. Sarah Jenkins",
  "Dr. Michael Chen",
  "Dr. Emily Rodriguez"
]

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
}

export function ProcessRequestModal({ isOpen, onClose, request, onApprove }: ProcessRequestModalProps) {
  // Local form states
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [doctor, setDoctor] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [nationality, setNationality] = useState("")
  const [gender, setGender] = useState("")

  // Validation warnings states
  const [submittedOnce, setSubmittedOnce] = useState(false)

  // Validation rules
  const isNameValid = patientName.trim().length >= 2 && /^[a-zA-Z\s.]{2,}$/.test(patientName)
  const isPhoneValid = /^\+?[0-9\s\-()]{7,}$/.test(patientPhone)
  const isNationalityValid = !!nationality
  const isGenderValid = !!gender

  // Populate data when request changes
  useEffect(() => {
    if (request) {
      setPatientName(request.patient || "")
      setPatientPhone(request.phone || "")
      setDoctor(request.doctor || DOCTORS[0])
      setDate(request.date || "")
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
      date: date,
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
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" /> Process Appointment Request
          </DialogTitle>
          <DialogDescription>
            Verify patient information, fill in missing details, and confirm the slot.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Reason for Visit banner */}
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
            <div>
              <span className="font-semibold">Patient Note: </span>
              {request.reason}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-name" className={isNameInvalid ? "text-red-500 font-semibold" : ""}>
              Patient Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="req-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className={cn("pl-9 bg-slate-50/30", isNameInvalid ? "border-red-400 focus:ring-red-200" : "")}
                required
              />
            </div>
            {isNameInvalid && (
              <span className="text-[11px] text-red-500">Please enter at least 2 letters (no special characters).</span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-phone" className={isPhoneInvalid ? "text-red-500 font-semibold" : ""}>
              Phone / WhatsApp Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="req-phone"
                value={patientPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9\s+\-()]/g, "")
                  setPatientPhone(val)
                }}
                className={cn("pl-9 bg-slate-50/30", isPhoneInvalid ? "border-red-400 focus:ring-red-200" : "")}
                required
              />
            </div>
            {isPhoneInvalid && (
              <span className="text-[11px] text-red-500">Please enter a valid phone number (minimum 7 digits).</span>
            )}
          </div>

          {/* Required Intake Details */}
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-xl bg-amber-50/20 border-amber-100">
            <div className="col-span-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Required Intake Details
            </div>
            
            <div className="space-y-1.5">
              <Label className={isNationalityMissing ? "text-red-500 font-semibold" : "text-slate-700"}>
                Nationality {isNationalityMissing && "*"}
              </Label>
              <Select value={nationality} onValueChange={(val) => setNationality(val || "")}>
                <SelectTrigger className={isNationalityMissing ? "border-red-400 bg-red-50/20" : "bg-white"}>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITIES.map((nat) => (
                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isNationalityMissing && (
                <span className="text-[10px] text-red-500 block">Nationality is required</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={isGenderMissing ? "text-red-500 font-semibold" : "text-slate-700"}>
                Gender {isGenderMissing && "*"}
              </Label>
              <Select value={gender} onValueChange={(val) => setGender(val || "")}>
                <SelectTrigger className={isGenderMissing ? "border-red-400 bg-red-50/20" : "bg-white"}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {isGenderMissing && (
                <span className="text-[10px] text-red-500 block">Gender is required</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned Doctor</Label>
            <Select value={doctor} onValueChange={(val) => setDoctor(val || "")}>
              <SelectTrigger className="bg-slate-50/30">
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
              <SelectContent>
                {DOCTORS.map((doc) => (
                  <SelectItem key={doc} value={doc}>
                    {doc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="req-date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-10" />
                <Input
                  id="req-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9 bg-slate-50/30 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Time Slot</Label>
              <Select value={time} onValueChange={(val) => setTime(val || "")}>
                <SelectTrigger className="bg-slate-50/30">
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
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel Request
          </Button>
          <Button onClick={handleConfirm} className="bg-primary text-primary-foreground hover:bg-primary/95">
            Approve & Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
