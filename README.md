# Clinic OS — Multi-Tenant Medical Platform (v1.3.0)

Clinic OS is a modern, ultra-fast, intuitive clinic management platform built specifically for dental and medical practices. It prioritizes simplicity, minimal clicks, and a clean interface, while packing powerful features under the hood like multi-tenant routing, serverless background messaging (SMS + Free WhatsApp Gateway), and native print generation.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack & Proxy Middleware
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts)
- **Database (Live)**: [Firebase Cloud Firestore](https://firebase.google.com/) (NoSQL Document Store + Multi-Tenant Hierarchy + AES-256-GCM Encryption)
- **Background Jobs**: [Upstash Workflow](https://upstash.com/docs/workflow/getstarted) (Durable execution for SMS & WhatsApp)
- **WhatsApp Gateway**: Baileys / WhatsApp Web JS microservice for **100% Free WhatsApp messaging**
- **Deployment target**: [Vercel](https://vercel.com/) (Edge Runtime)

---

## ✨ Key Features

1. **Multi-Tenant Subdomain Proxy**: Built-in Next.js 16 Proxy intercepts incoming requests and dynamically rewrites them to isolated tenant segments based on the subdomain (e.g., `apollo-dental.yoursaas.com` ➔ `/[tenant]/...`).
2. **Receptionist Booking Wizard**: A multi-step, intuitive modal to quickly register new patients, select a doctor, and pick an appointment slot.
3. **No-Typing E-Prescriptions**: A doctor-friendly interface using checkboxes for common medications, automatically calculating frequencies and durations.
4. **Native Medical Print Engine**: Uses pure CSS (`@media print`) to instantly format the screen into a professional, clinic-branded A4 medical prescription ready for physical printing or PDF export—no heavy PDF libraries required.
5. **Patient Directory & History**: Instantly search for patients and pull up a historical log of their past appointments and prescribed medications.
6. **Parallel Notification Pipeline**: Integrates Upstash Workflow to handle immediate WhatsApp & SMS booking confirmations and delayed day-of-treatment reminders without managing a persistent cron server.
7. **Zero-Trust Security**: Enforces path-isolated `/clinics/{tenantId}/...` Firestore sub-collections, zero-trust security rules (`firestore.rules`), and transparent **AES-256-GCM encryption** for sensitive notes.

---

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

---

## ☁️ Vercel Deployment & Hosting

This project is configured for 100% Free Tier deployment on Vercel and Firebase Cloud Firestore.

See the complete step-by-step production deployment guide in **[HOSTING_GUIDE.md](HOSTING_GUIDE.md)**.

### Quick Deployment Steps:
1. Push code to your GitHub repository.
2. Import the repository into your Vercel Dashboard.
3. Configure Environment Variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `ENCRYPTION_SECRET`, `SESSION_SECRET`, `QSTASH_*`).
4. Deploy!

*Vercel Routing Note: Free `.vercel.app` domains support path-based routing (e.g. `your-app.vercel.app/city-dental`). For custom domain wildcard subdomains, attach your domain with `*.yourdomain.com` enabled.*

---

## 🗃️ Database & Security Architecture

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
