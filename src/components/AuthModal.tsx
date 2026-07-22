"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Clock, Award, ShieldCheck, IndianRupee, ArrowRight, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthModalProps {
  triggerText: string
  triggerVariant?: "default" | "outline" | "ghost"
  defaultTab?: "login" | "signup"
}

export function AuthModal({ triggerText, triggerVariant = "default", defaultTab = "login" }: AuthModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<"login" | "signup">(defaultTab)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Login / Step 1 states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [clinicName, setClinicName] = useState("")

  // Step 2 states (Clinic Operational Info)
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [hours, setHours] = useState("Mon - Sat: 9:00 AM - 7:00 PM")

  // Step 3 states (Doctor Credentials)
  const [doctorName, setDoctorName] = useState("")
  const [degrees, setDegrees] = useState("")
  const [regNo, setRegNo] = useState("")
  const [charge, setCharge] = useState("500")

  const router = useRouter()

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (signupStep === 1) {
      if (!email || !password || !clinicName) return
      setSignupStep(2)
    } else if (signupStep === 2) {
      if (!phone || !address) return
      setSignupStep(3)
    }
  }

  const handleFinalSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Save full clinic profile & doctor credentials to local storage
    const profileSettings = {
      clinicName: clinicName.trim() || "My Dental Clinic",
      doctorName: doctorName.trim() || "Dr. Administrator",
      clinicPhone: phone.trim() || "+91 9876543210",
      clinicAddress: address.trim() || "Medical Center",
      clinicHours: hours.trim() || "Mon - Sat: 9:00 AM - 7:00 PM",
      clinicBio: `Leading clinic offering modern, painless treatments.`,
      whatsappEnabled: false,
      doctorDegrees: degrees.trim() || "BDS",
      doctorRegNo: regNo.trim() || "100200"
    }

    const doctorItem = {
      id: `doc_${Date.now()}`,
      name: doctorName.trim() || "Dr. Administrator",
      specialty: "Dental Surgeon",
      degrees: degrees.trim() || "BDS",
      regNo: regNo.trim() || "100200",
      timings: hours.trim() || "Mon - Sat: 9:00 AM - 7:00 PM",
      charge: Number(charge) || 500
    }

    try {
      localStorage.setItem("clinic_account_email", email)
      localStorage.setItem("clinic_profile_settings", JSON.stringify(profileSettings))
      localStorage.setItem("clinic_doctors_list", JSON.stringify([doctorItem]))
      window.dispatchEvent(new Event("clinic-profile-updated"))
      window.dispatchEvent(new Event("clinic-doctors-updated"))
    } catch (err) {
      console.error("Failed to save onboarding credentials", err)
    }

    setTimeout(() => {
      setIsLoading(false)
      setIsOpen(false)
      const tenantId = clinicName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") || "my-clinic"
      router.push(`/${tenantId}`)
    }, 600)
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (email) {
      localStorage.setItem("clinic_account_email", email)
      window.dispatchEvent(new Event("clinic-profile-updated"))
    }

    setTimeout(() => {
      setIsLoading(false)
      setIsOpen(false)
      const savedProfile = localStorage.getItem("clinic_profile_settings")
      let tenantId = "apollo-dental"
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile)
          if (parsed.clinicName) {
            tenantId = parsed.clinicName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
          }
        } catch (err) {}
      }
      router.push(`/${tenantId}`)
    }, 600)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) setSignupStep(1)
    }}>
      <DialogTrigger render={<Button variant={triggerVariant} className={triggerVariant === "default" ? "bg-primary text-primary-foreground font-semibold rounded-full shadow-md" : "rounded-full"} />}>
        {triggerText}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-w-[95vw] glass-panel p-6 border border-white/40 dark:border-white/10 rounded-3xl shadow-2xl">
        <DialogHeader className="text-center space-y-2 pt-2">
          <div className="mx-auto flex items-center justify-center p-3 bg-primary/10 rounded-2xl size-14">
            <Image 
              src="/square-logo.png" 
              alt="Clinic OS Logo" 
              width={48} 
              height={48} 
              className="size-10 object-contain" 
            />
          </div>
          <DialogTitle className="text-2xl font-extrabold text-foreground text-center">
            {tab === "login" 
              ? "Welcome back" 
              : signupStep === 1 
                ? "Create Your Practice Account" 
                : signupStep === 2 
                  ? "Clinic Information" 
                  : "Practitioner Credentials"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {tab === "login" 
              ? "Enter your credentials to access your clinic dashboard." 
              : signupStep === 1 
                ? "Step 1 of 3: Account login details and clinic name." 
                : signupStep === 2 
                  ? "Step 2 of 3: Contact and operational hours." 
                  : "Step 3 of 3: Lead doctor qualifications & fees."}
          </DialogDescription>
        </DialogHeader>

        {/* --- LOGIN FORM --- */}
        {tab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="admin@clinic.com" 
                  className="pl-10" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <a href="#" className="text-xs text-primary font-semibold hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <Input 
                  id="login-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pl-10 pr-10" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold mt-4 h-11 rounded-full shadow-lg shadow-primary/25" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign In to Dashboard"}
            </Button>
          </form>
        ) : (
          /* --- MULTI-STEP SIGNUP FORM --- */
          <div className="py-2">
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`h-2 rounded-full transition-all duration-300 ${signupStep === 1 ? "w-8 bg-primary" : "w-2 bg-muted"}`} />
              <div className={`h-2 rounded-full transition-all duration-300 ${signupStep === 2 ? "w-8 bg-primary" : "w-2 bg-muted"}`} />
              <div className={`h-2 rounded-full transition-all duration-300 ${signupStep === 3 ? "w-8 bg-primary" : "w-2 bg-muted"}`} />
            </div>

            {/* STEP 1: Account Credentials & Clinic Name */}
            {signupStep === 1 && (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-clinic">Clinic Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input 
                      id="signup-clinic" 
                      placeholder="e.g. City Dental Clinic" 
                      className="pl-10" 
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Admin Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="doctor@clinic.com" 
                      className="pl-10" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input 
                      id="signup-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold mt-4 h-11 rounded-full shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
                  Next: Clinic Details <ArrowRight className="size-4" />
                </Button>
              </form>
            )}

            {/* STEP 2: Clinic Operational Info */}
            {signupStep === 2 && (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-phone">Clinic Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input 
                      id="signup-phone" 
                      placeholder="e.g. +91 9876543210" 
                      className="pl-10" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-address">Clinic Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input 
                      id="signup-address" 
                      placeholder="e.g. 123 Health Ave, Medical District" 
                      className="pl-10" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-hours">Operating Hours</Label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input 
                      id="signup-hours" 
                      placeholder="e.g. Mon - Sat: 9:00 AM - 7:00 PM" 
                      className="pl-10" 
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setSignupStep(1)} className="rounded-full flex-1">
                    <ArrowLeft className="size-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold rounded-full h-10 flex items-center justify-center gap-2">
                    Next: Doctor Credentials <ArrowRight className="size-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3: Doctor Credentials */}
            {signupStep === 3 && (
              <form onSubmit={handleFinalSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-docname">Lead Doctor / Practitioner Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input 
                      id="signup-docname" 
                      placeholder="e.g. Dr. Sarah Jenkins" 
                      className="pl-10" 
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-degrees">Degrees</Label>
                    <Input 
                      id="signup-degrees" 
                      placeholder="e.g. BDS, MDS" 
                      value={degrees}
                      onChange={(e) => setDegrees(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-reg">Medical License ID</Label>
                    <Input 
                      id="signup-reg" 
                      placeholder="e.g. 849201" 
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-charge">Consultation Fee (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input 
                      id="signup-charge" 
                      type="number"
                      placeholder="e.g. 500" 
                      className="pl-10" 
                      value={charge}
                      onChange={(e) => setCharge(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setSignupStep(2)} className="rounded-full flex-1">
                    <ArrowLeft className="size-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-extrabold rounded-full h-11 shadow-lg shadow-primary/25" disabled={isLoading}>
                    {isLoading ? "Setting up..." : "Complete Setup & Launch"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground border-t border-black/5 dark:border-white/5 pt-4">
          {tab === "login" ? (
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => { setTab("signup"); setSignupStep(1); }} className="text-primary font-bold hover:underline">
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" onClick={() => { setTab("login"); setSignupStep(1); }} className="text-primary font-bold hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
