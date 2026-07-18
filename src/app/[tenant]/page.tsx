"use client"

import { useState } from "react"
import { BookingWizard } from "@/components/BookingWizard"
import { EPrescriptionForm } from "@/components/EPrescriptionForm"
import { PatientDirectory } from "@/components/PatientDirectory"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, User, CalendarRange, FileText } from "lucide-react"

type Appointment = {
  id: string
  time: string
  patient: string
  doctor: string
  status: string
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const handleAddAppointment = (newApt: Omit<Appointment, "id">) => {
    setAppointments((prev) => [
      ...prev,
      { ...newApt, id: Date.now().toString() }
    ])
  }
  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full">
        
        {/* Header (Hidden on print) */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Clinic OS</h1>
            <p className="text-slate-500">Manage your entire clinic from one place.</p>
          </div>
          <User className="h-10 w-10 p-2 bg-slate-200 rounded-full text-slate-600" />
        </div>

        {/* Tabs (Hidden on print) */}
        <div className="print:hidden">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8">
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4" /> Appointments
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> E-Prescriptions
              </TabsTrigger>
              <TabsTrigger value="directory" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Patient Directory
              </TabsTrigger>
            </TabsList>
            
            {/* Appointments Tab Content */}
            <TabsContent value="appointments" className="mt-0 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Side Panel: Today's Appointments */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="h-[75vh] flex flex-col border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-xl font-bold text-slate-800">Today's Appointments</CardTitle>
                      <CardDescription>You have {appointments.length} appointments today.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                      {appointments.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 italic">
                          No appointments booked yet. Use the wizard to add one.
                        </div>
                      ) : (
                        appointments.map((apt) => (
                          <div key={apt.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col gap-3 transition-all hover:shadow-md hover:border-slate-200">
                            <div className="flex justify-between items-start">
                              <div className="font-semibold text-slate-800">{apt.patient}</div>
                              <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${apt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                {apt.status}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-400" /> {apt.doctor}
                              </div>
                              <div className="text-sm text-blue-600 font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" /> {apt.time}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
                  <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        Front Desk
                      </h2>
                      <p className="text-slate-500 text-lg max-w-lg mx-auto">
                        Welcome! Use the button below to quickly onboard a new patient and book their consultation.
                      </p>
                    </div>
                    
                    <div className="max-w-md mx-auto pt-8">
                      <BookingWizard onBookAppointment={handleAddAppointment} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Patients</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-slate-800">1,248</div>
                        <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                          +12 this week
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-slate-500 text-sm font-medium uppercase tracking-wider">Revenue Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-slate-800">$840</div>
                        <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                          4 appointments completed
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* E-Prescriptions Tab Content */}
            <TabsContent value="prescriptions" className="mt-0 outline-none">
              <EPrescriptionForm />
            </TabsContent>

            {/* Patient Directory Tab Content */}
            <TabsContent value="directory" className="mt-0 outline-none">
              <PatientDirectory />
            </TabsContent>
          </Tabs>
        </div>

        {/* E-Prescription Print Output - It needs to be rendered without Tab wrappers hiding it during print */}
        {/* We keep EPrescriptionForm logic inside the tab, but since the form itself contains the print:block logic, 
            it will only print if the tab is active. That's usually fine since the doctor will click Print while on the tab. */}
      </div>
    </div>
  )
}
