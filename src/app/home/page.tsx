"use client"

import { Building2, CheckCircle2, ShieldCheck, Zap, Stethoscope, Printer, MessageSquare, BookOpen, Calendar, UserCheck, FilePlus, Smartphone, HelpCircle } from "lucide-react"
import { AuthModal } from "@/components/AuthModal"
import { ThemeToggle } from "@/components/ThemeToggle"
import Image from "next/image"

// Beta Phase Mode — matches server-side BETA_MODE flag
const BETA_MODE = true

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* Navigation */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between glass-panel border-b border-black/10 dark:border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Image 
            src="/horizontal-logo.png" 
            alt="Clinic OS Logo" 
            width={180} 
            height={45} 
            className="h-10 w-auto object-contain dark:brightness-200"
            priority 
          />
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#guide" className="hover:text-primary transition-colors">User Guide</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthModal triggerText="Sign In" triggerVariant="outline" defaultTab="login" />
          {!BETA_MODE && <AuthModal triggerText="Start Free Trial" triggerVariant="default" defaultTab="signup" />}
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 lg:px-12 py-20 md:py-32 flex flex-col items-center text-center space-y-8 bg-background">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold border border-primary/20">
          <Zap className="size-4" /> Now with No-Typing E-Prescriptions & X-Ray Uploads
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl leading-tight">
          Run your clinic without the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">chaos.</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          The ultra-fast, intuitive clinic management platform. Book appointments, attach X-rays, generate prescriptions, and send WhatsApp reminders in 3 clicks.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          {BETA_MODE ? (
            <>
              <AuthModal triggerText="Sign In to Dashboard" triggerVariant="default" defaultTab="login" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs">
                🔒 Beta Phase — Invite Only
              </div>
            </>
          ) : (
            <>
              <AuthModal triggerText="Start your 14-day free trial" triggerVariant="default" defaultTab="signup" />
              <p className="text-xs sm:text-sm text-muted-foreground">No credit card required.</p>
            </>
          )}
        </div>
        
        {/* Mock Dashboard Preview */}
        <div className="mt-12 w-full max-w-5xl rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl glass-panel overflow-hidden flex flex-col">
          <div className="h-10 bg-muted/50 border-b border-black/5 dark:border-white/5 flex items-center px-4 gap-2">
            <div className="size-3 rounded-full bg-destructive/60" />
            <div className="size-3 rounded-full bg-amber-400/60" />
            <div className="size-3 rounded-full bg-emerald-400/60" />
          </div>
          <div className="p-6 md:p-12 aspect-[16/9] flex items-center justify-center">
            <div className="text-muted-foreground flex flex-col items-center gap-3">
              <Stethoscope className="size-16 opacity-40 text-primary" />
              <p className="font-bold text-lg text-foreground">Interactive Dashboard Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 lg:px-12 py-24 bg-background border-b border-black/5 dark:border-white/5">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">Everything you need. Nothing you don't.</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">Designed for speed. Say goodbye to bloated medical software that takes months to learn.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 p-8 rounded-3xl glass-panel border border-black/10 dark:border-white/10">
              <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Intuitive & Simple</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">A clean, single-screen booking wizard. Zero learning curve for your front-desk staff.</p>
            </div>
            
            <div className="space-y-4 p-8 rounded-3xl glass-panel border border-black/10 dark:border-white/10">
              <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Printer className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No-Typing Prescriptions</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Checkboxes for common drugs. Auto-calculates doses and instantly generates a print-ready prescription card.</p>
            </div>
            
            <div className="space-y-4 p-8 rounded-3xl glass-panel border border-black/10 dark:border-white/10">
              <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <MessageSquare className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">WhatsApp Reminders</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Automated immediate booking confirmations and day-of-treatment alerts to eliminate no-shows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple User Guide / Documentation Section */}
      <section id="guide" className="px-6 lg:px-12 py-24 bg-background">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              <BookOpen className="size-3.5" /> Simple User Documentation
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">How to Use Clinic OS</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow these simple step-by-step instructions to manage your practice smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl glass-panel border border-black/10 dark:border-white/10 space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center text-lg shadow-md shrink-0">
                  1
                </div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="size-5 text-primary" /> Sign In to Your Clinic
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-14">
                Click the <strong>Sign In</strong> button on the top right. Enter your administrator email and password to access your dedicated clinic dashboard.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl glass-panel border border-black/10 dark:border-white/10 space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center text-lg shadow-md shrink-0">
                  2
                </div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="size-5 text-primary" /> Book Appointments & X-Rays
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-14">
                Click <strong>+ Book New Consultation</strong>. Fill in patient info, pick a doctor, choose date & time, and optionally attach patient X-rays or diagnostic reports before confirming.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl glass-panel border border-black/10 dark:border-white/10 space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center text-lg shadow-md shrink-0">
                  3
                </div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Stethoscope className="size-5 text-primary" /> Manage Patient Directory
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-14">
                Go to the <strong>Patient Directory</strong> tab to search any patient by name or phone. View their past visits, visual dental chart (odontogram), and drag & drop new X-Ray scans anytime.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-8 rounded-3xl glass-panel border border-black/10 dark:border-white/10 space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center text-lg shadow-md shrink-0">
                  4
                </div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FilePlus className="size-5 text-primary" /> Issue Fast E-Prescriptions
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-14">
                In the <strong>E-Prescription Pad</strong> tab, select common medications with simple checkboxes. The system auto-calculates dosages. Instantly download or print the digital prescription card.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-8 rounded-3xl glass-panel border border-black/10 dark:border-white/10 space-y-4 md:col-span-2 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-emerald-500 text-white font-extrabold flex items-center justify-center text-lg shadow-md shrink-0">
                  5
                </div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Smartphone className="size-5 text-emerald-500" /> WhatsApp Reminders & Contacting
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-14">
                Reach out to patients instantly with 1-click WhatsApp messaging directly from their profile or send manual appointment reminder notifications to keep patient attendance high.
              </p>
            </div>
          </div>

          <div className="text-center pt-6">
            <AuthModal triggerText="Sign In to Get Started" triggerVariant="default" defaultTab="login" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-12 border-t border-black/5 dark:border-white/5 text-center text-xs text-muted-foreground">
        © 2026 Clinic OS. All rights reserved. Built with precision for modern dental and medical practices.
      </footer>

    </div>
  )
}
