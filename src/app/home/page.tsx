"use client"

import { Building2, CheckCircle2, ShieldCheck, Zap, Stethoscope, Printer, MessageSquare } from "lucide-react"
import { AuthModal } from "@/components/AuthModal"
import { ThemeToggle } from "@/components/ThemeToggle"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-50">
      
      {/* Navigation */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Image 
            src="/horizontal-logo.png" 
            alt="Clinic OS Logo" 
            width={180} 
            height={45} 
            className="h-10 w-auto object-contain"
            priority 
          />
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <AuthModal triggerText="Sign In" triggerVariant="outline" defaultTab="login" />
          <AuthModal triggerText="Start Free Trial" triggerVariant="default" defaultTab="signup" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 lg:px-12 py-24 md:py-32 flex flex-col items-center text-center space-y-8 bg-gradient-to-b from-white to-slate-50">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
          <Zap className="h-4 w-4" /> Now with No-Typing E-Prescriptions
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-tight">
          Run your clinic without the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">chaos.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
          The ultra-fast, intuitive clinic management platform. Book appointments, generate prescriptions, and send WhatsApp reminders in 3 clicks.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <AuthModal triggerText="Start your 14-day free trial" triggerVariant="default" defaultTab="signup" />
          <p className="text-sm text-slate-400 sm:ml-4">No credit card required.</p>
        </div>
        
        {/* Mock Dashboard Preview */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl bg-white overflow-hidden flex flex-col">
          <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="p-2 md:p-8 bg-slate-50 aspect-[16/9] flex items-center justify-center">
            <div className="text-slate-400 flex flex-col items-center gap-2">
              <Stethoscope className="h-16 w-16 opacity-50" />
              <p className="font-medium">Interactive Dashboard Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 lg:px-12 py-24 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything you need. Nothing you don't.</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Designed for speed. Say goodbye to bloated medical software that takes months to learn.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Intuitive & Simple</h3>
              <p className="text-slate-600">A clean, single-screen booking wizard. Zero learning curve for your front-desk staff.</p>
            </div>
            
            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Printer className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No-Typing Prescriptions</h3>
              <p className="text-slate-600">Checkboxes for common drugs. Auto-calculates doses and instantly generates a print-ready A4 PDF.</p>
            </div>
            
            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">WhatsApp Reminders</h3>
              <p className="text-slate-600">Automated immediate booking confirmations and day-of-treatment alerts to eliminate no-shows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 lg:px-12 py-24 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">Simple, transparent pricing.</h2>
            <p className="text-xl text-slate-400">One flat monthly fee. Unlimited patients, unlimited doctors.</p>
          </div>
          
          <div className="bg-slate-800 rounded-3xl p-8 md:p-12 border border-slate-700 max-w-lg mx-auto flex flex-col items-center space-y-8 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-slate-300">Pro Clinic Plan</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold">₹999</span>
                <span className="text-slate-400 font-medium">/month</span>
              </div>
            </div>
            
            <ul className="space-y-4 text-left w-full text-slate-300">
              <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Unlimited Patients & Appointments</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> E-Prescription Print Engine</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> WhatsApp Integration</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Dedicated Clinic Subdomain</li>
            </ul>
            
            <div className="w-full pt-4">
              <AuthModal triggerText="Get Started" triggerVariant="default" defaultTab="signup" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-12 bg-white border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Image 
            src="/horizontal-logo.png" 
            alt="Clinic OS Logo" 
            width={140} 
            height={35} 
            className="h-7 w-auto object-contain"
          />
        </div>
        <p className="text-sm">© {new Date().getFullYear()} Clinic OS Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
