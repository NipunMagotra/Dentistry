"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CalendarRange, Calendar, Clock } from "lucide-react"

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "02:00 PM", "02:30 PM", "05:30 PM", "06:00 PM", "06:30 PM"
]

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: {
    id: string
    patient: string
    doctor: string
    time: string
  } | null
  onReschedule: (id: string, newDate: string, newTime: string) => void
}

export function RescheduleModal({ isOpen, onClose, appointment, onReschedule }: RescheduleModalProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  // Default to today's date format or current slot on open
  useEffect(() => {
    if (appointment) {
      setDate(new Date().toISOString().split("T")[0])
      setTime(appointment.time)
    }
  }, [appointment, isOpen])

  const handleSave = () => {
    if (!appointment || !date || !time) return
    onReschedule(appointment.id, date, time)
    onClose()
  }

  if (!appointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" /> Reschedule Appointment
          </DialogTitle>
          <DialogDescription>
            Modify date or select a new time slot for {appointment.patient}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="res-date">Select Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-10" />
              <Input
                id="res-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 bg-slate-50/50"
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Select Time Slot</Label>
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
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/95">
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
