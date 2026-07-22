"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { User, Clock, Calendar, AlertTriangle } from "lucide-react"

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
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          setShowConfirmDelete(false)
          onClose()
        }
      }}>
        <DialogContent className="sm:max-w-[450px] max-w-[95vw] glass-panel p-6 rounded-3xl border border-white/40 dark:border-white/10">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Calendar className="size-5 text-primary" /> Appointment Information
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Full details and front-desk actions for this appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Profile Block */}
            <div className="p-4 rounded-2xl glass-panel border border-black/5 dark:border-white/5 space-y-3">
              <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Patient Name</span>
                <span className="font-extrabold text-foreground text-base">{appointment.patient}</span>
              </div>
              <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Assigned Provider</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                  <User className="size-4 text-primary" /> {appointment.doctor}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Scheduled Time</span>
                <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <Clock className="size-4 text-primary" /> {appointment.time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Current Status</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  appointment.status === 'In Progress' ? 'bg-primary/10 text-primary' :
                  appointment.status === 'Rescheduled' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  appointment.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                }`}>
                  {appointment.status}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={() => setShowConfirmDelete(true)}
              className="w-full sm:w-auto rounded-full font-semibold mr-auto"
            >
              Cancel Visit
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  onReschedule(appointment)
                  onClose()
                }}
                className="w-full sm:w-auto rounded-full font-semibold"
              >
                Reschedule
              </Button>
              
              {(appointment.status === "Scheduled" || appointment.status === "Rescheduled") && (
                <Button
                  onClick={() => {
                    onStart(appointment.id)
                    onClose()
                  }}
                  className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground font-bold shadow-md"
                >
                  Start Visit
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent className="glass-panel border border-white/40 dark:border-white/10 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive font-extrabold">
              <AlertTriangle className="size-5 text-destructive" /> Are you sure you want to cancel this appointment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This action cannot be undone. The appointment slot will be released and removed from the active queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-full w-full sm:w-auto font-semibold">Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground font-bold rounded-full w-full sm:w-auto">
              Yes, Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
