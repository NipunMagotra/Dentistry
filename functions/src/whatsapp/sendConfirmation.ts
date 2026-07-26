import { Timestamp } from "firebase-admin/firestore";
import { metaWhatsAppClient } from "./metaClient";
import { buildConfirmationPayload } from "./templates";
import { SendMessageParams, MetaApiResponse } from "../utils/types";
import { appLogger } from "../utils/logger";

/**
 * Reusable function to send WhatsApp appointment confirmation message.
 */
export async function sendConfirmation(params: SendMessageParams): Promise<MetaApiResponse> {
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

  appLogger.info(`Preparing confirmation message for ${patientName} (${patientPhone})`);

  const payload = buildConfirmationPayload(
    patientPhone,
    patientName,
    formattedDateStr,
    clinicName || "Clinic OS Dental"
  );

  return await metaWhatsAppClient.sendMessage(payload);
}
