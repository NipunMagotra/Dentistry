# Clinic OS — Comprehensive Documentation

This document serves as the absolute source of truth for the Clinic OS platform (v1.2.2). It covers the technology stack, application architecture, routing structure, data persistence models, and core asynchronous workflows.

---

## 1. 🛠️ Technology Stack

Clinic OS is a modern, client-side-heavy single-page application (SPA) built on the bleeding edge of the React ecosystem.

### Core Frameworks
- **Framework:** [Next.js 16.2.10](https://nextjs.org/) (App Router)
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
- **Image Generation:** `html-to-image` (Client-side DOM to PNG rendering for prescriptions)
- **Date Formatting:** `date-fns`

---

## 2. 🗺️ Application Routing (Next.js App Router)

The application uses **Tenant-Based Dynamic Routing** powered by Next.js Middleware. 

### Middleware (`src/proxy.ts`)
Intercepts all incoming requests and features a **Dual-Mode Router** to support both production domains and Vercel staging environments:
- **Custom Domain Mode**: Extracts the tenant from the wildcard subdomain (e.g., `apollo-dental.yoursaas.com` -> `tenant: apollo-dental`).
- **Vercel Staging Mode**: If accessing via `.vercel.app` or `localhost`, it automatically falls back to path-based routing (e.g., `yoursaas.vercel.app/apollo-dental` -> `tenant: apollo-dental`).
- In both cases, the middleware signs a secure HTTP-only JWT (`tenant_session`) containing the `tenant_id` and explicitly sets the `x-tenant-id` header for strict Server Action and RLS authentication.

### Pages
1. **Marketing / Landing Page** (`src/app/home/...`)
   - *Status:* Planned/Mocked (Root domain entry point).
2. **Main Clinic Dashboard** (`src/app/[tenant]/page.tsx`)
   - *Purpose:* The central operating system for receptionists and doctors.
   - *Features:* Active appointment queue, Bento grid stat cards, and tabbed navigation.
3. **Public Booking Portal** (`src/app/[tenant]/book/page.tsx`)
   - *Purpose:* The public-facing link clinics share with patients (e.g., via Instagram/WhatsApp) to schedule visits.
4. **Upstash Webhook** (`src/app/api/workflow/route.ts`)
   - *Purpose:* Background API route executed by QStash to handle durable delays and third-party SMS integrations.

---

## 3. 🗃️ Data Persistence & Security

The application is fully integrated with a production-grade **Firebase Cloud Firestore** NoSQL backend with true Pay-As-You-Go pricing.

### The Security Pillars
1. **Multi-Tenant Data Isolation**: Every clinic tenant operates under an isolated sub-collection hierarchy (`/clinics/{tenantId}/...`). `getTenantDb()` reads the `x-tenant-id` header passed from middleware to scope all queries automatically.
2. **AES-256-GCM Encryption**: Sensitive medical fields (e.g., `sensitive_notes` on prescriptions) are encrypted at rest using Node's native `crypto` library before being written to Firestore.
3. **Firestore Security Rules**: Configured in `firestore.rules` for strict document path access control.
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

---

## 5. ⚙️ Asynchronous Workflows

### 5.1 The Web-to-Clinic Booking Flow
1. **Submission:** Patient visits `clinic.com/apollo-dental/book` and submits the form.
2. **Pending Queue:** The request is saved to `pending_appointments`.
3. **Approval:** Receptionist sees the notification ping on the Dashboard, clicks "Process", and assigns a specific doctor and time slot.
4. **Activation:** The appointment is moved to `active_appointments` and the patient's CRM profile is created.
5. **API Trigger:** The frontend silently sends a `POST` request to `/api/workflow` with the payload.

### 5.2 The Upstash SMS Notification Workflow (`/api/workflow`)
Powered by `@upstash/workflow`, this API route executes in isolated steps that can survive server restarts or Vercel serverless timeouts.
1. **Step 1 (Immediate):** Dispatches a confirmation SMS via Twilio/WhatsApp (*"Your appointment is confirmed for..."*).
2. **Step 2 (Durable Sleep):** The workflow calculates the timestamp for 10:00 AM on the day of the appointment and goes to sleep. It consumes zero server compute while sleeping.
3. **Step 3 (Wake & Remind):** At exactly 10:00 AM on appointment day, the workflow wakes up and fires the day-of reminder SMS.

### 5.3 The Prescription Image Generation Flow
1. Doctor selects drugs in `EPrescriptionForm.tsx`.
2. A hidden DOM element (`<div ref={prescriptionRef}>`) formats the prescription beautifully using HTML/Tailwind.
3. Upon clicking "Generate", the `html-to-image` library parses the DOM tree, converts the CSS to an inline SVG, and renders it onto a virtual Canvas.
4. The Canvas exports a high-resolution PNG DataURL which triggers an automatic browser download.

---

## 6. 🚨 Future Scalability & Architecture Notes

With the successful migration to Firebase Cloud Firestore, Upstash Workflows, and Vercel Edge routing, the prototype limitations have been resolved. As the platform scales, consider these future enhancements:

1. **Patient Authentication Portal**: Implement an auth layer allowing patients to log in and securely view their own e-prescriptions and upcoming appointments.
2. **Stripe Billing Engine**: Integrate a payment gateway into the dashboard to support automated invoicing and digital payment collection for completed visits.
3. **Storage for Diagnostics**: While text data is secure, implement Firebase Storage or AWS S3 / Cloudflare R2 to support high-resolution X-ray and diagnostic imaging uploads directly within the Patient Directory.
