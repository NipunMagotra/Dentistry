"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User, Clock, Pill, FileText, AlertTriangle, Download, Paperclip, Upload, Trash2 } from "lucide-react"
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

const MOCK_XRAY = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%230f172a'/><text x='50%' y='40%' font-family='sans-serif' font-size='20' font-weight='bold' fill='%233b82f6' text-anchor='middle'>DENTAL X-RAY SCAN</text><path d='M80,180 Q100,100 120,180 T160,180 T200,180 T240,180 T280,180 T320,180' stroke='%2338bdf8' stroke-width='4' fill='none' opacity='0.7'/><circle cx='200' cy='160' r='6' fill='%23ef4444'/><text x='50%' y='80%' font-family='sans-serif' font-size='12' fill='%2364748b' text-anchor='middle'>Panoramic Scan - Target region shaded red</text></svg>"

// Mock Data for the Demo
const MOCK_PATIENTS = [
  {
    id: "p1",
    name: "Alice Smith",
    phone: "+1 555-0100",
    gender: "Female",
    dob: "Nov 14, 1991",
    allergies: "Penicillin",
    attachments: [
      { id: "att_1", name: "Panoramic_Scan.svg", url: MOCK_XRAY, date: "Jan 05, 2024" }
    ],
    history: {
      appointments: [
        { date: "Oct 12, 2023", doctor: "Dr. Sarah Jenkins", status: "Completed", reason: "Routine Clean & Checkup", notes: "Mild plaque buildup. Advised scaling." },
        { date: "Jan 05, 2024", doctor: "Dr. Michael Chen", status: "Completed", reason: "Deep Scaling & Polishing", notes: "Scaling completed. Gums healthy." },
      ],
      prescriptions: [
        { date: "Oct 12, 2023", doctor: "Dr. Sarah Jenkins", drugs: ["Amoxicillin 500mg (1-0-1) 5 Days", "Ibuprofen 400mg (1-0-1) 3 Days"] }
      ]
    }
  },
  {
    id: "p2",
    name: "Bob Johnson",
    phone: "+1 555-0101",
    gender: "Male",
    dob: "May 23, 1988",
    allergies: "None",
    attachments: [],
    history: {
      appointments: [
        { date: "Nov 22, 2023", doctor: "Dr. Emily Rodriguez", status: "Completed", reason: "Tooth Extraction", notes: "Lower left molar extraction. Prescribed paracetamol." },
      ],
      prescriptions: [
        { date: "Nov 22, 2023", doctor: "Dr. Emily Rodriguez", drugs: ["Paracetamol 500mg (1-1-1) 3 Days"] }
      ]
    }
  },
  {
    id: "p3",
    name: "Charlie Davis",
    phone: "+1 555-0102",
    gender: "Male",
    dob: "Aug 09, 1995",
    allergies: "Sulfa Drugs",
    attachments: [],
    history: {
      appointments: [],
      prescriptions: []
    }
  },
]

interface PatientAppointment {
  date: string
  doctor: string
  status: string
  reason?: string
  notes?: string
}

interface Prescription {
  date: string
  doctor?: string
  drugs: string[]
}

interface PatientAttachment {
  id: string
  name: string
  url: string
  date: string
}

interface Patient {
  id: string
  name: string
  phone: string
  gender: string
  dob?: string
  allergies?: string
  attachments?: PatientAttachment[]
  history: {
    appointments: PatientAppointment[]
    prescriptions: Prescription[]
  }
}

const getLastVisited = (patient: Patient) => {
  const appointments = patient.history?.appointments || []
  if (appointments.length === 0) return "Never"
  const lastApt = appointments[appointments.length - 1]
  return lastApt.date
}

export function PatientDirectory() {
  const [search, setSearch] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [downloadingRx, setDownloadingRx] = useState<any>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [profile, setProfile] = useState({
    clinicName: "City Dental Clinic",
    doctorName: "Dr. Sarah Jenkins"
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedPatient) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return

      // Compress image using Canvas
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          // Compress to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7)

          const newAttachment = {
            id: `att_${Date.now()}`,
            name: file.name.replace(/\.[^/.]+$/, "") + ".jpg", // Change extension
            url: compressedDataUrl,
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
          }

          const updatedPatient = {
            ...selectedPatient,
            attachments: [...(selectedPatient.attachments || []), newAttachment]
          }

          setSelectedPatient(updatedPatient)
          setPatients(prev => {
            const updatedList = prev.map(p => p.id === selectedPatient.id ? updatedPatient : p)
            try {
              localStorage.setItem("patient_directory_list", JSON.stringify(updatedList))
            } catch (e) {
              console.error("[Storage] Failed to save attachment — storage quota may be exceeded", e)
            }
            return updatedList
          })
          window.dispatchEvent(new Event("patient-directory-updated"))
        }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    if (!selectedPatient) return

    const updatedPatient = {
      ...selectedPatient,
      attachments: (selectedPatient.attachments || []).filter(a => a.id !== attachmentId)
    }

    setSelectedPatient(updatedPatient)
    const updatedList = patients.map(p => p.id === selectedPatient.id ? updatedPatient : p)
    setPatients(updatedList)
    try {
      localStorage.setItem("patient_directory_list", JSON.stringify(updatedList))
    } catch (e) {
      console.error("[Storage] Failed to save after attachment removal", e)
    }
    window.dispatchEvent(new Event("patient-directory-updated"))
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
    
    // Wait for offscreen DOM node to render, compile to PNG, and download
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
        link.download = `Prescription_${patientName.replace(/\s+/g, "_")}_${rx.date.replace(/\s+/g, "_")}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (err) {
        console.error("Failed to generate prescription download image", err)
      } finally {
        setDownloadingRx(null)
      }
    }, 200)
  }

  const handleDialogClose = () => {
    setSelectedPatient(null)
    setShowConfirmDelete(false)
  }

  const handleDeletePatient = (id: string) => {
    const list = patients.filter((p) => p.id !== id)
    setPatients(list)
    try {
      localStorage.setItem("patient_directory_list", JSON.stringify(list))
    } catch (e) {
      console.error("[Storage] Failed to save after patient deletion", e)
    }

    // Cascade: remove this patient's active appointments
    const deletedPatient = patients.find(p => p.id === id)
    if (deletedPatient) {
      const savedApts = localStorage.getItem("active_appointments")
      if (savedApts) {
        try {
          const activeApts = JSON.parse(savedApts)
          const cleaned = activeApts.filter((a: any) => a.patient.toLowerCase() !== deletedPatient.name.toLowerCase())
          localStorage.setItem("active_appointments", JSON.stringify(cleaned))
        } catch (e) {
          console.error(e)
        }
      }

      // Cascade: remove this patient's pending requests
      const savedPending = localStorage.getItem("pending_appointments")
      if (savedPending) {
        try {
          const pendingApts = JSON.parse(savedPending)
          const cleaned = pendingApts.filter((a: any) => a.patient.toLowerCase() !== deletedPatient.name.toLowerCase())
          localStorage.setItem("pending_appointments", JSON.stringify(cleaned))
        } catch (e) {
          console.error(e)
        }
      }
    }

    window.dispatchEvent(new Event("patient-directory-updated"))
    setSelectedPatient(null)
    setShowConfirmDelete(false)
  }

  useEffect(() => {
    const loadPatients = () => {
      const saved = localStorage.getItem("patient_directory_list")
      if (saved) {
        try {
          setPatients(JSON.parse(saved))
        } catch (e) {
          console.error(e)
          setPatients(MOCK_PATIENTS)
        }
      } else {
        localStorage.setItem("patient_directory_list", JSON.stringify(MOCK_PATIENTS))
        setPatients(MOCK_PATIENTS)
      }
    }
    loadPatients()
    window.addEventListener("patient-directory-updated", loadPatients)
    window.addEventListener("storage", loadPatients)
    return () => {
      window.removeEventListener("patient-directory-updated", loadPatients)
      window.removeEventListener("storage", loadPatients)
    }
  }, [])

  // Filter patients based on search input
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-2xl font-bold text-slate-800">Patient Directory</CardTitle>
          <CardDescription>Search for patients to view their medical history and past prescriptions.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search by name or phone..." 
              className="pl-10 h-12 text-lg bg-white border-slate-200 focus-visible:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Patient List */}
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <div className="text-center p-8 text-slate-500 italic border border-dashed border-slate-200 rounded-xl">
                No patients found matching "{search}"
              </div>
            ) : (
              filteredPatients.map(patient => (
                <div 
                  key={patient.id} 
                  onClick={() => setSelectedPatient(patient)}
                  className="p-4 border border-slate-100 rounded-xl bg-slate-50/70 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:border-blue-300 hover:bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-lg">{patient.name}</div>
                      <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <span>{patient.phone}</span>
                        <span className="text-slate-300">•</span>
                        <span>{patient.gender}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100/50">
                          Last Visited: {getLastVisited(patient)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-blue-600 font-medium text-sm flex items-center gap-1">
                    View History &rarr;
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient History Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden">
          {!showConfirmDelete ? (
            <>
              <DialogHeader className="p-6 pb-4 border-b bg-slate-50/50">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                  <User className="h-6 w-6 text-blue-600" />
                  {selectedPatient?.name}'s Medical History
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">
                  Phone: {selectedPatient?.phone} | Gender: {selectedPatient?.gender} | DOB: {selectedPatient?.dob || "N/A"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 px-6 py-4 max-h-[55vh] overflow-y-auto pr-2">
                {/* Allergies Section */}
                <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  selectedPatient?.allergies && selectedPatient.allergies !== "None"
                    ? "bg-red-50/60 border-red-200 text-red-700"
                    : "bg-green-50/60 border-green-200/50 text-green-700"
                }`}>
                  <span className="font-bold text-xs uppercase tracking-wider">Allergies:</span>
                  <span className="font-semibold text-sm">{selectedPatient?.allergies || "None"}</span>
                </div>

                {/* Past Appointments */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Clock className="h-5 w-5 text-slate-500" /> Past Appointments
                  </h3>
                  {selectedPatient?.history.appointments.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">No past appointments recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPatient?.history.appointments.map((apt, i) => (
                        <div key={i} className="flex justify-between items-start p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl shadow-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{apt.date}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/30">
                                {apt.reason || "General Consultation"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-1 font-medium">Notes: {apt.notes || "No treatment notes logged."}</p>
                          </div>
                          <div className="text-right space-y-1 shrink-0 ml-4">
                            <div className="text-xs text-slate-500 font-semibold">{apt.doctor}</div>
                            <div className="text-[10px] bg-green-100 text-green-850 px-2.5 py-0.5 rounded-full font-bold inline-block border border-green-250/20">{apt.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Prescriptions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <FileText className="h-5 w-5 text-slate-500" /> Past Prescriptions
                  </h3>
                  {selectedPatient?.history.prescriptions.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">No past prescriptions recorded.</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedPatient?.history.prescriptions.map((rx, i) => (
                        <div key={i} className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl shadow-sm flex justify-between items-start">
                          <div className="space-y-3 flex-1">
                            <div className="flex justify-between items-center border-b pb-1.5">
                              <span className="font-bold text-slate-700 text-sm">{rx.date}</span>
                              <span className="text-xs text-slate-400 font-medium italic">Prescribed by: {rx.doctor || profile.doctorName}</span>
                            </div>
                            <ul className="space-y-1">
                              {rx.drugs.map((drug, j) => (
                                <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                                  <Pill className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                  {drug}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Button 
                            variant="outline"
                            size="icon-sm"
                            onClick={() => selectedPatient && handleDownloadPastPrescription(selectedPatient.name, rx)}
                            className="ml-4 h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg shrink-0"
                            title="Download Prescription Copy"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Attachments / Clinical X-Rays */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-slate-500" /> X-Rays & Diagnostic Images
                    </div>
                    <div>
                      <label className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[10px] uppercase tracking-wide py-1 px-2.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Upload File
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload} 
                        />
                      </label>
                    </div>
                  </h3>

                  {selectedPatient?.attachments && selectedPatient.attachments.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedPatient.attachments.map((file) => (
                        <div key={file.id} className="relative group border rounded-xl overflow-hidden bg-white border-slate-200 shadow-xs">
                          {/* Image Thumbnail */}
                          <img 
                            src={file.url} 
                            alt={file.name} 
                            className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxUrl(file.url)}
                          />
                          {/* Title block */}
                          <div className="p-2 bg-slate-50 border-t text-[10px] text-slate-500 font-semibold truncate flex justify-between items-center">
                            <span className="truncate flex-1" title={file.name}>{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(file.id)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              title="Delete Scan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic">No clinical images or dental X-rays uploaded.</p>
                  )}
                </div>
              </div>

              <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200 flex flex-row items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50/50 font-semibold text-xs mr-auto w-full sm:w-auto"
                >
                  Delete Patient Profile
                </Button>
                <Button variant="outline" onClick={handleDialogClose} className="font-semibold px-4 h-9">
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="p-6 pb-4 border-b bg-red-50/20">
                <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Confirm Delete
                </DialogTitle>
                <DialogDescription>
                  This action is permanent and cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 text-slate-600 text-sm">
                Are you sure you want to delete **{selectedPatient?.name}**'s patient profile? This will permanently remove all their historical appointments, clinical diagnostics, and prescription sheets.
              </div>

              <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDelete(false)}
                  className="font-semibold px-4 h-9"
                >
                  Go Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedPatient && handleDeletePatient(selectedPatient.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 h-9"
                >
                  Yes, Delete Patient
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Offscreen prescription canvas for programmatically generating downloads */}
      {downloadingRx && (() => {
        const matchedDoc = doctorsList.find(d => d.name === downloadingRx.doctor) || {
          name: downloadingRx.doctor || profile.doctorName,
          specialty: "Dental Surgeon",
          degrees: "BDS, MDS (Periodontics)",
          regNo: "849201"
        };
        return (
          <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
            <div 
              ref={exportRef}
              className="w-[720px] min-h-[900px] p-10 bg-white text-slate-800 flex flex-col justify-between font-sans"
            >
              <div>
                {/* Header Pad details */}
                <div className="border-b-4 border-blue-900 pb-6 mb-8 flex justify-between items-start">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-blue-900 uppercase tracking-wide leading-none">{profile.clinicName}</h1>
                    <p className="text-xs text-slate-500 font-medium">Contact: {profile.clinicName === "City Dental Clinic" ? "+1 (555) 123-4567" : "Clinic Registry"}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 leading-none">{matchedDoc.name}</h2>
                    <p className="text-xs text-blue-600 font-semibold">{matchedDoc.degrees}</p>
                    <p className="text-[10px] text-slate-400 font-bold">REG NO: {matchedDoc.regNo}</p>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="grid grid-cols-4 gap-4 p-4 border rounded-xl bg-slate-50/50 mb-8 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Patient Name</span>
                    <span className="text-slate-900 text-sm font-bold">{selectedPatient?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Gender / DOB</span>
                    <span className="text-slate-900 text-sm font-bold">{selectedPatient?.gender} ({selectedPatient?.dob || "N/A"})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Phone Contact</span>
                    <span className="text-slate-900 text-sm font-bold">{selectedPatient?.phone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Prescribed Date</span>
                    <span className="text-slate-900 text-sm font-bold">{downloadingRx.date}</span>
                  </div>
                </div>

                {/* Rx Symbol */}
                <div className="text-4xl font-serif font-extrabold italic text-blue-600 mb-6 leading-none">Rx</div>

                {/* Prescribed Medications */}
                <div className="space-y-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                        <th className="py-2 px-1 w-10 text-center">#</th>
                        <th className="py-2 px-1">Medication Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downloadingRx.drugs.map((drug: string, i: number) => (
                        <tr key={i} className="border-b border-slate-100 text-slate-800">
                          <td className="py-4 px-1 text-center font-bold text-slate-400 text-sm">{i + 1}</td>
                          <td className="py-4 px-1 font-bold text-base text-slate-800">{drug}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Footer info and signature */}
              <div className="pt-8 border-t border-slate-200 mt-20 flex justify-between items-end">
                <div className="text-[10px] text-slate-400 font-semibold max-w-sm leading-relaxed">
                  * Validity of this prescription card is 3 months from the date of issue. Please consult your physician before altering dosage or frequency instructions.
                </div>
                <div className="text-center w-48 space-y-1">
                  <div className="border-t border-slate-300 pt-1"></div>
                  <div className="font-bold text-xs text-slate-700 uppercase tracking-wider">Authorized Signature</div>
                  <div className="text-[10px] text-slate-400 font-medium">{matchedDoc.name}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Lightbox zoom dialog overlay for diagnostic attachments */}
      {lightboxUrl && (
        <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
          <DialogContent className="sm:max-w-4xl bg-slate-950 p-2 overflow-hidden flex flex-col justify-center items-center h-[75vh] border-none shadow-2xl">
            <div className="relative w-full h-full flex justify-center items-center">
              <img 
                src={lightboxUrl} 
                alt="Enlarged diagnostic view" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
