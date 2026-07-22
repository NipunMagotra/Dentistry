"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
  const [date, setDate] = useState<string>("")
  const [time, setTime] = useState("")

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
      <DialogContent className="sm:max-w-[420px] max-w-[95vw] glass-panel p-6 rounded-3xl border border-white/40 dark:border-white/10">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <CalendarRange className="size-5 text-primary" /> Reschedule Appointment
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Modify date or select a new time slot for <strong>{appointment.patient}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="res-date">Select New Date</Label>
            <Input 
              id="res-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="rounded-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Select Time Slot</Label>
            <Select value={time} onValueChange={(val) => setTime(val || "")}>
              <SelectTrigger className="rounded-full h-10 px-4">
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
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-full w-full sm:w-auto font-semibold">
            Cancel
          </Button>
          <Button onClick={handleSave} className="rounded-full w-full sm:w-auto bg-primary text-primary-foreground font-bold shadow-md">
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
