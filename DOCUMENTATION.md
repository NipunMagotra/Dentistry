# Clinic OS — Comprehensive Documentation

This document serves as the absolute source of truth for the Clinic OS platform (v1.3.0). It covers the technology stack, application architecture, routing structure, data persistence models, messaging pipeline, and core asynchronous workflows.

---

## 1. 🛠️ Technology Stack

Clinic OS is a modern, client-side-heavy single-page application (SPA) built on the bleeding edge of the React ecosystem.

### Core Frameworks
- **Framework:** [Next.js 16.2.10](https://nextjs.org/) (App Router + Turbopack)
- **UI Library:** [React 19.2.4](https://react.dev/)
- **Language:** TypeScript
- **Bundler:** Turbopack

### Styling & UI
- **Styling Engine:** Tailwind CSS v4
- **Component Library:** [Shadcn UI](https://ui.shadcn.com/) (Headless accessible components via Radix/Base UI)
- **Icons:** Lucide React
- **Typography:** Google Fonts (Outfit)

### Specialized Utilities
- **Workflow & Queues:** [@upstash/workflow](https://upstash.com/docs/workflow/getstarted) (Durable execution for SMS/WhatsApp)
- **WhatsApp Gateway:** Baileys / WhatsApp Web JS microservice (`scripts/whatsapp-gateway.js`)
- **Image Generation:** `html-to-image` (Client-side DOM to PNG rendering for prescriptions)
- **Date Formatting:** `date-fns`

---

## 2. 🗺️ Application Routing (Next.js App Router)

The application uses **Tenant-Based Dynamic Routing** powered by Next.js 16 Proxy Middleware. 

### Middleware Proxy (`src/proxy.ts`)
Intercepts all incoming requests and features a **Dual-Mode Router** to support both production domains and Vercel staging environments:
- **Custom Domain Mode**: Extracts the tenant from the wildcard subdomain (e.g., `apollo-dental.yoursaas.com` ➔ `tenant: apollo-dental`).
- **Vercel Staging Mode**: If accessing via `.vercel.app` or `localhost`, it automatically falls back to path-based routing (e.g., `yoursaas.vercel.app/apollo-dental` ➔ `tenant: apollo-dental`).
- In both cases, the middleware signs a secure HTTP-only JWT (`tenant_session`) containing the `tenant_id` and explicitly sets the `x-tenant-id` header for strict Server Action and RLS authentication.
- Prevents Edge CDN cross-tenant cache leaks by attaching `Vary: Host, x-tenant-id` and `Cache-Control: private, no-cache, no-store, must-revalidate`.

### Pages
1. **Marketing / Landing Page** (`src/app/home/...`)
   - *Status:* Root domain entry point.
2. **Main Clinic Dashboard** (`src/app/[tenant]/page.tsx`)
   - *Purpose:* The central operating system for receptionists and doctors.
   - *Features:* Active appointment queue, Bento grid stat cards, and tabbed navigation.
3. **Public Booking Portal** (`src/app/[tenant]/book/page.tsx`)
   - *Purpose:* The public-facing link clinics share with patients (e.g., via Instagram/WhatsApp) to schedule visits.
4. **Upstash Notification Webhook** (`src/app/api/workflow/route.ts`)
   - *Purpose:* Background API route executed by QStash to handle durable delays, Twilio SMS, and WhatsApp dispatches.

---

## 3. 🗃️ Data Persistence & Security

The application is fully integrated with a production-grade **Firebase Cloud Firestore** NoSQL backend.

### The Security Pillars
1. **Multi-Tenant Data Isolation**: Every clinic tenant operates under an isolated sub-collection hierarchy (`/clinics/{tenantId}/...`). `getTenantDb()` reads the `x-tenant-id` header passed from middleware to scope all queries automatically.
2. **AES-256-GCM Encryption**: Sensitive medical fields (e.g., `sensitive_notes` on prescriptions) are encrypted at rest using Node's native `crypto` library before being written to Firestore.
3. **Firestore Security Rules**: Configured in `firestore.rules` for strict document path access control (`allow read, write: if false;` zero-trust server-only access).
4. **Audit & Verification**: Verification script (`scripts/verify-dr.ts`) validates tenant sub-collection isolation and encryption.

### Core Data Collections (`/clinics/{tenantId}/...`)
- **`patients`**: The master CRM containing all registered patients per clinic.
- **`appointments`**: The daily queue of active and pending scheduled visits per clinic.
- **`prescriptions`**: Medical documents linking patients, doctors, and treatments (supports encrypted notes).
- **`doctors`**: Staff practitioners registry per clinic.

---

## 4. 🧩 Core Components Structure

All primary features are encapsulated in modular React components located in `src/components/`.

- **`BookingWizard.tsx`**: A multi-step modal form used on the Dashboard to instantly onboard a walk-in patient.
- **`EPrescriptionForm.tsx`**: A specialized form that allows doctors to select drugs (or add custom ones) and instantly generates a downloadable PNG image of the prescription.
- **`PatientDirectory.tsx`**: The master CRM table. Includes features for searching patients, viewing history, and an HTML5 Canvas-powered image uploader that aggressively compresses X-Rays before saving them to localStorage.
- **`ProcessRequestModal.tsx`**: The approval screen for pending web-bookings. Requires the receptionist to fill in missing intake details (Nationality, Gender) before accepting.
- **`ProfileModal.tsx`**: The global settings panel using a modern Bento Grid layout for managing the dynamic multi-doctor registry and clinic details.
- **`AppointmentDetailsModal.tsx` & `RescheduleModal.tsx`**: Interfaces for moving appointments around the calendar or starting a visit.
- **`VisualOdontogram.tsx`**: Interactive HTML5 Canvas tooth mapping diagram for dental charts.

---

## 5. ⚙️ Asynchronous Workflows & Messaging

### 5.1 The Web-to-Clinic Booking Flow
1. **Submission:** Patient visits `clinic.com/apollo-dental/book` and submits the form.
2. **Pending Queue:** The request is saved to `appointments` with status `Pending`.
3. **Approval:** Receptionist sees the notification ping on the Dashboard, clicks "Process", and assigns a specific doctor and time slot.
4. **Activation:** The appointment is updated to `Scheduled` and the patient's CRM profile is created.
5. **API Trigger:** The frontend silently sends a `POST` request to `/api/workflow` with the payload.

### 5.2 The Upstash SMS & WhatsApp Notification Workflow (`/api/workflow`)
Powered by `@upstash/workflow`, this API route executes in isolated steps that survive server restarts or Vercel serverless timeouts.
1. **Step 1 (Immediate):** Dispatches confirmation messages via Twilio SMS & Free WhatsApp Gateway simultaneously (*"Your appointment is confirmed for..."*).
2. **Step 2 (Durable Sleep):** The workflow calculates the timestamp for 10:00 AM on the day of the appointment and goes to sleep. It consumes zero server compute while sleeping.
3. **Step 3 (Wake & Remind):** At exactly 10:00 AM on appointment day, the workflow wakes up and fires the day-of reminder on SMS & WhatsApp.

---

## 6. 🚨 Production Deployment & Disaster Recovery

- **Production Deployment Guide:** See [HOSTING_GUIDE.md](HOSTING_GUIDE.md) for full setup instructions on Vercel, Firebase, and WhatsApp Gateway.
- **Disaster Recovery Protocol:** See [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) for daily backup procedures and verification drill commands (`npx tsx scripts/verify-dr.ts`).
