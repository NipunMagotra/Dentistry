"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Mail, Lock, User as UserIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate network delay for realistic demo
    setTimeout(() => {
      setIsLoading(false)
      setIsOpen(false)
      // Redirect to the dashboard. 
      // In Vercel demo mode, our middleware intercepts /demo-dashboard and rewrites to the tenant
      router.push("/demo-dashboard")
    }, 800)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} className={triggerVariant === "default" ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold" : ""} />}>
        {triggerText}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="text-center space-y-4 pt-4">
          <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900 text-center">
            {tab === "login" ? "Welcome back" : "Create your clinic"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {tab === "login" 
              ? "Enter your credentials to access your dashboard." 
              : "Start your 14-day free trial. No credit card required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {tab === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input id="clinicName" placeholder="Apollo Dental" className="pl-9" required />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input id="email" type="email" placeholder="admin@clinic.com" className="pl-9" required />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {tab === "login" && (
                <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input id="password" type="password" placeholder="••••••••" className="pl-9" required />
            </div>
          </div>

          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-6 h-11" disabled={isLoading}>
            {isLoading ? "Authenticating..." : tab === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-500 border-t pt-4">
          {tab === "login" ? (
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => setTab("signup")} className="text-blue-600 font-semibold hover:underline">
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" onClick={() => setTab("login")} className="text-blue-600 font-semibold hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
