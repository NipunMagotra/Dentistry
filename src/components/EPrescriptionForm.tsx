"use client"

import { useState, useEffect, useRef } from "react"
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
    const loadData = () => {
      // 1. Profile settings
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
          console.error("Error loading profile", e)
        }
      }

      // 2. Patients directory
      const savedPatients = localStorage.getItem("patient_directory_list")
      if (savedPatients) {
        try {
          setPatients(JSON.parse(savedPatients))
        } catch (e) {
          console.error("Error loading directory", e)
        }
      }

      // 3. Doctors list
      const savedDocs = localStorage.getItem("clinic_doctors_list")
      if (savedDocs) {
        try {
          const parsed = JSON.parse(savedDocs)
          setDoctorsList(parsed)
          if (parsed.length > 0) {
            setSelectedDoctorId((prev) => {
              const stillExists = parsed.some((d: any) => d.name === prev)
              return stillExists ? prev : parsed[0].name
            })
          }
        } catch (e) {
          console.error("Error loading doctors list", e)
          setDoctorsList(DEFAULT_DOCTORS)
        }
      } else {
        setDoctorsList(DEFAULT_DOCTORS)
        setSelectedDoctorId((prev) => prev || DEFAULT_DOCTORS[0].name)
      }
    }

    loadData()
    window.addEventListener("clinic-profile-updated", loadData)
    window.addEventListener("patient-directory-updated", loadData)
    window.addEventListener("clinic-doctors-updated", loadData)
    return () => {
      window.removeEventListener("clinic-profile-updated", loadData)
      window.removeEventListener("patient-directory-updated", loadData)
      window.removeEventListener("clinic-doctors-updated", loadData)
    }
  }, [])

  // Auto-populate patient details on change
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
        // Default mock age if not specified
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

  const handleRemoveDrug = (id: string) => {
    setSelectedDrugs((prev) => prev.filter((d) => d.id !== id))
  }

  const handleAddCustomDrug = () => {
    if (!customName.trim()) return
    const newDrug: SelectedDrug = {
      id: `custom_${Date.now()}`,
      name: customName,
      frequency: customFreq,
      days: Number(customDays) || 3,
      isCustom: true,
    }
    setSelectedDrugs((prev) => [...prev, newDrug])
    setCustomName("")
    setCustomFreq("1-0-1")
    setCustomDays("")
  }

  // Generate PNG data URL using html-to-image
  const generatePngBlob = async (): Promise<Blob | null> => {
    if (!prescriptionRef.current) return null
    setIsGenerating(true)
    try {
      // Small delay to ensure render layout completes
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const dataUrl = await toPng(prescriptionRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        }
      })
      
      const res = await fetch(dataUrl)
      return await res.blob()
    } catch (err) {
      console.error("Failed to render prescription image", err)
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy prescription image directly to Clipboard
  const handleCopyImage = async () => {
    const blob = await generatePngBlob()
    if (!blob) return
    
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob
        })
      ])
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy image to clipboard", err)
    }
  }

  // Download prescription image locally
  const handleDownloadImage = async () => {
    const blob = await generatePngBlob()
    if (!blob) return
    
    try {
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Prescription_${patientName.replace(/\s+/g, "_") || "Patient"}_${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    } catch (err) {
      console.error("Failed to download image", err)
    }
  }

  const currentDoctor = doctorsList.find(d => d.name === selectedDoctorId) || {
    name: profile.doctorName,
    degrees: profile.doctorDegrees,
    regNo: profile.doctorRegNo,
    specialty: "Dental Surgeon"
  }

  return (
    <div className="w-full">
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">E-Prescription Pad</CardTitle>
              <CardDescription>Select a patient, assign dosages, and generate clipboard-copyable image forms.</CardDescription>
            </div>
            <Button 
              onClick={() => setIsPreviewOpen(true)} 
              disabled={selectedDrugs.length === 0 || !patientName.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 font-semibold"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Image
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Prescribing Physician & Patient Details Selector */}
          <div className="p-4 border rounded-xl bg-slate-50/50 space-y-4">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Clinical Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="prescribing-doctor">Prescribing Doctor</Label>
                <Select value={selectedDoctorId} onValueChange={(val) => setSelectedDoctorId(val || "")}>
                  <SelectTrigger id="prescribing-doctor" className="bg-white">
                    <SelectValue placeholder="Choose Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorsList.map(doc => (
                      <SelectItem key={doc.id} value={doc.name}>{doc.name} ({doc.specialty})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="patient-select">Onboarded Patient (Optional)</Label>
                <Select value={patientId} onValueChange={handlePatientSelect}>
                  <SelectTrigger id="patient-select" className="bg-white">
                    <SelectValue placeholder="Choose from Patient Directory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">-- Custom/New Entry --</SelectItem>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="patient-name">Patient Full Name</Label>
                <Input 
                  id="patient-name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="patient-gender">Gender</Label>
                <Select value={patientGender} onValueChange={(val) => setPatientGender(val || "Male")}>
                  <SelectTrigger id="patient-gender" className="bg-white">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
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
                  placeholder="e.g. 35"
                  className="bg-white"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="patient-phone">Phone Number</Label>
                <Input 
                  id="patient-phone"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="e.g. +1 555-0100"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Standard Medications Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Common Medications</h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_DRUGS.map((drug) => {
                const isChecked = !!selectedDrugs.find((d) => d.id === drug.id)

                return (
                  <button
                    key={drug.id}
                    type="button"
                    onClick={() => handleToggleDrug(drug.id, drug.name, !isChecked)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border",
                      isChecked 
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                    {drug.name}
                  </button>
                )
              })}
            </div>

            {/* Inputs for selected common drugs */}
            {selectedDrugs.filter(d => !d.isCustom).length > 0 && (
              <div className="grid gap-3 mt-4 p-4 border rounded-xl bg-slate-50/50">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dosage Configuration</h4>
                {selectedDrugs.filter(d => !d.isCustom).map(selected => (
                  <div key={selected.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pb-3 border-b border-slate-200/60 last:border-0 last:pb-0">
                    <div className="font-semibold text-sm text-slate-800 min-w-[180px]">{selected.name}</div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-32">
                        <Select value={selected.frequency} onValueChange={(val) => handleUpdateDrug(selected.id, "frequency", val || "")}>
                          <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Freq" /></SelectTrigger>
                          <SelectContent>
                            {FREQUENCIES.map((freq) => <SelectItem key={freq} value={freq}>{freq}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={1} className="w-20 h-9 bg-white" value={selected.days} onChange={(e) => handleUpdateDrug(selected.id, "days", parseInt(e.target.value) || 1)} />
                        <span className="text-sm text-slate-500 font-medium">Days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Drug Adding */}
          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Add Custom Medication</h3>
            <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border rounded-lg bg-blue-50/50">
              <div className="grid gap-1.5 flex-1 w-full">
                <Label htmlFor="custom-name">Drug Name / Note</Label>
                <Input 
                  id="custom-name" 
                  placeholder="e.g. Vitamin D3 60K" 
                  value={customName} 
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-white h-10"
                />
              </div>
              <div className="grid gap-1.5 w-full sm:w-32">
                <Label>Frequency</Label>
                <Select value={customFreq} onValueChange={(val) => setCustomFreq(val || "")}>
                  <SelectTrigger className="bg-white h-10">
                    <SelectValue placeholder="Freq" />
                  </SelectTrigger>
                  <SelectContent>
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
                  className="bg-white h-10"
                />
              </div>
              <Button onClick={handleAddCustomDrug} variant="secondary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* List of custom additions */}
          {selectedDrugs.filter(d => d.isCustom).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Additions</h4>
              <div className="grid gap-2">
                {selectedDrugs.filter(d => d.isCustom).map(drug => (
                   <div key={drug.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                     <div className="font-semibold text-slate-800">{drug.name}</div>
                     <div className="flex items-center gap-4 text-sm text-slate-600">
                       <span className="px-2 py-1 bg-slate-100 rounded font-medium">{drug.frequency}</span>
                       <span className="px-2 py-1 bg-slate-100 rounded font-medium">{drug.days} Days</span>
                       <Button variant="ghost" size="sm" onClick={() => handleRemoveDrug(drug.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2">
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* --- PREVIEW AND GENERATION DIALOG MODAL --- */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => !open && setIsPreviewOpen(false)}>
        <DialogContent className="sm:max-w-4xl bg-slate-100 p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" /> Prescription Preview
              </DialogTitle>
              <DialogDescription>
                Review details, copy PNG image directly to clipboard, or download locally.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Preview canvas viewport */}
          <div className="flex-1 p-6 overflow-auto flex justify-center items-start">
            
            {/* Styled Prescription Pad (Captured as image) */}
            <div 
              ref={prescriptionRef}
              id="prescription-capture-node"
              className="w-[720px] min-h-[900px] p-10 bg-white shadow-md border border-slate-200 rounded-lg text-slate-800 flex flex-col justify-between shrink-0 font-sans"
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
                <div className="grid grid-cols-4 gap-4 p-4 border rounded-xl bg-slate-50/50 mb-8 text-xs font-semibold text-slate-700">
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
                  <div className="text-right">
                    <span className="text-slate-400 block uppercase text-[10px] tracking-wider mb-0.5">Prescribed Date</span>
                    <span className="text-slate-900 text-sm font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
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
                        <th className="py-2 px-1 text-center w-36">Frequency Dosage</th>
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
              <div className="pt-8 border-t border-slate-200 mt-20 flex justify-between items-end">
                <div className="text-[10px] text-slate-400 font-semibold max-w-sm leading-relaxed">
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
          <DialogFooter className="p-4 bg-white border-t flex flex-row items-center gap-2 justify-end sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              className="font-semibold text-slate-700"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="bg-slate-900 text-white hover:bg-slate-800 font-semibold flex items-center gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : copySuccess ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copySuccess ? "Image Copied!" : "Copy Image for WhatsApp"}
            </Button>
            <Button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloadSuccess ? "Downloaded!" : "Download PNG"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
