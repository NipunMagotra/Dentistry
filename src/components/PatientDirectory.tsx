"use client"

import { useState, useEffect } from "react"
import { Search, User, Clock, Pill, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock Data for the Demo
const MOCK_PATIENTS = [
  {
    id: "p1",
    name: "Alice Smith",
    phone: "+1 555-0100",
    gender: "Female",
    history: {
      appointments: [
        { date: "Oct 12, 2023", doctor: "Dr. Sarah Jenkins", status: "Completed" },
        { date: "Jan 05, 2024", doctor: "Dr. Michael Chen", status: "Completed" },
      ],
      prescriptions: [
        { date: "Oct 12, 2023", drugs: ["Amoxicillin 500mg (1-1-1) 5 Days", "Ibuprofen 400mg (1-0-1) 3 Days"] }
      ]
    }
  },
  {
    id: "p2",
    name: "Bob Johnson",
    phone: "+1 555-0101",
    gender: "Male",
    history: {
      appointments: [
        { date: "Nov 22, 2023", doctor: "Dr. Emily Rodriguez", status: "Completed" },
      ],
      prescriptions: [
        { date: "Nov 22, 2023", drugs: ["Paracetamol 500mg (1-1-1) 3 Days"] }
      ]
    }
  },
  {
    id: "p3",
    name: "Charlie Davis",
    phone: "+1 555-0102",
    gender: "Male",
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
}

interface Prescription {
  date: string
  drugs: string[]
}

interface Patient {
  id: string
  name: string
  phone: string
  gender: string
  history: {
    appointments: PatientAppointment[]
    prescriptions: Prescription[]
  }
}

export function PatientDirectory() {
  const [search, setSearch] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

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
      <Card className="border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-2xl font-bold text-slate-800">Patient Directory</CardTitle>
          <CardDescription>Search for patients to view their medical history and past prescriptions.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Search Bar */}
          <div className="relative">
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
                  className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-lg">{patient.name}</div>
                      <div className="text-sm text-slate-500 flex gap-3">
                        <span>{patient.phone}</span>
                        <span className="text-slate-300">•</span>
                        <span>{patient.gender}</span>
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
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-2xl bg-slate-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              {selectedPatient?.name}'s Medical History
            </DialogTitle>
            <DialogDescription>
              Phone: {selectedPatient?.phone} | Gender: {selectedPatient?.gender}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
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
                    <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <div className="font-medium text-slate-700">{apt.date}</div>
                      <div className="text-sm text-slate-500">{apt.doctor}</div>
                      <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">{apt.status}</div>
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
                    <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2">
                      <div className="font-semibold text-slate-700 border-b pb-1 mb-2">{rx.date}</div>
                      <ul className="space-y-1">
                        {rx.drugs.map((drug, j) => (
                          <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                            <Pill className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            {drug}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
