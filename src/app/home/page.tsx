"use client"

import { Building2, CheckCircle2, ShieldCheck, Zap, Stethoscope, Printer, MessageSquare } from "lucide-react"
import { AuthModal } from "@/components/AuthModal"
import { ThemeToggle } from "@/components/ThemeToggle"
import Image from "next/image"

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
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthModal triggerText="Sign In" triggerVariant="outline" defaultTab="login" />
          <AuthModal triggerText="Start Free Trial" triggerVariant="default" defaultTab="signup" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 lg:px-12 py-20 md:py-32 flex flex-col items-center text-center space-y-8 bg-background">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold border border-primary/20">
          <Zap className="size-4" /> Now with No-Typing E-Prescriptions
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl leading-tight">
          Run your clinic without the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">chaos.</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          The ultra-fast, intuitive clinic management platform. Book appointments, generate prescriptions, and send WhatsApp reminders in 3 clicks.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <AuthModal triggerText="Start your 14-day free trial" triggerVariant="default" defaultTab="signup" />
          <p className="text-xs sm:text-sm text-muted-foreground">No credit card required.</p>
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
      <section id="features" className="px-6 lg:px-12 py-24 bg-background">
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

      {/* Pricing Section */}
      <section id="pricing" className="px-6 lg:px-12 py-24 bg-background">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">Simple, transparent pricing.</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">One flat monthly fee. Unlimited patients, unlimited doctors.</p>
          </div>
          
          <div className="glass-panel rounded-3xl p-8 md:p-12 border border-black/10 dark:border-white/10 max-w-lg mx-auto flex flex-col items-center space-y-8 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-foreground">Pro Clinic Plan</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold text-primary">₹999</span>
                <span className="text-muted-foreground font-medium">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3 text-left w-full text-sm font-semibold text-foreground">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span>Unlimited Appointments & Patient Records</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span>E-Prescription Pad + Image Downloads</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span>1-Click WhatsApp Booking Notifications</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span>Multi-Doctor Calendar Support</span>
              </li>
            </ul>

            <AuthModal triggerText="Get Started Now" triggerVariant="default" defaultTab="signup" />
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
