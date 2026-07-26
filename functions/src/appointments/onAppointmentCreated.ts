import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { sendConfirmation } from "../whatsapp/sendConfirmation";
import { AppointmentDocument } from "../utils/types";
import { appLogger } from "../utils/logger";

/**
 * Firebase Cloud Functions v2 Firestore Trigger:
 * Fires automatically whenever a new appointment document is created under `clinics/{clinicId}/appointments/{appointmentId}`.
 */
export const onAppointmentCreated = onDocumentCreated(
  "clinics/{clinicId}/appointments/{appointmentId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      appLogger.warn("No snapshot data found in onDocumentCreated event.");
      return;
    }

    const data = snapshot.data() as AppointmentDocument;
    const { clinicId, appointmentId } = event.params;

    appLogger.info(`Triggered onAppointmentCreated for clinic: ${clinicId}, appointment: ${appointmentId}`, {
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      confirmationSent: data.confirmationSent,
    });

    // Idempotency check: Skip if confirmation message was already dispatched
    if (data.confirmationSent) {
      appLogger.info(`Confirmation already sent for appointment ${appointmentId}. Skipping.`);
      return;
    }

    if (!data.patientPhone || !data.patientName) {
      appLogger.warn(`Missing patient details for appointment ${appointmentId}. Cannot send confirmation.`);
      return;
    }

    try {
      // 1. Send WhatsApp confirmation message via Meta Cloud API
      await sendConfirmation({
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        appointmentDateTime: data.appointmentDateTime,
        clinicName: data.clinicId || "Clinic OS Dental",
      });

      // 2. Atomically update Firestore document
      await snapshot.ref.update({
        confirmationSent: true,
        confirmationSentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      appLogger.info(`Successfully processed appointment confirmation for ${appointmentId}`);
    } catch (err: any) {
      appLogger.error(`Failed to process appointment confirmation for ${appointmentId}`, err);
      // Log error state to Firestore document for auditing
      await snapshot.ref.update({
        confirmationError: err.message || "Failed to send confirmation",
        updatedAt: Timestamp.now(),
      }).catch(() => {});
    }
  }
);
