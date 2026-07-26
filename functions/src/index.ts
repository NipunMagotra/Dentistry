import { initializeApp } from "firebase-admin/app";

// Initialize Firebase Admin SDK once at startup
initializeApp();

// Export Firebase Cloud Functions v2 Triggers & Scheduler
export { onAppointmentCreated } from "./appointments/onAppointmentCreated";
export { reminderScheduler } from "./scheduler/reminderScheduler";
