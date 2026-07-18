"use client"

import { useState } from "react"
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

const doctors = [
  { id: "1", name: "Dr. Sarah Jenkins", charge: 150 },
  { id: "2", name: "Dr. Michael Chen", charge: 200 },
  { id: "3", name: "Dr. Emily Rodriguez", charge: 180 },
]

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "02:00 PM", "02:30 PM", "05:30 PM", "06:00 PM", "06:30 PM"
]

type BookingWizardProps = {
  onBookAppointment?: (apt: { time: string; patient: string; doctor: string; status: string }) => void
}

export function BookingWizard({ onBookAppointment }: BookingWizardProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  // Form State
  const [patientData, setPatientData] = useState({
    name: "",
    phone: "",
    nationality: "",
    gender: "",
  })
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [date, setDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")

  const doctorCharge = doctors.find(d => d.id === selectedDoctor)?.charge

  const handleNext = () => setStep((s) => Math.min(s + 1, 3))
  const handleBack = () => setStep((s) => Math.max(s - 1, 1))
  
  const handleComplete = async () => {
    console.log("Booking complete", { patientData, selectedDoctor, date, selectedTime })
    
    // Update local UI state
    if (onBookAppointment) {
      onBookAppointment({
        time: selectedTime,
        patient: patientData.name,
        doctor: doctors.find(d => d.id === selectedDoctor)?.name || "Doctor",
        status: "Scheduled"
      })
    }
    
    // Trigger Upstash Workflow
    try {
      await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientPhone: patientData.phone,
          patientName: patientData.name,
          doctorName: doctors.find(d => d.id === selectedDoctor)?.name || "Doctor",
          appointmentDate: date?.toISOString(),
          appointmentTime: selectedTime
        })
      })
    } catch (err) {
      console.error("Failed to trigger workflow", err)
    }

    setOpen(false)
    setStep(1) // reset
  }

  // Handle dialog open/close explicitly to reset state on open
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStep(1)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button size="lg" className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold" />
      }>
        Book Appointment
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book a New Appointment</DialogTitle>
          <DialogDescription>
            Step {step} of 3
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="grid gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-slate-800">Patient Profile</h3>
                <p className="text-sm text-slate-500">Enter the patient's basic details.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={patientData.name} onChange={(e) => setPatientData({...patientData, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1 234 567 890" value={patientData.phone} onChange={(e) => setPatientData({...patientData, phone: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" placeholder="e.g. American, Indian, etc." value={patientData.nationality} onChange={(e) => setPatientData({...patientData, nationality: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Gender</Label>
                <Select value={patientData.gender} onValueChange={(val) => setPatientData({...patientData, gender: val || ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                    {doctors.map((doc) => (
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

        <DialogFooter className="flex justify-between items-center sm:justify-between w-full mt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div /> // Placeholder to keep the Next button on the right
          )}
          
          {step < 3 ? (
            <Button onClick={handleNext} disabled={
              (step === 1 && (!patientData.name || !patientData.phone || !patientData.nationality || !patientData.gender)) ||
              (step === 2 && !selectedDoctor)
            }>Next</Button>
          ) : (
             <Button onClick={handleComplete} disabled={!date || !selectedTime} className="bg-green-600 hover:bg-green-700 text-white">Confirm Booking</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
