"use client"

import { useState, useEffect, useRef } from "react"
import { getDoctors, searchPatients, createSecurePrescription } from "@/app/actions"
import { toPng } from "html-to-image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, FileText, Download, Copy, Check, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock common drugs for the predefined list
const COMMON_DRUGS = [
  { id: "d1", name: "Amoxicillin 500mg" },
  { id: "d2", name: "Paracetamol 650mg" },
  { id: "d3", name: "Ibuprofen 400mg" },
  { id: "d4", name: "Chlorhexidine Mouthwash" },
  { id: "d5", name: "Metronidazole 400mg" },
]

const FREQUENCIES = ["1-0-0", "1-0-1", "1-1-1", "0-1-0", "0-0-1", "SOS"]

const DEFAULT_DOCTORS = [
  { id: "1", name: "Dr. Sarah Jenkins", specialty: "Periodontics", degrees: "BDS, MDS (Periodontics)", regNo: "849201", charge: 150 },
  { id: "2", name: "Dr. Michael Chen", specialty: "Prosthodontics", degrees: "DDS, MS (Prosthodontics)", regNo: "732910", charge: 200 },
  { id: "3", name: "Dr. Emily Rodriguez", specialty: "Pediatric Dentistry", degrees: "DDS, MSD (Pedodontics)", regNo: "918273", charge: 180 }
]

type SelectedDrug = {
  id: string
  name: string
  frequency: string
  days: number
  isCustom?: boolean
}

export function EPrescriptionForm() {
  const [selectedDrugs, setSelectedDrugs] = useState<SelectedDrug[]>([])
  
  // Patient details state
  const [patientId, setPatientId] = useState("custom")
  const [patientName, setPatientName] = useState("")
  const [patientGender, setPatientGender] = useState("Male")
  const [patientAge, setPatientAge] = useState("30")
  const [patientPhone, setPatientPhone] = useState("")
  const [patients, setPatients] = useState<any[]>([])

  const [doctorsList, setDoctorsList] = useState<any[]>(DEFAULT_DOCTORS)
  const [selectedDoctorId, setSelectedDoctorId] = useState(DEFAULT_DOCTORS[0].name)

  // Clinic profile settings
  const [profile, setProfile] = useState({
    clinicName: "City Dental Clinic",
    clinicAddress: "123 Health Avenue, Medical District",
    clinicPhone: "+1 (555) 123-4567",
    doctorName: "Dr. Sarah Jenkins",
    doctorDegrees: "BDS, MDS (Periodontics)",
    doctorRegNo: "849201"
  })

  // Preview / Generation states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  
  const prescriptionRef = useRef<HTMLDivElement>(null)

  // Load clinic profile, patient directory & doctors list
  useEffect(() => {
    const loadData = async () => {
      const savedProfile = localStorage.getItem("clinic_profile_settings")
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile)
          setProfile({
            clinicName: parsed.clinicName || "City Dental Clinic",
            clinicAddress: parsed.clinicAddress || "123 Health Avenue, Medical District",
            clinicPhone: parsed.clinicPhone || "+1 (555) 123-4567",
            doctorName: parsed.doctorName || "Dr. Sarah Jenkins",
            doctorDegrees: parsed.doctorDegrees || "BDS, MDS (Periodontics)",
            doctorRegNo: parsed.doctorRegNo || "849201"
          })
        } catch (e) {
          console.error(e)
        }
      }

      // Load patients directory from DB
      try {
        const fetchedPatients = await searchPatients("", "All")
        setPatients(fetchedPatients || [])
      } catch (e) {
        console.error("Failed to load patients for prescription selector", e)
      }

      // Load doctors list
      const savedDocs = localStorage.getItem("clinic_doctors_list")
      if (savedDocs) {
        try {
          const parsed = JSON.parse(savedDocs)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDoctorsList(parsed)
            setSelectedDoctorId(parsed[0].id)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
    loadData()
    window.addEventListener("clinic-profile-updated", loadData)
    window.addEventListener("clinic-doctors-updated", loadData)
    window.addEventListener("patient-directory-updated", loadData)
    return () => {
      window.removeEventListener("clinic-profile-updated", loadData)
      window.removeEventListener("clinic-doctors-updated", loadData)
      window.removeEventListener("patient-directory-updated", loadData)
    }
  }, [])

  const currentDoctor = doctorsList.find(d => d.id === selectedDoctorId || d.name === selectedDoctorId) || {
    name: profile.doctorName,
    degrees: profile.doctorDegrees,
    regNo: profile.doctorRegNo
  }

  const handlePatientSelect = (val: string | null) => {
    if (!val) return
    setPatientId(val)
    if (val === "custom") {
      setPatientName("")
      setPatientPhone("")
      setPatientGender("Male")
      setPatientAge("30")
    } else {
      const match = patients.find(p => p.id === val)
      if (match) {
        setPatientName(match.name)
        setPatientPhone(match.phone || "")
        setPatientGender(match.gender || "Male")
        setPatientAge(match.age || "32")
      }
    }
  }
  
  // Custom drug input state
  const [customName, setCustomName] = useState("")
  const [customFreq, setCustomFreq] = useState("1-0-1")
  const [customDays, setCustomDays] = useState<number | "">("")

  const handleToggleDrug = (drugId: string, drugName: string, checked: boolean) => {
    if (checked) {
      setSelectedDrugs((prev) => [
        ...prev,
        { id: drugId, name: drugName, frequency: "1-0-1", days: 3 },
      ])
    } else {
      setSelectedDrugs((prev) => prev.filter((d) => d.id !== drugId))
    }
  }

  const handleUpdateDrug = (id: string, field: "frequency" | "days", value: string | number) => {
    setSelectedDrugs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }

  const handleAddCustomDrug = () => {
    if (!customName.trim()) return
    const newId = `custom_${Date.now()}`
    setSelectedDrugs((prev) => [
      ...prev,
      {
        id: newId,
        name: customName.trim(),
        frequency: customFreq,
        days: Number(customDays) || 3,
        isCustom: true,
      },
    ])
    setCustomName("")
    setCustomDays("")
  }

  const handleRemoveDrug = (id: string) => {
    setSelectedDrugs((prev) => prev.filter((d) => d.id !== id))
  }

  const handleGeneratePreview = () => {
    if (!patientName.trim()) return
    setIsPreviewOpen(true)

    // Also persist prescription to DB for patient history
    if (patientId && patientId !== "custom") {
      const drugStrings = selectedDrugs.map(d => `${d.name} (${d.frequency}) ${d.days} Days`)
      createSecurePrescription({
        patientId: patientId,
        doctorName: currentDoctor.name,
        drugs: drugStrings,
        notes: "Generated via E-Prescription Pad"
      }).catch(err => console.error("Failed to save prescription to DB", err))
    }
  }

  const handleCopyImage = async () => {
    if (!prescriptionRef.current) return
    setIsGenerating(true)
    try {
      const dataUrl = await toPng(prescriptionRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ])
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2500)
    } catch (err) {
      console.error("Failed to copy image to clipboard", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadImage = async () => {
    if (!prescriptionRef.current) return
    setIsGenerating(true)
    try {
      const dataUrl = await toPng(prescriptionRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `Prescription_${patientName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2500)
    } catch (err) {
      console.error("Failed to download image", err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <Card className="glass-panel border border-white/40 dark:border-white/10 shadow-lg">
        <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-xl font-extrabold text-foreground">E-Prescription Pad</CardTitle>
              <CardDescription className="text-muted-foreground text-xs md:text-sm">Select a patient, assign dosages, and generate clipboard-copyable image forms.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          
          {/* Prescribing Physician & Patient Details Selector */}
          <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-white/40 dark:border-white/10 space-y-4">
            <h3 className="font-bold text-primary text-xs uppercase tracking-widest">Clinical Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Selection */}
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="prescribing-doctor">Prescribing Doctor</Label>
                  <Select value={selectedDoctorId} onValueChange={(val) => setSelectedDoctorId(val || "")}>
                    <SelectTrigger id="prescribing-doctor" className="rounded-full h-10 px-4">
                      <SelectValue placeholder="Choose Doctor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl glass-panel">
                      {doctorsList.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>{doc.name} {doc.specialty ? `(${doc.specialty})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="patient-select">Onboarded Patient (Optional)</Label>
                  <Select value={patientId} onValueChange={handlePatientSelect}>
                    <SelectTrigger id="patient-select" className="rounded-full h-10 px-4">
                      <SelectValue placeholder="Choose from Patient Directory" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl glass-panel">
                      <SelectItem value="custom" className="font-bold text-primary">-- Custom/New Entry --</SelectItem>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column: Patient Profile Overrides */}
              <div className="space-y-4 md:pl-6 md:border-l border-black/5 dark:border-white/5">
                <div className="grid gap-1.5">
                  <Label htmlFor="patient-name">Patient Full Name</Label>
                  <Input 
                    id="patient-name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    disabled={patientId !== "custom"}
                    className={cn(patientId !== "custom" && "opacity-60 cursor-not-allowed")}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="patient-gender">Gender</Label>
                    <Select disabled={patientId !== "custom"} value={patientGender} onValueChange={(val) => setPatientGender(val || "Male")}>
                      <SelectTrigger id="patient-gender" className={cn("rounded-full h-10 px-4", patientId !== "custom" && "opacity-60 cursor-not-allowed")}>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl glass-panel">
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="patient-age">Age (Years)</Label>
                    <Input 
                      id="patient-age"
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="e.g. 28"
                      disabled={patientId !== "custom"}
                      className={cn(patientId !== "custom" && "opacity-60 cursor-not-allowed")}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="patient-phone">Phone Number</Label>
                  <Input 
                    id="patient-phone"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 000-0000"
                    disabled={patientId !== "custom"}
                    className={cn(patientId !== "custom" && "opacity-60 cursor-not-allowed")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Standard Medications Selection */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-foreground border-b border-black/5 dark:border-white/5 pb-2">Common Medications</h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_DRUGS.map((drug) => {
                const isChecked = !!selectedDrugs.find((d) => d.id === drug.id)

                return (
                  <button
                    key={drug.id}
                    type="button"
                    onClick={() => handleToggleDrug(drug.id, drug.name, !isChecked)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border cursor-pointer select-none",
                      isChecked 
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20" 
                        : "glass-panel text-muted-foreground hover:text-foreground border-black/10 dark:border-white/10"
                    )}
                  >
                    {isChecked && <Check className="size-3.5" />}
                    {drug.name}
                  </button>
                )
              })}
            </div>

            {/* Inputs for selected common drugs */}
            {selectedDrugs.filter(d => !d.isCustom).length > 0 && (
              <div className="grid gap-3 mt-4 p-4 sm:p-5 rounded-2xl glass-panel border border-white/40 dark:border-white/10 shadow-sm">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Dosage Configuration</h4>
                {selectedDrugs.filter(d => !d.isCustom).map(selected => (
                  <div key={selected.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5 last:border-0 last:pb-0">
                    <div className="font-bold text-sm text-foreground min-w-[160px]">{selected.name}</div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Frequency</span>
                        <div className="w-32">
                          <Select value={selected.frequency} onValueChange={(val) => handleUpdateDrug(selected.id, "frequency", val || "")}>
                            <SelectTrigger className="h-9 px-3 rounded-full"><SelectValue placeholder="Freq" /></SelectTrigger>
                            <SelectContent className="rounded-2xl glass-panel">
                              {FREQUENCIES.map((freq) => <SelectItem key={freq} value={freq}>{freq}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Days</span>
                        <Input 
                          type="number" 
                          min={1} 
                          className="w-18 h-9 rounded-full text-center font-bold" 
                          value={selected.days} 
                          onChange={(e) => handleUpdateDrug(selected.id, "days", parseInt(e.target.value) || 1)} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Drug Adding */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-lg text-foreground border-b border-black/5 dark:border-white/5 pb-2">Add Custom Medication</h3>
            <div className="flex flex-col sm:flex-row items-end gap-3 p-4 rounded-2xl glass-panel border border-white/40 dark:border-white/10">
              <div className="grid gap-1.5 flex-1 w-full">
                <Label htmlFor="custom-name">Drug Name / Note</Label>
                <Input 
                  id="custom-name" 
                  placeholder="e.g. Vitamin D3 60K" 
                  value={customName} 
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5 w-full sm:w-32">
                <Label>Frequency</Label>
                <Select value={customFreq} onValueChange={(val) => setCustomFreq(val || "")}>
                  <SelectTrigger className="rounded-full h-10 px-4">
                    <SelectValue placeholder="Freq" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl glass-panel">
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 w-full sm:w-24">
                <Label htmlFor="custom-days">Days</Label>
                <Input 
                  id="custom-days" 
                  type="number" 
                  min={1} 
                  value={customDays} 
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || "")}
                />
              </div>
              <Button onClick={handleAddCustomDrug} className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold h-10 rounded-full px-5">
                <Plus className="size-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* List of custom additions */}
          {selectedDrugs.filter(d => d.isCustom).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Custom Additions</h4>
              <div className="grid gap-2">
                {selectedDrugs.filter(d => d.isCustom).map(drug => (
                   <div key={drug.id} className="flex items-center justify-between p-3.5 rounded-2xl glass-panel border border-black/5 dark:border-white/5">
                     <div className="font-bold text-foreground text-sm">{drug.name}</div>
                     <div className="flex items-center gap-3 text-xs text-muted-foreground">
                       <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">{drug.frequency}</span>
                       <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">{drug.days} Days</span>
                       <Button variant="ghost" size="icon-xs" onClick={() => handleRemoveDrug(drug.id)} className="text-destructive hover:bg-destructive/10">
                         <Trash2 className="size-4" />
                       </Button>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 border-t border-black/5 dark:border-white/5 flex justify-end">
            <Button 
              onClick={handleGeneratePreview} 
              disabled={selectedDrugs.length === 0 || !patientName.trim() || isGenerating}
              className="bg-primary text-primary-foreground font-bold px-8 py-6 text-base w-full sm:w-auto rounded-full shadow-lg shadow-primary/25"
            >
              {isGenerating ? <Loader2 className="mr-2 size-5 animate-spin" /> : <FileText className="mr-2 size-5" />}
              {isGenerating ? "Saving Prescription..." : "Generate & Download Prescription"}
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* PREVIEW AND GENERATION DIALOG MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => !open && setIsPreviewOpen(false)}>
        <DialogContent className="sm:max-w-4xl max-w-[95vw] glass-panel p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-4 sm:p-6 border-b border-black/5 dark:border-white/5 flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <FileText className="size-5 text-primary" /> Prescription Preview
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review details, copy PNG image directly to clipboard, or download locally.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Preview canvas viewport with responsive horizontal scrolling for mobile */}
          <div className="flex-1 p-4 sm:p-6 overflow-auto flex justify-center items-start">
            
            {/* Styled Prescription Pad (Captured as image) */}
            <div 
              ref={prescriptionRef}
              id="prescription-capture-node"
              className="w-[720px] max-w-full min-h-[850px] p-8 sm:p-10 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 flex flex-col justify-between shrink-0 font-sans"
              style={{ contentVisibility: "auto" }}
            >
              <div>
                {/* Header Pad details */}
                <div className="border-b-4 border-blue-900 pb-6 mb-8 flex justify-between items-start">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-blue-900 uppercase tracking-wide leading-none">{profile.clinicName}</h1>
                    <p className="text-xs text-slate-500 font-medium">{profile.clinicAddress}</p>
                    <p className="text-xs text-slate-500 font-medium">Contact: {profile.clinicPhone}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 leading-none">{currentDoctor.name}</h2>
                    <p className="text-xs text-blue-600 font-semibold">{currentDoctor.degrees}</p>
                    <p className="text-[10px] text-slate-400 font-bold">REG NO: {currentDoctor.regNo}</p>
                  </div>
                </div>

                {/* Patient Information row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border rounded-xl bg-slate-50 mb-8 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Patient Name</span>
                    <span className="text-slate-900 text-sm font-bold">{patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Gender / Age</span>
                    <span className="text-slate-900 text-sm font-bold">{patientGender} ({patientAge} Y)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Phone Contact</span>
                    <span className="text-slate-900 text-sm font-bold">{patientPhone || "N/A"}</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Prescribed Date</span>
                    <span className="text-slate-900 text-sm font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
                  </div>
                </div>

                {/* Rx Symbol */}
                <div className="text-4xl font-serif font-extrabold italic text-blue-600 mb-6 leading-none">Rx</div>

                {/* Prescribed Medications Table */}
                <div className="space-y-4 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                        <th className="py-2 px-1 w-10 text-center">#</th>
                        <th className="py-2 px-1">Medication Name</th>
                        <th className="py-2 px-1 text-center w-36">Frequency</th>
                        <th className="py-2 px-1 text-center w-28">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDrugs.map((drug, i) => (
                        <tr key={drug.id} className="border-b border-slate-100 text-slate-800">
                          <td className="py-4 px-1 text-center font-bold text-slate-400 text-sm">{i + 1}</td>
                          <td className="py-4 px-1 font-bold text-base text-slate-800">{drug.name}</td>
                          <td className="py-4 px-1 text-center font-semibold text-slate-600">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200/50">{drug.frequency}</span>
                          </td>
                          <td className="py-4 px-1 text-center font-semibold text-slate-600">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100/50">{drug.days} Days</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Footer info and signature */}
              <div className="pt-8 border-t border-slate-200 mt-16 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4">
                <div className="text-[10px] text-slate-400 font-semibold max-w-sm leading-relaxed text-center sm:text-left">
                  * Validity of this prescription card is 3 months from the date of issue. Please consult your physician before altering dosage or frequency instructions.
                </div>
                <div className="text-center w-48 space-y-1">
                  <div className="border-t border-slate-300 pt-1"></div>
                  <div className="font-bold text-xs text-slate-700 uppercase tracking-wider">Authorized Signature</div>
                  <div className="text-[10px] text-slate-400 font-medium">{currentDoctor.name}</div>
                </div>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <DialogFooter className="p-4 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              className="w-full sm:w-auto rounded-full font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold rounded-full flex items-center justify-center gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : copySuccess ? (
                <Check className="size-4 text-emerald-400" />
              ) : (
                <Copy className="size-4" />
              )}
              {copySuccess ? "Image Copied!" : "Copy Image for WhatsApp"}
            </Button>
            <Button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full flex items-center justify-center gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="size-4 text-emerald-400" />
              ) : (
                <Download className="size-4" />
              )}
              {downloadSuccess ? "Downloaded!" : "Download PNG"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
