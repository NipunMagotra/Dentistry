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

### Middleware (`src/middleware.ts`)
Intercepts all incoming requests and rewrites the URL based on the hostname.
- If the user visits the root domain (e.g., `localhost:3000` or `yoursaas.com`), it rewrites the path to `/home`.
- If the user visits a subdomain (e.g., `apollo-dental.localhost:3000`), it extracts the tenant (`apollo-dental`) and rewrites the path to `/[tenant]`.

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

## 3. 🗃️ Data Persistence & State Management

**⚠️ Architecture Note:** The application currently operates completely *without a backend database*. All state is persisted locally in the browser.

### The Storage Engine: `localStorage`
Data is serialized as JSON strings and written to the browser's `localStorage`. To ensure components react to changes made in other parts of the app (or in modals), the app uses a **Custom Event Bus Pattern**. When data is written to localStorage, a `window.dispatchEvent` is fired to tell other components to re-render.

### Core Data Entities & Storage Keys
1. **`clinic_profile_settings`**: Stores the clinic's name, address, phone number, and API keys.
2. **`clinic_doctors_list`**: Array of doctor objects (Name, Specialty, Degrees, Timings, Consultation Charge).
3. **`active_appointments`**: The daily queue of approved patients sitting in the Dashboard.
4. **`pending_appointments`**: Incoming requests submitted from the Public Booking Portal awaiting front-desk approval.
5. **`patient_directory_list`**: The master CRM array containing all patients, their medical history (past visits, generated prescriptions), and Base64-encoded diagnostic images (X-Rays).

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

## 6. 🚨 Known Constraints & Limitations

If you intend to deploy this prototype to a real production environment, you must address the following constraints inherent to the current architecture:

1. **Storage Quotas:** `localStorage` is strictly limited to ~5MB per browser. High-res X-Rays will quickly exhaust this limit. A real database (e.g., PostgreSQL via Prisma/Supabase) and S3 bucket (e.g., AWS/UploadThing) is required for production.
2. **Subdomain Isolation:** Because data lives in the browser, if the dashboard is accessed at `localhost:3000` but the public form is filled at `apollo-dental.localhost:3000`, the data will NOT sync. `localStorage` cannot cross subdomains.
3. **No Authentication:** The `AuthModal.tsx` is currently a UI mockup. There is no real JWT or session management protecting the dashboard routes. 
