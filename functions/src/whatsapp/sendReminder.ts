import { Timestamp } from "firebase-admin/firestore";
import { metaWhatsAppClient } from "./metaClient";
import { buildReminderPayload } from "./templates";
import { SendMessageParams, MetaApiResponse } from "../utils/types";
import { appLogger } from "../utils/logger";

/**
 * Reusable function to send WhatsApp appointment reminder message.
 */
export async function sendReminder(params: SendMessageParams): Promise<MetaApiResponse> {
  const { patientName, patientPhone, appointmentDateTime, clinicName } = params;

  let formattedDateStr = "";
  if (appointmentDateTime instanceof Timestamp) {
    formattedDateStr = appointmentDateTime.toDate().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } else if (appointmentDateTime instanceof Date) {
    formattedDateStr = appointmentDateTime.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } else {
    formattedDateStr = String(appointmentDateTime);
  }

  appLogger.info(`Preparing reminder message for ${patientName} (${patientPhone})`);

  const payload = buildReminderPayload(
    patientPhone,
    patientName,
    formattedDateStr,
    clinicName || "Clinic OS Dental"
  );

  return await metaWhatsAppClient.sendMessage(payload);
}
