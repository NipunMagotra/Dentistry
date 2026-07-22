"use client"

import { useState, useEffect } from "react"
import { Building2, Phone, MapPin, Clock, Key, Check, Settings, Copy, User, Plus, Trash2, Pencil, Stethoscope } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const DEFAULT_DOCTORS = [
  { id: "1", name: "Dr. Sarah Jenkins", specialty: "Periodontics", degrees: "BDS, MDS (Periodontics)", regNo: "849201", timings: "Mon - Sat: 9:00 AM - 5:00 PM", charge: 150 },
  { id: "2", name: "Dr. Michael Chen", specialty: "Prosthodontics", degrees: "DDS, MS (Prosthodontics)", regNo: "732910", timings: "Mon - Fri: 10:00 AM - 6:00 PM", charge: 200 },
  { id: "3", name: "Dr. Emily Rodriguez", specialty: "Pediatric Dentistry", degrees: "DDS, MSD (Pedodontics)", regNo: "918273", timings: "Tue - Sun: 9:00 AM - 4:00 PM", charge: 180 }
]

interface ProfileModalProps {
  tenant: string
}

export function ProfileModal({ tenant }: ProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [avatar, setAvatar] = useState<string>("")
  
  // Profile settings state
  const [settings, setSettings] = useState({
    clinicName: "City Dental Clinic",
    doctorName: "Dr. Sarah Jenkins",
    clinicPhone: "+1 (555) 123-4567",
    clinicAddress: "123 Health Avenue, Medical District",
    clinicHours: "Mon - Sat: 9:00 AM - 7:00 PM",
    clinicBio: "Leading dental health & aesthetic surgery center specializing in pain-free root canals and modern dental implants.",
    whatsappEnabled: false,
    qstashToken: "",
    twilioSid: "",
    twilioToken: "",
  })

  // Dynamic Doctors List State
  const [doctors, setDoctors] = useState<any[]>(DEFAULT_DOCTORS)

  // Sub-dialog state for Add/Edit Doctor
  const [isDoctorFormOpen, setIsDoctorFormOpen] = useState(false)
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null)
  const [docName, setDocName] = useState("")
  const [docSpecialty, setDocSpecialty] = useState("")
  const [docDegrees, setDocDegrees] = useState("")
  const [docRegNo, setDocRegNo] = useState("")
  const [docTimings, setDocTimings] = useState("")
  const [docCharge, setDocCharge] = useState("")

  // Load saved settings & doctors list
  useEffect(() => {
    const savedAvatar = localStorage.getItem("clinic_account_avatar")
    if (savedAvatar) setAvatar(savedAvatar)

    const saved = localStorage.getItem("clinic_profile_settings")
    if (saved) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }))
      } catch (e) {
        console.error("Failed to parse saved clinic settings", e)
      }
    }

    const savedDocs = localStorage.getItem("clinic_doctors_list")
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDoctors(parsed)
        }
      } catch (e) {
        console.error("Failed to parse saved doctors list", e)
      }
    }
  }, [isOpen])

  const updateField = (field: string, value: any) => {
    setSettings((prev) => {
      const updated = { ...prev, [field]: value }
      try {
        localStorage.setItem("clinic_profile_settings", JSON.stringify(updated))
        window.dispatchEvent(new Event("clinic-profile-updated"))
      } catch (e) {
        console.error(e)
      }
      return updated
    })
  }

  const handleAvatarSelect = (url: string) => {
    setAvatar(url)
    localStorage.setItem("clinic_account_avatar", url)
    window.dispatchEvent(new Event("clinic-profile-updated"))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return
      
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height
        const maxDim = 300

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8)
          setAvatar(compressedDataUrl)
          try {
            localStorage.setItem("clinic_account_avatar", compressedDataUrl)
          } catch (storageErr) {
            console.error("[Storage] Failed to save avatar image", storageErr)
          }
          window.dispatchEvent(new Event("clinic-profile-updated"))
        }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      localStorage.setItem("clinic_profile_settings", JSON.stringify(settings))
      localStorage.setItem("clinic_doctors_list", JSON.stringify(doctors))
      window.dispatchEvent(new Event("clinic-profile-updated"))
      window.dispatchEvent(new Event("clinic-doctors-updated"))
      setIsOpen(false)
    } catch (e) {
      console.error("[Storage] Storage quota exceeded or disabled", e)
      setIsOpen(false)
    }
  }

  // Doctor Management CRUD functions
  const handleAddDoctorClick = () => {
    setEditingDoctorId(null)
    setDocName("")
    setDocSpecialty("")
    setDocDegrees("")
    setDocRegNo("")
    setDocTimings("Mon - Sat: 9:00 AM - 5:00 PM")
    setDocCharge("150")
    setIsDoctorFormOpen(true)
  }

  const handleEditDoctorClick = (doc: any) => {
    setEditingDoctorId(doc.id)
    setDocName(doc.name)
    setDocSpecialty(doc.specialty || "")
    setDocDegrees(doc.degrees || "")
    setDocRegNo(doc.regNo || "")
    setDocTimings(doc.timings || "Mon - Sat: 9:00 AM - 5:00 PM")
    setDocCharge(doc.charge ? String(doc.charge) : "150")
    setIsDoctorFormOpen(true)
  }

  const handleSaveDoctor = () => {
    if (!docName.trim()) return

    setDoctors((prev) => {
      let updated: any[]
      if (editingDoctorId) {
        updated = prev.map((d) =>
          d.id === editingDoctorId
            ? {
                ...d,
                name: docName.trim(),
                specialty: docSpecialty.trim(),
                degrees: docDegrees.trim(),
                regNo: docRegNo.trim(),
                timings: docTimings.trim(),
                charge: Number(docCharge) || 150
              }
            : d
        )
      } else {
        const newDoc = {
          id: `doc_${Date.now()}`,
          name: docName.trim(),
          specialty: docSpecialty.trim() || "General Practitioner",
          degrees: docDegrees.trim() || "BDS",
          regNo: docRegNo.trim() || "100200",
          timings: docTimings.trim() || "Mon - Sat: 9:00 AM - 5:00 PM",
          charge: Number(docCharge) || 150
        }
        updated = [...prev, newDoc]
      }
      try {
        localStorage.setItem("clinic_doctors_list", JSON.stringify(updated))
        window.dispatchEvent(new Event("clinic-doctors-updated"))
      } catch (e) {
        console.error(e)
      }
      return updated
    })

    setIsDoctorFormOpen(false)
  }

  const handleRemoveDoctor = (id: string) => {
    setDoctors((prev) => {
      const updated = prev.filter((d) => d.id !== id)
      try {
        localStorage.setItem("clinic_doctors_list", JSON.stringify(updated))
        window.dispatchEvent(new Event("clinic-doctors-updated"))
      } catch (e) {
        console.error(e)
      }
      return updated
    })
  }

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const bookingLink = `${origin}/${tenant}/book`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel hover:border-primary/50 transition-all cursor-pointer shadow-xs border border-white/40 dark:border-white/10">
          <div className="relative">
            {avatar ? (
              <img 
                src={avatar} 
                alt="Account Avatar" 
                className="size-8 rounded-full object-cover border-2 border-primary shadow-xs" 
              />
            ) : (
              <div className="size-8 bg-primary text-primary-foreground font-extrabold text-sm rounded-full flex items-center justify-center border-2 border-primary shadow-xs">
                {settings.clinicName ? settings.clinicName.charAt(0) : "A"}
              </div>
            )}
            <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-background shadow-xs" title="Logged In" />
          </div>
          <div className="hidden sm:flex flex-col text-left pr-2">
            <span className="text-xs font-bold leading-none text-foreground">{settings.doctorName || doctors[0]?.name || "Account"}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              ● Online
            </span>
          </div>
        </div>
      } />
      <DialogContent className="sm:max-w-xl max-w-[95vw] glass-panel rounded-3xl border border-white/40 dark:border-white/10 max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        
        {/* Header (Always Visible) */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/5 dark:border-white/5 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Settings className="size-6 text-primary" /> Profile & Account Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage your account avatar, clinic details, doctor credentials, and external API integrations.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[60vh]">
            <Tabs defaultValue="clinic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 glass-panel border border-black/5 dark:border-white/5 p-1 rounded-full">
              <TabsTrigger value="clinic" className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-full">
                <Building2 className="size-4" /> Clinic
              </TabsTrigger>
              <TabsTrigger value="doctor" className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-full">
                <User className="size-4" /> Doctors
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-full">
                <Key className="size-4" /> Integrations
              </TabsTrigger>
            </TabsList>

            {/* Clinic Settings Tab */}
            <TabsContent value="clinic" className="space-y-4 outline-none">
              
              {/* Account Profile Picture Section */}
              <div className="p-4 rounded-2xl glass-panel border border-primary/20 bg-primary/5 space-y-3">
                <Label className="text-xs font-extrabold uppercase tracking-widest text-primary">Account Profile Picture</Label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
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
                        className="text-xs px-3 py-1 rounded-full glass-panel border border-black/10 dark:border-white/10 hover:border-primary font-bold"
                      >
                        👩‍⚕️ Doctor F
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAvatarSelect("https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80")}
                        className="text-xs px-3 py-1 rounded-full glass-panel border border-black/10 dark:border-white/10 hover:border-primary font-bold"
                      >
                        👨‍⚕️ Doctor M
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAvatarSelect("https://images.unsplash.com/photo-1594824813566-78a0d4c8290f?w=150&auto=format&fit=crop&q=80")}
                        className="text-xs px-3 py-1 rounded-full glass-panel border border-black/10 dark:border-white/10 hover:border-primary font-bold"
                      >
                        🩺 Specialist
                      </button>

                      <label className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold cursor-pointer shadow-xs hover:bg-primary/90">
                        Upload Custom Photo
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="clinicName"
                    value={settings.clinicName}
                    onChange={(e) => updateField("clinicName", e.target.value)}
                    className="pl-10"
                    placeholder="e.g. City Dental Clinic"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doctorName">Doctor / Account Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="doctorName"
                    value={settings.doctorName || ""}
                    onChange={(e) => updateField("doctorName", e.target.value)}
                    className="pl-10"
                    placeholder="e.g. Dr. Sarah Jenkins"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clinicPhone">Clinic Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="clinicPhone"
                    value={settings.clinicPhone}
                    onChange={(e) => updateField("clinicPhone", e.target.value)}
                    className="pl-10"
                    placeholder="e.g. +1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clinicAddress">Clinic Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="clinicAddress"
                    value={settings.clinicAddress}
                    onChange={(e) => updateField("clinicAddress", e.target.value)}
                    className="pl-10"
                    placeholder="e.g. 123 Health Ave, Medical District"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clinicHours">Clinic Operating Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="clinicHours"
                    value={settings.clinicHours}
                    onChange={(e) => updateField("clinicHours", e.target.value)}
                    className="pl-10"
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
                  className="w-full min-h-[80px] p-3 rounded-2xl glass-panel border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 text-foreground"
                  placeholder="Tell patients about your clinic, services, and core mission..."
                />
              </div>

              <div className="mt-4 p-4 rounded-2xl glass-panel border border-primary/20 bg-primary/5">
                <Label className="text-primary font-bold block mb-1.5 text-xs uppercase tracking-wider">Public Booking & Showcase Link</Label>
                <div className="flex gap-2">
                  <Input value={bookingLink} readOnly className="font-mono text-xs select-all text-foreground flex-1 h-9 rounded-full" />
                  <Button type="button" onClick={copyToClipboard} size="sm" className="bg-primary text-primary-foreground font-bold shrink-0 text-xs flex items-center gap-1 h-9 px-4 rounded-full">
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Doctor Settings Tab: Bento Grid Directory */}
            <TabsContent value="doctor" className="space-y-4 outline-none">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
                  <h3 className="font-extrabold text-foreground text-sm sm:text-base">Clinic Practitioners ({doctors.length})</h3>
                  <Button 
                    type="button" 
                    onClick={handleAddDoctorClick} 
                    className="bg-primary text-primary-foreground font-bold flex items-center gap-1 text-xs h-8 px-3 rounded-full"
                  >
                    <Plus className="size-4" /> Add Doctor
                  </Button>
                </div>

                {doctors.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground text-xs italic border border-dashed border-black/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-3">
                    <Stethoscope className="size-6 text-muted-foreground" />
                    <p>No doctors registered yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {doctors.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="rounded-2xl p-4 glass-panel border border-black/10 dark:border-white/10 flex flex-col justify-between hover:shadow-md transition-all gap-3 relative group"
                      >
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditDoctorClick(doc)}
                            className="p-1 rounded-full glass-panel text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit Credentials"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoctor(doc.id)}
                            className="p-1 rounded-full glass-panel text-destructive hover:opacity-80 transition-colors"
                            title="Remove Doctor"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm border border-primary/20">
                              {doc.name.replace("Dr. ", "").charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-foreground leading-tight text-sm sm:text-base">{doc.name}</div>
                              <div className="text-xs text-muted-foreground font-semibold">{doc.specialty || "Dental Surgeon"}</div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-xl text-xs">
                            <span className="font-bold text-primary block text-[9px] uppercase tracking-wider mb-0.5">Degrees</span>
                            <span className="text-foreground font-medium">{doc.degrees}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 glass-panel border border-black/5 dark:border-white/5 rounded-xl">
                              <span className="font-semibold text-muted-foreground block text-[8px] uppercase tracking-wider mb-0.5">License ID</span>
                              <span className="text-foreground font-bold">Reg #{doc.regNo}</span>
                            </div>
                            <div className="p-2 glass-panel border border-black/5 dark:border-white/5 rounded-xl">
                              <span className="font-semibold text-muted-foreground block text-[8px] uppercase tracking-wider mb-0.5">Consult Fee</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{doc.charge}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-dialog overlay for doctor details form */}
              <Dialog open={isDoctorFormOpen} onOpenChange={setIsDoctorFormOpen}>
                <DialogContent className="sm:max-w-md max-w-[95vw] glass-panel p-6 rounded-3xl border border-white/40 dark:border-white/10">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-lg font-extrabold text-foreground">
                      {editingDoctorId ? "Edit Doctor Credentials" : "Register New Practitioner"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Specify credentials, specializations, consulting schedules, and fees.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-3 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-name">Doctor Name</Label>
                        <Input 
                          id="subdoc-name" 
                          placeholder="e.g. Dr. Sarah Jenkins" 
                          value={docName} 
                          onChange={(e) => setDocName(e.target.value)}
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
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-degrees">Degrees</Label>
                        <Input 
                          id="subdoc-degrees" 
                          placeholder="e.g. BDS, MDS" 
                          value={docDegrees} 
                          onChange={(e) => setDocDegrees(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-reg">License / Reg ID</Label>
                        <Input 
                          id="subdoc-reg" 
                          placeholder="e.g. 849201" 
                          value={docRegNo} 
                          onChange={(e) => setDocRegNo(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-timings">Timings</Label>
                        <Input 
                          id="subdoc-timings" 
                          placeholder="e.g. Mon - Fri: 10am - 5pm" 
                          value={docTimings} 
                          onChange={(e) => setDocTimings(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="subdoc-charge">Consult Fee (₹)</Label>
                        <Input 
                          id="subdoc-charge" 
                          type="number"
                          placeholder="e.g. 150" 
                          value={docCharge} 
                          onChange={(e) => setDocCharge(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDoctorFormOpen(false)}
                      className="rounded-full w-full sm:w-auto font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleSaveDoctor} 
                      className="rounded-full w-full sm:w-auto bg-primary text-primary-foreground font-bold shadow-md"
                    >
                      Save Doctor Details
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Integrations Settings Tab */}
            <TabsContent value="integrations" className="space-y-4 outline-none">
              <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-black/5 dark:border-white/5">
                <div>
                  <div className="font-bold text-foreground text-sm">WhatsApp Notifications</div>
                  <div className="text-xs text-muted-foreground">Enable automatic patient notifications</div>
                </div>
                <Switch 
                  checked={settings.whatsappEnabled} 
                  onCheckedChange={(checked) => updateField("whatsappEnabled", checked)}
                />
              </div>

              {settings.whatsappEnabled && (
                <div className="space-y-4 p-4 rounded-2xl glass-panel border border-primary/20 bg-primary/5">
                  <div className="space-y-1.5">
                    <Label htmlFor="qstashToken">QStash Token</Label>
                    <Input
                      id="qstashToken"
                      type="password"
                      value={settings.qstashToken}
                      onChange={(e) => updateField("qstashToken", e.target.value)}
                      placeholder="Enter QStash Token"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="twilioSid">Twilio Account SID</Label>
                    <Input
                      id="twilioSid"
                      value={settings.twilioSid}
                      onChange={(e) => updateField("twilioSid", e.target.value)}
                      placeholder="Enter Twilio Account SID"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="twilioToken">Twilio Auth Token</Label>
                    <Input
                      id="twilioToken"
                      type="password"
                      value={settings.twilioToken}
                      onChange={(e) => updateField("twilioToken", e.target.value)}
                      placeholder="Enter Twilio Auth Token"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          </div>

          {/* Sticky Bottom Footer - ALWAYS visible pinned at bottom */}
          <div className="p-4 border-t border-black/5 dark:border-white/5 bg-background/95 backdrop-blur-md shrink-0 flex flex-col sm:flex-row justify-end gap-3.5 z-20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="rounded-full w-full sm:w-auto font-semibold"
            >
              Close
            </Button>
            <Button 
              type="submit" 
              className="rounded-full w-full sm:w-auto bg-primary text-primary-foreground font-extrabold px-8 shadow-md"
              disabled={isDoctorFormOpen}
            >
              Save & Close
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
