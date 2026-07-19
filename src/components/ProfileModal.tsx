"use client"

import { useState, useEffect } from "react"
import { Building2, User, Settings, Phone, MapPin, Award, ShieldAlert, Key, Clock, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProfileSettings {
  clinicName: string
  clinicAddress: string
  clinicPhone: string
  clinicBio?: string
  clinicHours?: string
  doctorHours?: string
  doctorName: string
  doctorDegrees: string
  doctorRegNo: string
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
  doctorHours: "Mon - Fri: 10:00 AM - 5:00 PM",
  doctorName: "Dr. Sarah Jenkins",
  doctorDegrees: "BDS, MDS (Periodontics)",
  doctorRegNo: "849201",
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

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem("clinic_profile_settings")
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
      } catch (e) {
        console.error("Error loading settings", e)
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("clinic_profile_settings", JSON.stringify(settings))
    // Dispatch event to notify other components
    window.dispatchEvent(new Event("clinic-profile-updated"))
    setIsOpen(false)
  }

  const updateField = (field: keyof ProfileSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<button className="focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full transition-transform hover:scale-105 active:scale-95" />}>
        <User className="h-10 w-10 p-2 bg-slate-200 rounded-full text-slate-600 animate-pulse-subtle cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary animate-spin-slow" /> Profile & Account Settings
          </DialogTitle>
          <DialogDescription>
            Manage your clinic details, doctor credentials, and external API integrations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-4">
          <Tabs defaultValue="clinic" className="w-full">
            <TabsList 
              style={{ display: "grid", width: "100%" }}
              className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl"
            >
              <TabsTrigger value="clinic" className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg">
                <Building2 className="h-4 w-4" /> Clinic
              </TabsTrigger>
              <TabsTrigger value="doctor" className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg">
                <User className="h-4 w-4" /> Doctor
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg">
                <Key className="h-4 w-4" /> Integrations
              </TabsTrigger>
            </TabsList>

            {/* Clinic Settings Tab */}
            <TabsContent value="clinic" className="space-y-4 outline-none">
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

            {/* Doctor Settings Tab */}
            <TabsContent value="doctor" className="space-y-4 outline-none">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="doctorName"
                    value={settings.doctorName}
                    onChange={(e) => updateField("doctorName", e.target.value)}
                    className="pl-9 bg-slate-50/50"
                    placeholder="e.g. Dr. Sarah Jenkins"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorDegrees">Degrees & Specializations</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="doctorDegrees"
                    value={settings.doctorDegrees}
                    onChange={(e) => updateField("doctorDegrees", e.target.value)}
                    className="pl-9 bg-slate-50/50"
                    placeholder="e.g. BDS, MDS (Periodontics)"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorRegNo">Registration / License Number</Label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="doctorRegNo"
                    value={settings.doctorRegNo}
                    onChange={(e) => updateField("doctorRegNo", e.target.value)}
                    className="pl-9 bg-slate-50/50"
                    placeholder="e.g. 849201"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorHours">Doctor Consultation Hours / Timings</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="doctorHours"
                    value={settings.doctorHours}
                    onChange={(e) => updateField("doctorHours", e.target.value)}
                    className="pl-9 bg-slate-50/50"
                    placeholder="e.g. Mon - Fri: 10:00 AM - 5:00 PM"
                    required
                  />
                </div>
              </div>
            </TabsContent>

            {/* Integrations Settings Tab */}
            <TabsContent value="integrations" className="space-y-4 outline-none">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">WhatsApp Notifications</div>
                  <div className="text-xs text-slate-500">Enable automatic patient notifications</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.whatsappEnabled} 
                  onChange={(e) => updateField("whatsappEnabled", e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer rounded" 
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
                      placeholder="QSTASH_TOKEN"
                    />
                    <span className="text-[11px] text-slate-400">Used for background scheduling workflows.</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilioSid">Twilio Account SID</Label>
                    <Input
                      id="twilioSid"
                      value={settings.twilioSid}
                      onChange={(e) => updateField("twilioSid", e.target.value)}
                      className="bg-white"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
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
                      placeholder="Auth Token"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 justify-end border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/95">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
