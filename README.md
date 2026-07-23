# Clinic OS - Multi-Tenant Medical Platform

Clinic OS is a modern, ultra-fast, intuitive clinic management platform built specifically for dental and medical practices. It prioritizes simplicity, minimal clicks, and a clean interface, while packing powerful features under the hood like multi-tenant routing, serverless background messaging, and native print generation.

## 🚀 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts)
- **Database (Live)**: [Firebase Cloud Firestore](https://firebase.google.com/) (NoSQL Document Store + Multi-Tenant Hierarchy + AES-256-GCM Encryption)
- **Background Jobs**: [Upstash Workflow](https://upstash.com/docs/workflow/getstarted) (Serverless Cron/Delays)
- **Deployment target**: [Vercel](https://vercel.com/) (Edge Runtime)

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
- **Clinic Dashboard**: Open [http://apollo-dental.localhost:3000](http://apollo-dental.localhost:3000) to access the actual application dashboard.

*Note: The app requires valid Firebase environment variables configured in `.env.local` to function correctly.*

## ☁️ Vercel Deployment

This project is configured to deploy seamlessly to Vercel. 

**To deploy to production**:
1. Push this code to a GitHub repository.
2. Import the repository into your Vercel Dashboard.
3. Configure your Environment Variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `ENCRYPTION_SECRET`, `SESSION_SECRET`, Twilio credentials, Upstash QStash tokens).
4. Deploy!

*Vercel Routing Note: Free `.vercel.app` domains do not support wildcard subdomains. To test multi-tenancy on the free tier, the middleware automatically supports path-based routing (e.g. `your-app.vercel.app/city-dental`). For production, attach a custom domain with wildcard subdomains enabled.*

## Database Architecture

The application is fully wired to a secure **Firebase Cloud Firestore** NoSQL backend.

The core collection hierarchy (`/clinics/{tenantId}/...`) includes:
- `clinics`: Document container for each clinic tenant.
- `doctors`: Available practitioners per clinic.
- `patients`: Master CRM containing registered patients per clinic.
- `appointments`: Scheduled visits linking patients and doctors.
- `prescriptions`: Finalized medical documents (with AES-256-GCM encrypted notes).

**Security Pillars Implemented:**
- **Multi-Tenant Document Isolation**: Enforces strict data isolation using the `x-tenant-id` header routed to `/clinics/{tenantId}/...` sub-collections.
- **AES-256-GCM Encryption**: Transparent field-level encryption for highly sensitive medical notes (`sensitive_notes`) using Node.js `crypto`.
- **Firestore Security Rules**: Configured in `firestore.rules` for document path access control.
- **Disaster Recovery Verification**: Verified via `scripts/verify-dr.ts` for tenant isolation and encryption integrity.
