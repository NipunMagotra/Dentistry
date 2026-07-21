"use client"

import { useState, useEffect } from "react"
import { Building2, User, Settings, Phone, MapPin, Award, ShieldAlert, Key, Clock, Copy, Check, Plus, Pencil, Trash2, DollarSign, Stethoscope } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"

export interface Doctor {
  id: string
  name: string
  specialty: string
  degrees: string
  regNo: string
  timings: string
  charge: number
}

export const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: "1",
    name: "Dr. Sarah Jenkins",
    specialty: "Periodontics",
    degrees: "BDS, MDS (Periodontics)",
    regNo: "849201",
    timings: "Mon - Fri: 10:00 AM - 5:00 PM",
    charge: 150
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialty: "Prosthodontics",
    degrees: "DDS, MS (Prosthodontics)",
    regNo: "732910",
    timings: "Mon - Thu: 9:00 AM - 4:00 PM",
    charge: 200
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatric Dentistry",
    degrees: "DDS, MSD (Pedodontics)",
    regNo: "918273",
    timings: "Tue - Sat: 11:00 AM - 6:00 PM",
    charge: 180
  }
]

interface ProfileSettings {
  clinicName: string
  clinicAddress: string
  clinicPhone: string
  clinicBio?: string
  clinicHours?: string
  whatsappEnabled: boolean
  qstashToken: string
  twilioSid: string
  twilioToken: string
}

const DEFAULT_SETTINGS: ProfileSettings = {
  clinicName: "City Dental Clinic",
  clinicAddress: "123 Health Avenue, Medical District",
  clinicPhone: "+1 (555) 123-4567",
  clinicBio: "Welcome to our patient booking portal. Schedule a consultation, dental check-up, or specialized treatment with our dental professionals in just a few clicks.",
  clinicHours: "Mon - Sat: 9:00 AM - 7:00 PM",
  whatsappEnabled: true,
  qstashToken: "",
  twilioSid: "",
  twilioToken: "",
}

export function ProfileModal({ tenant }: { tenant: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS)
  const [bookingLink, setBookingLink] = useState("")
  const [copied, setCopied] = useState(false)

  // Doctor Directory state
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isDoctorFormOpen, setIsDoctorFormOpen] = useState(false)
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null)
  
  // Doctor form local state
  const [docName, setDocName] = useState("")
  const [docSpecialty, setDocSpecialty] = useState("")
  const [docDegrees, setDocDegrees] = useState("")
  const [docRegNo, setDocRegNo] = useState("")
  const [docTimings, setDocTimings] = useState("")
  const [docCharge, setDocCharge] = useState("150")

  // Account Profile Avatar state
  const [avatar, setAvatar] = useState<string>("")

  // Load avatar on mount and when modal opens
  const loadAvatar = () => {
    const savedAvatar = localStorage.getItem("clinic_user_avatar")
    if (savedAvatar) {
      setAvatar(savedAvatar)
    } else {
      setAvatar("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80")
    }
  }

  useEffect(() => {
    loadAvatar()
    window.addEventListener("clinic-avatar-updated", loadAvatar)
    return () => window.removeEventListener("clinic-avatar-updated", loadAvatar)
  }, [])

  // Load settings & doctors on open
  useEffect(() => {
    if (isOpen) {
      loadAvatar()
      // Load Profile
      const savedProfile = localStorage.getItem("clinic_profile_settings")
      if (savedProfile) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedProfile) })
        } catch (e) {
          console.error("Error loading profile settings", e)
        }
      }

      // Load Doctors
      const savedDocs = localStorage.getItem("clinic_doctors_list")
      if (savedDocs) {
        try {
          setDoctors(JSON.parse(savedDocs))
        } catch (e) {
          console.error("Error loading doctors list", e)
          setDoctors(DEFAULT_DOCTORS)
        }
      } else {
        localStorage.setItem("clinic_doctors_list", JSON.stringify(DEFAULT_DOCTORS))
        setDoctors(DEFAULT_DOCTORS)
      }
    }
  }, [isOpen])

  // Calculate dynamic link
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBookingLink(`${window.location.origin}/${tenant}/book`)
    }
  }, [tenant, isOpen])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAvatarSelect = (url: string) => {
    setAvatar(url)
    localStorage.setItem("clinic_user_avatar", url)
    window.dispatchEvent(new Event("clinic-avatar-updated"))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setAvatar(base64)
        localStorage.setItem("clinic_user_avatar", base64)
        window.dispatchEvent(new Event("clinic-avatar-updated"))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("clinic_profile_settings", JSON.stringify(settings))
    localStorage.setItem("clinic_doctors_list", JSON.stringify(doctors))
    if (avatar) {
      localStorage.setItem("clinic_user_avatar", avatar)
    }
    
    // Dispatch events to notify other modules
    window.dispatchEvent(new Event("clinic-profile-updated"))
    window.dispatchEvent(new Event("clinic-doctors-updated"))
    window.dispatchEvent(new Event("clinic-avatar-updated"))
    
    setIsOpen(false)
  }

  const updateField = (field: keyof ProfileSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddDoctorClick = () => {
    setEditingDoctorId(null)
    setDocName("")
    setDocSpecialty("")
    setDocDegrees("")
    setDocRegNo("")
    setDocTimings("Mon - Fri: 10:00 AM - 5:00 PM")
    setDocCharge("150")
    setIsDoctorFormOpen(true)
  }

  const handleEditDoctorClick = (doc: Doctor) => {
    setEditingDoctorId(doc.id)
    setDocName(doc.name)
    setDocSpecialty(doc.specialty)
    setDocDegrees(doc.degrees)
    setDocRegNo(doc.regNo)
    setDocTimings(doc.timings)
    setDocCharge(doc.charge.toString())
    setIsDoctorFormOpen(true)
  }

  // Helper: persist doctors list to localStorage and notify other components
  const persistDoctors = (updatedList: Doctor[]) => {
    try {
      localStorage.setItem("clinic_doctors_list", JSON.stringify(updatedList))
    } catch (e) {
      console.error("Failed to persist doctors list (storage quota may be exceeded)", e)
    }
    window.dispatchEvent(new Event("clinic-doctors-updated"))
  }

  const handleRemoveDoctor = (id: string) => {
    const docToDelete = doctors.find((d) => d.id === id)
    if (docToDelete) {
      // Check for active appointments
      try {
        const savedApts = localStorage.getItem("active_appointments")
        if (savedApts) {
          const activeApts = JSON.parse(savedApts)
          const hasActive = activeApts.some((a: any) => a.doctor === docToDelete.name)
          if (hasActive) {
            const confirmDelete = window.confirm(`Warning: ${docToDelete.name} has active appointments in the queue. Deleting them will leave those appointments with a missing provider. Are you sure you want to delete?`)
            if (!confirmDelete) return
          }
        }
      } catch (e) {
        console.error("Error checking active appointments during doctor deletion", e)
      }
    }

    setDoctors((prev) => {
      const updated = prev.filter((d) => d.id !== id)
      persistDoctors(updated)
      return updated
    })
  }

  const handleSaveDoctor = () => {
    if (!docName.trim() || !docDegrees.trim() || !docRegNo.trim()) return

    if (editingDoctorId) {
      // Update
      setDoctors((prev) => {
        const updated = prev.map((d) =>
          d.id === editingDoctorId
            ? {
                ...d,
                name: docName,
                specialty: docSpecialty,
                degrees: docDegrees,
                regNo: docRegNo,
                timings: docTimings,
                charge: Number(docCharge) || 150,
              }
            : d
        )
        persistDoctors(updated)
        return updated
      })
    } else {
      // Add
      const newDoc: Doctor = {
        id: `doc_${Date.now()}`,
        name: docName,
        specialty: docSpecialty,
        degrees: docDegrees,
        regNo: docRegNo,
        timings: docTimings,
        charge: Number(docCharge) || 150,
      }
      setDoctors((prev) => {
        const updated = [...prev, newDoc]
        persistDoctors(updated)
        return updated
      })
    }
    setIsDoctorFormOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <button className="focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full transition-transform hover:scale-105 active:scale-95 relative group cursor-pointer" />
      }>
        <div className="relative flex items-center gap-2.5 p-1 rounded-full bg-background/50 border border-white/20 dark:border-white/10 glass-panel shadow-sm">
          <div className="relative">
            {avatar ? (
              <img 
                src={avatar} 
                alt="Account Avatar" 
                className="size-10 rounded-full object-cover border-2 border-primary shadow-sm" 
              />
            ) : (
              <div className="size-10 bg-primary text-primary-foreground font-bold text-base rounded-full flex items-center justify-center border-2 border-primary shadow-sm">
                {settings.clinicName ? settings.clinicName.charAt(0) : "A"}
              </div>
            )}
            <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-background shadow-xs" title="Logged In" />
          </div>
          <div className="hidden sm:flex flex-col text-left pr-2">
            <span className="text-xs font-bold leading-none text-foreground">{doctors[0]?.name || settings.clinicName || "Account"}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              ● Online
            </span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-white max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary animate-spin-slow" /> Profile & Account Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account avatar, clinic details, doctor credentials, and external API integrations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-6 pt-4">
            <Tabs defaultValue="clinic" className="w-full pb-6">
            <TabsList 
              style={{ display: "grid", width: "100%", height: "auto" }}
              className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl h-auto"
            >
              <TabsTrigger value="clinic" className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg">
                <Building2 className="h-4 w-4" /> Clinic & Account
              </TabsTrigger>
              <TabsTrigger value="doctor" className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg">
                <User className="h-4 w-4" /> Doctors
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg">
                <Key className="h-4 w-4" /> Integrations
              </TabsTrigger>
            </TabsList>

            {/* Clinic Settings Tab */}
            <TabsContent value="clinic" className="space-y-5 outline-none">
              
              {/* Account Profile Picture Section */}
              <div className="p-4 rounded-2xl glass-panel border border-primary/20 bg-primary/5 space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary">Account Profile Picture</Label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    {avatar ? (
                      <img src={avatar} alt="Account Profile" className="size-16 rounded-full object-cover border-2 border-primary shadow-md" />
                    ) : (
                      <div className="size-16 bg-primary text-primary-foreground font-extrabold text-2xl rounded-full flex items-center justify-center border-2 border-primary">
                        D
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 size-4 bg-emerald-500 rounded-full border-2 border-background" title="Logged In" />
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="text-xs font-medium text-muted-foreground">Select a preset or upload your photo:</div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleAvatarSelect("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80")}
                        className="text-xs px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border hover:border-primary font-medium"
                      >
                        👩‍⚕️ Doctor F
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAvatarSelect("https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80")}
                        className="text-xs px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border hover:border-primary font-medium"
                      >
                        👨‍⚕️ Doctor M
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAvatarSelect("https://images.unsplash.com/photo-1594824813566-78a0d4c8290f?w=150&auto=format&fit=crop&q=80")}
                        className="text-xs px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border hover:border-primary font-medium"
                      >
                        🩺 Specialist
                      </button>

                      <label className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs hover:bg-primary/90">
                        Upload Custom Photo
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="clinicName"
                    value={settings.clinicName}
                    onChange={(e) => updateField("clinicName", e.target.value)}
                    className="pl-9 bg-slate-50/50"
                    placeholder="e.g. City Dental Clinic"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicPhone">Clinic Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="clinicPhone"
                    value={settings.clinicPhone}
                    onChange={(e) => updateField("clinicPhone", e.target.value)}
                    className="pl-9 bg-slate-50/50"
                    placeholder="e.g. +1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicAddress">Clinic Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="clinicAddress"
                    value={settings.clinicAddress}
                    onChange={(e) => updateField("clinicAddress", e.target.value)}
                    className="pl-9 bg-slate-50/50"
                    placeholder="e.g. 123 Health Ave, Medical District"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicHours">Clinic Operating Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="clinicHours"
                    value={settings.clinicHours}
                    onChange={(e) => updateField("clinicHours", e.target.value)}
                    className="pl-9 bg-slate-50/50"
                    placeholder="e.g. Mon - Sat: 9:00 AM - 7:00 PM"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clinicBio">Clinic Biography / Showcase Tagline</Label>
                <textarea
                  id="clinicBio"
                  value={settings.clinicBio}
                  onChange={(e) => updateField("clinicBio", e.target.value)}
                  className="w-full min-h-[80px] p-3 border rounded-md bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Tell patients about your clinic, services, and core mission..."
                />
              </div>

              <div className="mt-4 p-4 border border-dashed rounded-xl bg-blue-50/30 border-blue-100">
                <Label className="text-primary font-semibold block mb-1.5 text-xs uppercase tracking-wider">Public Booking & Showcase Link</Label>
                <div className="flex gap-2">
                  <Input value={bookingLink} readOnly className="bg-white font-mono text-xs select-all text-slate-600 flex-1 h-9" />
                  <Button type="button" onClick={copyToClipboard} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 shrink-0 text-xs flex items-center gap-1 h-9 px-3">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1.5 leading-relaxed">
                  Direct patients here from Google Maps (Google Business Profile), Instagram/Facebook bios, or SMS/WhatsApp cards.
                </span>
              </div>
            </TabsContent>

            {/* Doctor Settings Tab: Bento Grid Directory */}
            <TabsContent value="doctor" className="space-y-4 outline-none">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="font-bold text-slate-800">Clinic Practitioners ({doctors.length})</h3>
                  <Button 
                    type="button" 
                    onClick={handleAddDoctorClick} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 text-xs h-8 px-2.5"
                  >
                    <Plus className="h-4 w-4" /> Add Doctor
                  </Button>
                </div>

                {doctors.length === 0 ? (
                  <div className="text-center p-10 text-slate-500 italic border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-3 bg-slate-50/50 mt-4">
                    <div className="bg-slate-100 p-3 rounded-full text-slate-400">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <p>No doctors registered yet.</p>
                    <Button type="button" variant="link" onClick={handleAddDoctorClick} className="text-blue-600 p-0 h-auto font-semibold">
                      Click here to add your first practitioner
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {doctors.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="border border-slate-150 rounded-xl p-4 bg-slate-50 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all gap-3 relative group"
                      >
                        {/* Actions overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEditDoctorClick(doc)}
                            className="p-1 bg-white hover:bg-blue-50 border rounded text-slate-500 hover:text-blue-600 transition-colors"
                            title="Edit Credentials"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoctor(doc.id)}
                            className="p-1 bg-white hover:bg-red-50 border rounded text-slate-500 hover:text-red-600 transition-colors"
                            title="Remove Doctor"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3.5">
                          {/* Prominent Name & Avatar Box */}
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-sans text-sm">
                              {doc.name.replace("Dr. ", "").charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 leading-tight">{doc.name}</div>
                              <div className="text-xs text-slate-500 font-semibold">{doc.specialty || "Dental Surgeon"}</div>
                            </div>
                          </div>

                          {/* Credentials Accent Box */}
                          <div className="p-2.5 bg-blue-50/50 border border-blue-100/50 rounded-lg text-xs">
                            <span className="font-bold text-blue-800 block text-[9px] uppercase tracking-wider mb-0.5">Specialization & Degrees</span>
                            <span className="text-slate-650 font-medium">{doc.degrees}</span>
                          </div>

                          {/* License & Consultation Fee grid block */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-white border border-slate-200/60 rounded-lg">
                              <span className="font-semibold text-slate-400 block text-[8px] uppercase tracking-wider mb-0.5">License ID</span>
                              <span className="text-slate-700 font-bold">Reg #{doc.regNo}</span>
                            </div>
                            <div className="p-2 bg-white border border-slate-200/60 rounded-lg">
                              <span className="font-semibold text-slate-400 block text-[8px] uppercase tracking-wider mb-0.5">Consult Fee</span>
                              <span className="text-green-700 font-bold">${doc.charge}</span>
                            </div>
                          </div>

                          {/* Hours Highlight Box */}
                          <div className="p-2.5 bg-amber-50/60 border border-amber-100/70 rounded-lg text-xs">
                            <span className="font-bold text-amber-800 block text-[9px] uppercase tracking-wider mb-0.5">Consultation Hours</span>
                            <span className="text-slate-650 font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="h-3.5 w-3.5 text-amber-600" /> {doc.timings}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-dialog overlay for doctor details form */}
              <Dialog open={isDoctorFormOpen} onOpenChange={setIsDoctorFormOpen}>
                <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden rounded-xl border">
                  <DialogHeader className="p-5 pb-4 border-b bg-slate-50">
                    <DialogTitle className="text-lg font-bold text-slate-800">
                      {editingDoctorId ? "Edit Doctor Credentials" : "Register New Practitioner"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs mt-0.5">
                      Specify credentials, specializations, consulting schedules, and fees.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-name">Doctor Name</Label>
                        <Input 
                          id="subdoc-name" 
                          placeholder="e.g. Dr. Sarah Jenkins" 
                          value={docName} 
                          onChange={(e) => setDocName(e.target.value)}
                          className="bg-white h-9"
                          required
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-spec">Specialty Title</Label>
                        <Input 
                          id="subdoc-spec" 
                          placeholder="e.g. Orthodontist" 
                          value={docSpecialty} 
                          onChange={(e) => setDocSpecialty(e.target.value)}
                          className="bg-white h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-degrees">Degrees & Specializations</Label>
                        <Input 
                          id="subdoc-degrees" 
                          placeholder="e.g. BDS, MDS" 
                          value={docDegrees} 
                          onChange={(e) => setDocDegrees(e.target.value)}
                          className="bg-white h-9"
                          required
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-reg">License / Registration ID</Label>
                        <Input 
                          id="subdoc-reg" 
                          placeholder="e.g. 849201" 
                          value={docRegNo} 
                          onChange={(e) => setDocRegNo(e.target.value)}
                          className="bg-white h-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-timings">Consultation Timings</Label>
                        <Input 
                          id="subdoc-timings" 
                          placeholder="e.g. Mon - Fri: 10am - 5pm" 
                          value={docTimings} 
                          onChange={(e) => setDocTimings(e.target.value)}
                          className="bg-white h-9"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-charge">Consultation Fee ($)</Label>
                        <Input 
                          id="subdoc-charge" 
                          type="number"
                          placeholder="e.g. 150" 
                          value={docCharge} 
                          onChange={(e) => setDocCharge(e.target.value)}
                          className="bg-white h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="p-5 bg-slate-50 border-t flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDoctorFormOpen(false)}
                      className="h-9 text-xs font-semibold px-4"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleSaveDoctor} 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 text-xs px-4"
                    >
                      Save Doctor Details
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Integrations Settings Tab */}
            <TabsContent value="integrations" className="space-y-4 outline-none">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">WhatsApp Notifications</div>
                  <div className="text-xs text-slate-500">Enable automatic patient notifications</div>
                </div>
                <Switch 
                  checked={settings.whatsappEnabled} 
                  onCheckedChange={(checked) => updateField("whatsappEnabled", checked)}
                />
              </div>

              {settings.whatsappEnabled && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50/20">
                  <div className="space-y-2">
                    <Label htmlFor="qstashToken">QStash Token</Label>
                    <Input
                      id="qstashToken"
                      type="password"
                      value={settings.qstashToken}
                      onChange={(e) => updateField("qstashToken", e.target.value)}
                      className="bg-white"
                      placeholder="Enter QStash Token"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioSid">Twilio Account SID</Label>
                    <Input
                      id="twilioSid"
                      value={settings.twilioSid}
                      onChange={(e) => updateField("twilioSid", e.target.value)}
                      className="bg-white"
                      placeholder="Enter Twilio Account SID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioToken">Twilio Auth Token</Label>
                    <Input
                      id="twilioToken"
                      type="password"
                      value={settings.twilioToken}
                      onChange={(e) => updateField("twilioToken", e.target.value)}
                      className="bg-white"
                      placeholder="Enter Twilio Auth Token"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          </ScrollArea>

          <div className="flex justify-end gap-3 border-t px-6 py-4 bg-slate-50 shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="font-semibold bg-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={isDoctorFormOpen}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
