# Clinic OS - Multi-Tenant Medical Platform

Clinic OS is a modern, ultra-fast, "receptionist-proof" clinic management platform built specifically for dental and medical practices. It prioritizes simplicity, minimal clicks, and a clean interface, while packing powerful features under the hood like multi-tenant routing, serverless background messaging, and native print generation.

## 🚀 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts)
- **Database (Ready)**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Background Jobs**: [Upstash Workflow](https://upstash.com/docs/workflow/getstarted) (Serverless Cron/Delays)
- **Deployment target**: [Cloudflare Pages](https://pages.cloudflare.com/) (Edge Runtime)

## ✨ Key Features

1. **Multi-Tenant Subdomain Routing**: Built-in Next.js Edge Proxy intercepts incoming requests and dynamically rewrites them to isolated tenant segments based on the subdomain (e.g., `apollo-dental.yoursaas.com` -> `/[tenant]/...`).
2. **Receptionist Booking Wizard**: A multi-step, intuitive modal to quickly register new patients, select a doctor, and pick an appointment slot.
3. **No-Typing E-Prescriptions**: A doctor-friendly interface using checkboxes for common medications, automatically calculating frequencies and durations.
4. **Native Medical Print Engine**: Uses pure CSS (`@media print`) to instantly format the screen into a professional, clinic-branded A4 medical prescription ready for physical printing or PDF export—no heavy PDF libraries required.
5. **Patient Directory & History**: Instantly search for patients and pull up a historical log of their past appointments and prescribed medications.
6. **Serverless Messaging Pipeline**: Integrates Upstash Workflow to handle immediate WhatsApp booking confirmations and delayed day-of-treatment reminders without managing a persistent cron server.

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Accessing the App Locally
Because the app relies on subdomain multi-tenant routing, you interact with it differently than a standard Next.js app:
- **Generic Home/Landing Page**: Open [http://localhost:3000](http://localhost:3000)
- **Clinic Dashboard (Demo)**: Open [http://apollo-dental.localhost:3000](http://apollo-dental.localhost:3000) to access the actual application dashboard.

*Note: The demo currently runs on local React state to allow testing the UI flows without requiring Supabase API keys.*

## ☁️ Cloudflare Pages Deployment

This project is configured to compile to Cloudflare Workers (the Edge Runtime). 

To test the Cloudflare compilation locally:
```bash
npm run build:cf
```
*(Note: If you run this natively on Windows, it may fail due to a known `shellac` subshell bug in the Cloudflare CLI. It will compile perfectly on macOS, Linux, or Cloudflare's GitHub CI/CD pipeline).*

**To deploy to production**:
1. Push this code to a GitHub repository.
2. Link the repository to your Cloudflare Dashboard (Pages).
3. Set the build command to `npx @cloudflare/next-on-pages`.

## 🗄️ Database Architecture

When you are ready to move from the local React state demo to production, you will need to wire the application to the provided Supabase schema. 

The core schema includes:
- `clinics`: The core tenants.
- `profiles`: Auth-linked users (Receptionists, Doctors, Admins) bound to a `clinic_id`.
- `doctors`: Available practitioners per clinic.
- `patients`: Registered patients per clinic.
- `appointments`: Scheduled visits linking patients and doctors.
- `common_drugs`: Standardized drug lists for easy e-prescriptions.
- `prescriptions`: Finalized medical documents.

Row Level Security (RLS) policies enforce strict data isolation using a security-definer function (`get_user_clinic_id()`), guaranteeing that a receptionist or doctor at Clinic A can never access data belonging to Clinic B.
