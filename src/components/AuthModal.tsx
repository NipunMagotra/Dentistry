"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ClinicLogo } from "@/components/ClinicLogo"
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
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Save session email to localStorage for active login display
    if (email) {
      localStorage.setItem("clinic_account_email", email)
      window.dispatchEvent(new Event("clinic-profile-updated"))
    }
    
    // Simulate network delay and redirect
    setTimeout(() => {
      setIsLoading(false)
      setIsOpen(false)
      
      const clinicInput = document.getElementById("clinicName") as HTMLInputElement | null
      const clinicName = clinicInput?.value 
        ? clinicInput.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") 
        : "apollo-dental"

      router.push(`/${clinicName}`)
    }, 600)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} className={triggerVariant === "default" ? "bg-primary text-primary-foreground font-semibold rounded-full shadow-md" : "rounded-full"} />}>
        {triggerText}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-panel p-6 border border-white/40 dark:border-white/10 rounded-3xl">
        <DialogHeader className="text-center space-y-3 pt-2">
          <div className="mx-auto flex items-center justify-center">
            <ClinicLogo size="lg" />
          </div>
          <DialogTitle className="text-2xl font-extrabold text-foreground text-center">
            {tab === "login" ? "Welcome back" : "Create your clinic"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {tab === "login" 
              ? "Enter your credentials to access your clinic dashboard." 
              : "Start your 14-day free trial. No credit card required."}
          </DialogDescription>
        </DialogHeader>

        {/* Standard Form configured for browser Save Password detection */}
        <form action="#" method="post" onSubmit={handleSubmit} className="space-y-4 py-3">
          {tab === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="clinicName">Clinic Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <Input 
                  id="clinicName" 
                  name="clinicName"
                  placeholder="Apollo Dental" 
                  className="pl-10" 
                  required 
                />
              </div>
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <Input 
                id="email" 
                name="username"
                type="email" 
                autoComplete="username"
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
              <Label htmlFor="password">Password</Label>
              {tab === "login" && (
                <a href="#" className="text-xs text-primary font-semibold hover:underline">Forgot password?</a>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <Input 
                id="password" 
                name="password"
                type={showPassword ? "text" : "password"} 
                autoComplete={tab === "login" ? "current-password" : "new-password"}
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
                <span className="sr-only">Toggle password visibility</span>
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold mt-6 h-11 rounded-full shadow-lg shadow-primary/25" disabled={isLoading}>
            {isLoading ? "Authenticating..." : tab === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground border-t border-black/5 dark:border-white/5 pt-4">
          {tab === "login" ? (
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => setTab("signup")} className="text-primary font-bold hover:underline">
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" onClick={() => setTab("login")} className="text-primary font-bold hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
