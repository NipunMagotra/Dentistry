"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User, Clock, Calendar, ShieldAlert, AlertTriangle } from "lucide-react"

type Appointment = {
  id: string
  time: string
  patient: string
  doctor: string
  status: string
}

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onDelete: (id: string) => void
  onStart: (id: string) => void
  onReschedule: (apt: Appointment) => void
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onDelete,
  onStart,
  onReschedule
}: AppointmentDetailsModalProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  if (!appointment) return null

  const handleConfirmDelete = () => {
    onDelete(appointment.id)
    setShowConfirmDelete(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setShowConfirmDelete(false)
        onClose()
      }
    }}>
      <DialogContent className="sm:max-w-[450px] bg-white">
        {!showConfirmDelete ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Appointment Information
              </DialogTitle>
              <DialogDescription>
                Full details and front-desk actions for this appointment.
              </DialogDescription>
            </DialogHeader>

            <div className="py-5 space-y-4">
              {/* Profile Block */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Patient Name</span>
                  <span className="font-bold text-slate-800 text-base">{appointment.patient}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Assigned Provider</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" /> {appointment.doctor}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Scheduled Time</span>
                  <span className="font-semibold text-blue-600 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-400" /> {appointment.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Status</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    appointment.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    appointment.status === 'Rescheduled' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' :
                    appointment.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={() => setShowConfirmDelete(true)}
                className="bg-red-50 text-red-600 hover:bg-red-100 border-none font-semibold shadow-none mr-auto w-full sm:w-auto"
              >
                Cancel Appointment
              </Button>
              
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    onReschedule(appointment)
                    onClose()
                  }}
                  className="font-semibold"
                >
                  Reschedule
                </Button>
                
                {(appointment.status === "Scheduled" || appointment.status === "Rescheduled") && (
                  <Button
                    onClick={() => {
                      onStart(appointment.id)
                      onClose()
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Start Visit
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" /> Confirm Cancelation
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. Are you sure you want to cancel {appointment.patient}'s appointment?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 text-slate-600 text-sm">
              The appointment slots will be released and removed from the active queue. Patient details will remain in the general directory.
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDelete(false)}
                className="font-semibold"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Yes, Cancel Appointment
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
