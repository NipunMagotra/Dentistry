import { MetaTemplatePayload } from "../utils/types";

/**
 * Normalizes phone numbers into E.164 format without spaces, plus signs, or hyphens.
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Default to country code 91 if 10 digits provided
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Builds Meta WhatsApp Cloud API template payload for appointment confirmation.
 */
export function buildConfirmationPayload(
  phone: string,
  patientName: string,
  appointmentFormattedDate: string,
  clinicName: string = "Clinic OS Dental"
): MetaTemplatePayload {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formatPhoneNumber(phone),
    type: "template",
    template: {
      name: "appointment_confirmation",
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: patientName },
            { type: "text", text: appointmentFormattedDate },
            { type: "text", text: clinicName },
          ],
        },
      ],
    },
  };
}

/**
 * Builds Meta WhatsApp Cloud API template payload for appointment reminders.
 */
export function buildReminderPayload(
  phone: string,
  patientName: string,
  appointmentFormattedDate: string,
  clinicName: string = "Clinic OS Dental"
): MetaTemplatePayload {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formatPhoneNumber(phone),
    type: "template",
    template: {
      name: "appointment_reminder",
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: patientName },
            { type: "text", text: appointmentFormattedDate },
            { type: "text", text: clinicName },
          ],
        },
      ],
    },
  };
}
