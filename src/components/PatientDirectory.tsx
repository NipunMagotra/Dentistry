"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { searchPatients, deletePatient, deletePatientMedia } from "@/app/actions"
import { queueOfflineAction, isOnline } from "@/lib/offlineSync"
import { Search, User, Clock, Pill, FileText, AlertTriangle, Download, Paperclip, Upload, Trash2, Activity, X, Image as ImageIcon, FileUp, Tag } from "lucide-react"
import { VisualOdontogram } from "@/components/VisualOdontogram"
import { toPng } from "html-to-image"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Empty initial state for real accounts
const MOCK_PATIENTS: any[] = []

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  xray: { label: "X-Ray", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  lab_report: { label: "Lab Report", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  other: { label: "Other", color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20" },
}

export function PatientDirectory() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Printable prescription export state
  const [downloadingRx, setDownloadingRx] = useState<any | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  // Clinic Profile State
  const [profile, setProfile] = useState({
    clinicName: "Raina Dentistry",
    doctorName: "Dr. Anoop Raina"
  })

  // Dynamic Doctors List State
  const [doctorsList, setDoctorsList] = useState<any[]>([])

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadCategory, setUploadCategory] = useState<'xray' | 'lab_report' | 'other'>('xray')
  const [uploadCaption, setUploadCaption] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState("")

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Delete media confirmation
  const [deletingMedia, setDeletingMedia] = useState<any | null>(null)

  const getLastVisited = (patient: any) => {
    if (!patient.appointments || patient.appointments.length === 0) return "Never"
    return patient.appointments[0].appointment_date || patient.appointments[0].date || "Recently"
  }

  const handleFirebaseUpload = async (files: FileList | File[]) => {
    if (!selectedPatient || !files || files.length === 0) return

    setUploadError("")
    setIsUploading(true)
    setUploadProgress(10)

    const formData = new FormData()
    formData.append("patientId", selectedPatient.id)
    formData.append("category", uploadCategory)
    formData.append("caption", uploadCaption.trim())

    let validCount = 0
    for (const file of Array.from(files)) {
      // Client-side validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`"${file.name}" is not a supported format. Use JPEG, PNG, WebP, or PDF.`)
        setIsUploading(false)
        setUploadProgress(0)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 10 MB limit.`)
        setIsUploading(false)
        setUploadProgress(0)
        return
      }
      formData.append("files", file)
      validCount++
    }

    if (validCount === 0) {
      setIsUploading(false)
      setUploadProgress(0)
      return
    }

    if (validCount > 5) {
      setUploadError("Maximum 5 files per upload.")
      setIsUploading(false)
      setUploadProgress(0)
      return
    }

    setUploadProgress(30)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(80)

      const result = await response.json()

      if (!response.ok) {
        setUploadError(result.error || "Upload failed. Please try again.")
        setIsUploading(false)
        setUploadProgress(0)
        return
      }

      if (result.errors && result.errors.length > 0) {
        setUploadError(result.errors.join(". "))
      }

      // Update local state with new media
      if (result.uploaded && result.uploaded.length > 0) {
        const currentMedia = selectedPatient.medical_media || []
        const updatedMedia = [...currentMedia, ...result.uploaded]
        const updatedPatient = { ...selectedPatient, medical_media: updatedMedia }
        setSelectedPatient(updatedPatient)
        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p))
      }

      setUploadProgress(100)
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        setUploadCaption("")
      }, 500)
    } catch (err: any) {
      console.error("[PatientDirectory] Upload failed:", err)
      setUploadError(err?.message || "Upload failed. Check your connection.")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) handleFirebaseUpload(files)
    // Reset input so same file can be re-uploaded
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) handleFirebaseUpload(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDeleteMedia = async (media: any) => {
    if (!selectedPatient) return
    setDeletingMedia(null)

    const result = await deletePatientMedia(selectedPatient.id, media.id, media.storagePath)
    if (result.success) {
      const updatedMedia = (selectedPatient.medical_media || []).filter((m: any) => m.id !== media.id)
      const updatedPatient = { ...selectedPatient, medical_media: updatedMedia }
      setSelectedPatient(updatedPatient)
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p))
    } else {
      console.error("Failed to delete media:", result.error)
    }
  }

  // Load clinic profile settings & doctors list
  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem("clinic_profile_settings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setProfile({
            clinicName: parsed.clinicName || "City Dental Clinic",
            doctorName: parsed.doctorName || "Dr. Sarah Jenkins"
          })
        } catch (e) {
          console.error(e)
        }
      }

      const savedDocs = localStorage.getItem("clinic_doctors_list")
      if (savedDocs) {
        try {
          setDoctorsList(JSON.parse(savedDocs))
        } catch (e) {
          console.error(e)
        }
      }
    }
    loadData()
    window.addEventListener("clinic-profile-updated", loadData)
    window.addEventListener("clinic-doctors-updated", loadData)
    return () => {
      window.removeEventListener("clinic-profile-updated", loadData)
      window.removeEventListener("clinic-doctors-updated", loadData)
    }
  }, [])

  const handleDownloadPastPrescription = (patientName: string, rx: any) => {
    setDownloadingRx(rx)
    
    setTimeout(async () => {
      if (!exportRef.current) {
        setDownloadingRx(null)
        return
      }
      try {
        const dataUrl = await toPng(exportRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        })
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = `Prescription_${patientName.replace(/\s+/g, "_")}_${rx.date ? rx.date.replace(/\s+/g, "_") : "Copy"}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (err) {
        console.error("Failed to generate prescription copy image", err)
      } finally {
        setDownloadingRx(null)
      }
    }, 200)
  }

  const handleDialogClose = () => {
    setSelectedPatient(null)
    setShowConfirmDelete(false)
    setUploadError("")
    setUploadCaption("")
    setLightboxUrl(null)
    setDeletingMedia(null)
  }

  const handleDeletePatient = async (id: string) => {
    const list = patients.filter((p) => p.id !== id)
    setPatients(list)
    setSelectedPatient(null)
    setShowConfirmDelete(false)

    if (isOnline()) {
      const result = await deletePatient(id)
      if (!result.success) {
        console.error("Failed to delete patient", result.error)
        fetchPatients()
      }
    } else {
      queueOfflineAction("DELETE_PATIENT", { id })
    }
  }

  const fetchPatients = async (q: string = search, f: string = filter) => {
    const data = await searchPatients(q, f)
    setPatients(data)
  }

  useEffect(() => {
    startTransition(() => {
      fetchPatients(search, filter)
    })
  }, [filter])

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchPatients(search, filter)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const filteredPatients = patients
  const mediaList = selectedPatient?.medical_media || []

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <Card className="glass-panel border border-white/40 dark:border-white/10 shadow-lg">
        <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5">
          <CardTitle className="text-xl sm:text-2xl font-extrabold text-foreground">Patient Directory</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">Search for patients to view their medical history, prescriptions, and diagnostic scans.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          
          {/* Search Bar & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or phone..." 
                className="pl-10 h-11 text-base bg-white/70 dark:bg-zinc-900/70 border-black/10 dark:border-white/15"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={filter} onValueChange={(val) => setFilter(val || "All")}>
                <SelectTrigger className="h-11 rounded-full">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl glass-panel">
                  <SelectItem value="All">All Patients</SelectItem>
                  <SelectItem value="Recent">Recent Visitors</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Patient List */}
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              (search.length === 0 && filter === "All") ? (
                <div className="text-center p-8 sm:p-12 glass-panel border border-black/5 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full text-primary mb-2">
                    <User className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-foreground">Your CRM directory is empty</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">Onboard your first patient using the Booking Wizard to start tracking medical history.</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      document.querySelector<HTMLElement>('button[value="appointments"]')?.click()
                    }} 
                    className="mt-4 rounded-full font-semibold border-black/10 dark:border-white/15"
                  >
                    Open Booking Wizard
                  </Button>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground text-sm italic border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                  No patients found matching {search ? `"${search}"` : "your filters"}
                </div>
              )
            ) : (
              filteredPatients.map(patient => {
                const lastVisited = getLastVisited(patient)
                const isNever = lastVisited === "Never"
                return (
                  <div 
                    key={patient.id} 
                    onClick={() => setSelectedPatient(patient)}
                    className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 bg-primary/10 text-primary rounded-full flex items-center justify-center font-extrabold text-base border border-primary/20 shrink-0">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-base">{patient.name}</div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                          <span>{patient.phone}</span>
                          <span>•</span>
                          <span>{patient.gender}</span>
                          <span>•</span>
                          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", isNever ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                            Last Visited: {lastVisited}
                          </span>
                          {(patient.medical_media?.length || 0) > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              📎 {patient.medical_media.length} file{patient.medical_media.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${(patient.phone || '').replace(/[^\d+]/g, '')}`}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-2xs flex items-center gap-1 px-3"
                        title="Call Patient"
                      >
                        📞 Call
                      </a>
                      <a
                        href={`https://wa.me/${(patient.phone || '').replace(/[^\d+]/g, '')}?text=Hello%20${encodeURIComponent(patient.name)},%20this%20is%20Raina%20Dentistry...`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold transition-all flex items-center gap-1 px-3"
                        title="Message on WhatsApp"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient History Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="w-[94vw] max-w-2xl max-h-[88vh] glass-panel p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 flex flex-col">
          {!showConfirmDelete ? (
            <>
              <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-black/5 dark:border-white/5 bg-muted/30">
                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                  <User className="size-5 text-primary" />
                  {selectedPatient?.name}'s Medical History
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Phone: {selectedPatient?.phone} | Gender: {selectedPatient?.gender} | DOB: {selectedPatient?.dob || "N/A"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 sm:gap-6 p-4 sm:p-6 max-h-[65vh] overflow-y-auto flex-1">
                {/* Allergies Section */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  selectedPatient?.allergies && selectedPatient.allergies !== "None"
                    ? "bg-destructive/10 border-destructive/20 text-destructive"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}>
                  <span className="font-extrabold text-xs uppercase tracking-wider">Allergies:</span>
                  <span className="font-semibold text-sm">{selectedPatient?.allergies || "None"}</span>
                </div>

                {/* Visual Odontogram Chart Section */}
                {selectedPatient && (
                  <div className="pt-2">
                    <VisualOdontogram
                      patientId={selectedPatient.id}
                      patientName={selectedPatient.name}
                      initialChartData={selectedPatient.dental_chart || {}}
                    />
                  </div>
                )}

                {/* Past Appointments */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                    <Clock className="size-4 text-primary" /> Past Appointments
                  </h3>
                  {!selectedPatient?.appointments || selectedPatient.appointments.length === 0 ? (
                    <p className="text-muted-foreground text-xs italic">No past appointments recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPatient?.appointments.map((apt: any, i: number) => (
                        <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-2xl glass-panel border border-black/5 dark:border-white/5 gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{apt.appointment_date}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                                {apt.reason || "General Consultation"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground italic font-medium">Notes: {apt.notes || "No treatment notes logged."}</p>
                          </div>
                          <div className="text-left sm:text-right space-y-1 shrink-0">
                            <div className="text-xs text-muted-foreground font-semibold">{apt.doctor_name}</div>
                            <div className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold inline-block">{apt.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Prescriptions */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                    <FileText className="size-4 text-primary" /> Past Prescriptions
                  </h3>
                  {!selectedPatient?.prescriptions || selectedPatient.prescriptions.length === 0 ? (
                    <p className="text-muted-foreground text-xs italic">No past prescriptions recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedPatient?.prescriptions.map((rx: any, i: number) => (
                        <div key={i} className="p-4 rounded-2xl glass-panel border border-black/5 dark:border-white/5 flex justify-between items-start gap-3">
                          <div className="space-y-2 flex-1">
                            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-1.5">
                              <span className="font-bold text-foreground text-xs sm:text-sm">{new Date(rx.created_at || Date.now()).toLocaleDateString()}</span>
                              <span className="text-[10px] text-muted-foreground font-medium italic">ID: {rx.id ? rx.id.substring(0, 8) : `#${i+1}`}</span>
                            </div>
                            <ul className="space-y-1">
                              {Array.isArray(rx.medications) && rx.medications.map((drug: any, j: number) => (
                                <li key={j} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                                  <Pill className="size-4 text-primary mt-0.5 shrink-0" />
                                  <strong className="text-foreground font-bold">{drug.name}</strong> ({drug.frequency}) for {drug.days} Days
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Button 
                            variant="outline"
                            size="icon-xs"
                            onClick={() => selectedPatient && handleDownloadPastPrescription(selectedPatient.name, rx)}
                            className="rounded-full shrink-0"
                            title="Download Copy"
                          >
                            <Download className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Medical Media / X-Rays — Firebase Storage Backed */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-base font-bold text-foreground flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Paperclip className="size-4 text-primary" /> Diagnostic Media & X-Rays
                      {mediaList.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {mediaList.length}
                        </span>
                      )}
                    </div>
                  </h3>

                  {/* Upload Zone */}
                  <div 
                    className={cn(
                      "rounded-2xl border-2 border-dashed transition-all p-4",
                      isDragOver 
                        ? "border-primary bg-primary/5 scale-[1.01]" 
                        : "border-black/10 dark:border-white/10 hover:border-primary/40",
                      isUploading && "opacity-60 pointer-events-none"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 w-full">
                        <Select value={uploadCategory} onValueChange={(val: any) => setUploadCategory(val || 'xray')}>
                          <SelectTrigger className="w-[120px] h-8 rounded-full text-[11px] font-bold">
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
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                      <label className="cursor-pointer bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-wide py-2 px-4 rounded-full transition-all flex items-center gap-1.5 shadow-sm hover:bg-primary/90 hover:shadow-md whitespace-nowrap">
                        <FileUp className="size-3.5" /> Upload Files
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/webp,application/pdf" 
                          multiple
                          className="hidden" 
                          onChange={handleFileInputChange} 
                        />
                      </label>
                    </div>

                    {isDragOver && (
                      <div className="mt-3 text-center text-xs font-bold text-primary animate-pulse">
                        Drop files here to upload
                      </div>
                    )}

                    {!isDragOver && !isUploading && (
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Drag & drop or click to upload. JPEG, PNG, WebP, PDF — max 10 MB per file, 5 files per batch.
                      </p>
                    )}

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="mt-3 space-y-1.5">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-primary text-center">
                          Uploading to Firebase Storage... {uploadProgress}%
                        </p>
                      </div>
                    )}

                    {/* Upload Error */}
                    {uploadError && (
                      <div className="mt-2 p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-semibold flex items-center gap-2">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        {uploadError}
                        <button onClick={() => setUploadError("")} className="ml-auto">
                          <X className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Media Grid */}
                  {mediaList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {mediaList.map((media: any) => {
                        const catInfo = CATEGORY_LABELS[media.category] || CATEGORY_LABELS.other
                        const isPdf = media.storagePath?.endsWith('.pdf') || media.url?.includes('.pdf')
                        const uploadDate = media.uploadedAt 
                          ? new Date(media.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                          : ""

                        return (
                          <div 
                            key={media.id} 
                            className="relative group rounded-2xl overflow-hidden glass-panel border border-black/5 dark:border-white/5 shadow-xs hover:shadow-md transition-all"
                          >
                            {/* Thumbnail */}
                            <div 
                              className="w-full h-28 cursor-pointer relative overflow-hidden bg-muted/30"
                              onClick={() => !isPdf && setLightboxUrl(media.url)}
                            >
                              {isPdf ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                                  <FileText className="size-8 text-primary/60" />
                                  <span className="text-[10px] font-bold">PDF Document</span>
                                </div>
                              ) : (
                                <img 
                                  src={media.url} 
                                  alt={media.caption || "Medical scan"} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  loading="lazy"
                                />
                              )}
                              {/* Category Badge */}
                              <div className={cn("absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border", catInfo.color)}>
                                {catInfo.label}
                              </div>
                            </div>

                            {/* Info Bar */}
                            <div className="p-2 bg-background/90 flex flex-col gap-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-semibold text-foreground truncate max-w-[100px]">
                                  {media.caption || media.storagePath?.split("/").pop()?.substring(0, 20) || "Scan"}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isPdf && (
                                    <a 
                                      href={media.url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-primary hover:opacity-80 p-0.5"
                                      title="Open PDF"
                                    >
                                      <Download className="size-3" />
                                    </a>
                                  )}
                                  <button 
                                    onClick={() => setDeletingMedia(media)}
                                    className="text-destructive hover:opacity-80 p-0.5"
                                    title="Delete"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              </div>
                              {uploadDate && (
                                <span className="text-[9px] text-muted-foreground">{uploadDate}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">No diagnostic media uploaded yet. Use the upload zone above to attach X-rays, lab reports, or other files.</p>
                  )}
                </div>
              </div>

              <DialogFooter className="p-4 bg-muted/40 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full sm:w-auto rounded-full font-semibold"
                >
                  <Trash2 className="size-4 mr-1" /> Delete Patient Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDialogClose}
                  className="w-full sm:w-auto rounded-full font-semibold"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-6 space-y-4 text-center">
              <div className="mx-auto size-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                <AlertTriangle className="size-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-destructive">Delete Patient Record?</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This will permanently remove <strong>{selectedPatient?.name}</strong> and all associated medical history, prescriptions, and X-ray attachments.
              </DialogDescription>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => setShowConfirmDelete(false)} className="rounded-full">Cancel</Button>
                <Button variant="destructive" onClick={() => handleDeletePatient(selectedPatient.id)} className="rounded-full font-bold">Yes, Delete Record</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] p-2 rounded-2xl bg-black/95 border-white/10">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Full-size preview of diagnostic scan</DialogDescription>
          </DialogHeader>
          {lightboxUrl && (
            <img 
              src={lightboxUrl} 
              alt="Full-size diagnostic scan" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Media Confirmation Dialog */}
      <Dialog open={!!deletingMedia} onOpenChange={(open) => !open && setDeletingMedia(null)}>
        <DialogContent className="max-w-sm glass-panel rounded-2xl p-6 border border-white/40 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <Trash2 className="size-5" /> Delete this file?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will permanently remove the file from Firebase Storage and the patient's record.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingMedia(null)} className="rounded-full">Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteMedia(deletingMedia)} className="rounded-full font-bold">Delete File</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
