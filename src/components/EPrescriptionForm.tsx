"use client"

import { useState, useEffect } from "react"
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
import { Printer, Plus, Trash2 } from "lucide-react"

// Mock common drugs for the predefined list
const COMMON_DRUGS = [
  { id: "d1", name: "Amoxicillin 500mg" },
  { id: "d2", name: "Paracetamol 650mg" },
  { id: "d3", name: "Ibuprofen 400mg" },
  { id: "d4", name: "Chlorhexidine Mouthwash" },
  { id: "d5", name: "Metronidazole 400mg" },
]

const FREQUENCIES = ["1-0-0", "1-0-1", "1-1-1", "0-1-0", "0-0-1", "SOS"]

type SelectedDrug = {
  id: string
  name: string
  frequency: string
  days: number
  isCustom?: boolean
}

export function EPrescriptionForm() {
  const [selectedDrugs, setSelectedDrugs] = useState<SelectedDrug[]>([])
  const [profile, setProfile] = useState({
    clinicName: "City Dental Clinic",
    clinicAddress: "123 Health Avenue, Medical District",
    clinicPhone: "+1 (555) 123-4567",
    doctorName: "Dr. Sarah Jenkins",
    doctorDegrees: "BDS, MDS (Periodontics)",
    doctorRegNo: "849201"
  })

  useEffect(() => {
    const loadProfile = () => {
      const saved = localStorage.getItem("clinic_profile_settings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setProfile({
            clinicName: parsed.clinicName || "City Dental Clinic",
            clinicAddress: parsed.clinicAddress || "123 Health Avenue, Medical District",
            clinicPhone: parsed.clinicPhone || "+1 (555) 123-4567",
            doctorName: parsed.doctorName || "Dr. Sarah Jenkins",
            doctorDegrees: parsed.doctorDegrees || "BDS, MDS (Periodontics)",
            doctorRegNo: parsed.doctorRegNo || "849201"
          })
        } catch (e) {
          console.error("Error loading profile in form", e)
        }
      }
    }
    loadProfile()
    window.addEventListener("clinic-profile-updated", loadProfile)
    return () => window.removeEventListener("clinic-profile-updated", loadProfile)
  }, [])
  
  // State for custom drug input
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

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full">
      {/* --- SCREEN UI (Hidden on Print) --- */}
      <div className="print:hidden space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">E-Prescription</CardTitle>
                <CardDescription>Select common drugs or add custom medications.</CardDescription>
              </div>
              <Button onClick={handlePrint} className="bg-slate-900 text-white hover:bg-slate-800">
                <Printer className="mr-2 h-4 w-4" />
                Generate Printout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            
            {/* Standard Drugs List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Common Medications</h3>
              <div className="grid gap-4">
                {COMMON_DRUGS.map((drug) => {
                  const selected = selectedDrugs.find((d) => d.id === drug.id)
                  const isChecked = !!selected

                  return (
                    <div key={drug.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3 min-w-[200px]">
                        <Checkbox
                          id={drug.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleToggleDrug(drug.id, drug.name, checked as boolean)}
                        />
                        <Label htmlFor={drug.id} className="font-medium cursor-pointer">{drug.name}</Label>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-32">
                            <Select
                              value={selected.frequency}
                              onValueChange={(val) => handleUpdateDrug(drug.id, "frequency", val || "")}
                            >
                              <SelectTrigger className="h-9 bg-white">
                                <SelectValue placeholder="Freq" />
                              </SelectTrigger>
                              <SelectContent>
                                {FREQUENCIES.map((freq) => (
                                  <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              className="w-20 h-9 bg-white"
                              value={selected.days}
                              onChange={(e) => handleUpdateDrug(drug.id, "days", parseInt(e.target.value) || 1)}
                            />
                            <span className="text-sm text-slate-500 font-medium">Days</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Custom Drug Input */}
            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Add Custom Medication</h3>
              <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border rounded-lg bg-blue-50/50">
                <div className="grid gap-1.5 flex-1 w-full">
                  <Label htmlFor="custom-name">Drug Name / Note</Label>
                  <Input 
                    id="custom-name" 
                    placeholder="e.g. Vitamin D3 60K" 
                    value={customName} 
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="grid gap-1.5 w-full sm:w-32">
                  <Label>Frequency</Label>
                  <Select value={customFreq} onValueChange={(val) => setCustomFreq(val || "")}>
                    <SelectTrigger className="bg-white">
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
                    className="bg-white"
                  />
                </div>
                <Button onClick={handleAddCustomDrug} variant="secondary" className="w-full sm:w-auto mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Custom Drugs List Display */}
            {selectedDrugs.filter(d => d.isCustom).length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Custom Entries</h4>
                <div className="grid gap-2">
                  {selectedDrugs.filter(d => d.isCustom).map(drug => (
                     <div key={drug.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                       <div className="font-medium text-slate-800">{drug.name}</div>
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
      </div>

      {/* --- PRINT LAYOUT (Visible only on Print) --- */}
      <div className="hidden print:block p-8 bg-white text-black min-h-screen">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider">{profile.clinicName}</h1>
            <p className="text-sm mt-1 text-slate-600">{profile.clinicAddress}</p>
            <p className="text-sm text-slate-600">Phone: {profile.clinicPhone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{profile.doctorName}</h2>
            <p className="text-sm text-slate-600">{profile.doctorDegrees}</p>
            <p className="text-sm text-slate-600">Reg No: {profile.doctorRegNo}</p>
          </div>
        </div>

        {/* Patient Details */}
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg mb-8 border border-slate-200">
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <div><span className="font-semibold mr-2">Patient Name:</span> John Doe</div>
            <div><span className="font-semibold mr-2">Date:</span> {new Date().toLocaleDateString()}</div>
            <div><span className="font-semibold mr-2">Age/Gender:</span> 34 / Male</div>
            <div><span className="font-semibold mr-2">Phone:</span> +1 234 567 890</div>
          </div>
        </div>

        {/* Rx Symbol */}
        <div className="text-4xl font-serif font-bold italic mb-6">Rx</div>

        {/* Medications Table */}
        {selectedDrugs.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="py-3 px-2 font-bold w-12 text-center">#</th>
                <th className="py-3 px-2 font-bold">Medicine Name</th>
                <th className="py-3 px-2 font-bold text-center w-32">Frequency</th>
                <th className="py-3 px-2 font-bold text-center w-24">Duration</th>
              </tr>
            </thead>
            <tbody>
              {selectedDrugs.map((drug, index) => (
                <tr key={drug.id} className="border-b border-slate-100">
                  <td className="py-4 px-2 text-center text-slate-500 font-medium">{index + 1}</td>
                  <td className="py-4 px-2 font-semibold text-lg">{drug.name}</td>
                  <td className="py-4 px-2 text-center font-medium">{drug.frequency}</td>
                  <td className="py-4 px-2 text-center font-medium">{drug.days} Days</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-lg">
            No medications added to this prescription.
          </div>
        )}

        {/* Footer / Signature */}
        <div className="mt-32 pt-8 flex justify-between items-end">
          <div className="text-xs text-slate-500">
            * Validity of this prescription is 3 months from the date of issue.
          </div>
          <div className="text-center w-48">
            <div className="border-t border-slate-400 mb-2"></div>
            <div className="font-semibold">Doctor's Signature</div>
          </div>
        </div>
      </div>

    </div>
  )
}
