import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { sendReminder } from "../whatsapp/sendReminder";
import { AppointmentDocument } from "../utils/types";
import { appLogger } from "../utils/logger";

/**
 * Firebase Cloud Functions v2 Scheduled Function:
 * Runs automatically every 5 minutes to query upcoming appointments and dispatch WhatsApp reminders.
 * Uses atomic Firestore transactions to prevent duplicate reminders.
 */
export const reminderScheduler = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "UTC",
    retryCount: 2,
  },
  async () => {
    const db = getFirestore();
    const now = new Date();

    // Reminder window: 2 hours before appointment (± 10 minutes buffer for 5-min cron execution)
    // Target window: appointments occurring between 1 hour 50 minutes and 2 hours 10 minutes from now
    const windowStartMs = now.getTime() + (110 * 60 * 1000); // 1h 50m from now
    const windowEndMs = now.getTime() + (130 * 60 * 1000);   // 2h 10m from now

    const windowStart = Timestamp.fromMillis(windowStartMs);
    const windowEnd = Timestamp.fromMillis(windowEndMs);

    appLogger.info("Executing reminderScheduler cron...", {
      now: now.toISOString(),
      windowStart: windowStart.toDate().toISOString(),
      windowEnd: windowEnd.toDate().toISOString(),
    });

    try {
      // Query collectionGroup for all appointments across clinics where reminderSent == false
      const querySnapshot = await db
        .collectionGroup("appointments")
        .where("reminderSent", "==", false)
        .where("appointmentDateTime", ">=", windowStart)
        .where("appointmentDateTime", "<=", windowEnd)
        .get();

      if (querySnapshot.empty) {
        appLogger.info("No upcoming appointments due for reminder in current window.");
        return;
      }

      appLogger.info(`Found ${querySnapshot.size} appointments due for WhatsApp reminder.`);

      for (const docSnapshot of querySnapshot.docs) {
        const appointmentRef = docSnapshot.ref;

        // Execute atomic Firestore transaction to claim exclusive lock & prevent duplicate reminders
        let appointmentData: AppointmentDocument | null = null;
        let claimedSuccessfully = false;

        try {
          await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(appointmentRef);
            if (!freshDoc.exists) return;

            const data = freshDoc.data() as AppointmentDocument;

            // Re-verify reminderSent flag within transaction
            if (data.reminderSent === true || data.status === "Cancelled") {
              appLogger.info(`Appointment ${freshDoc.id} already processed or cancelled. Skipping.`);
              return;
            }

            // Lock document atomically before sending network request
            transaction.update(appointmentRef, {
              reminderSent: true,
              reminderSentAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            appointmentData = data;
            claimedSuccessfully = true;
          });
        } catch (txnError: any) {
          appLogger.error(`Transaction lock failed for appointment ${docSnapshot.id}`, txnError);
          continue;
        }

        // If lock was claimed successfully, dispatch WhatsApp reminder
        if (claimedSuccessfully && appointmentData) {
          const apt: AppointmentDocument = appointmentData;

          try {
            await sendReminder({
              patientName: apt.patientName,
              patientPhone: apt.patientPhone,
              appointmentDateTime: apt.appointmentDateTime,
              clinicName: apt.clinicId || "Clinic OS Dental",
            });

            appLogger.info(`Successfully sent WhatsApp reminder for appointment ${docSnapshot.id}`);
          } catch (sendError: any) {
            appLogger.error(`Failed to send reminder for appointment ${docSnapshot.id}`, sendError);

            // Revert reminderSent flag if dispatch failed after retries
            await appointmentRef.update({
              reminderSent: false,
              reminderError: sendError.message || "Failed to dispatch reminder",
              updatedAt: Timestamp.now(),
            }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      appLogger.error("Error executing reminderScheduler scheduled function", err);
    }
  }
);
