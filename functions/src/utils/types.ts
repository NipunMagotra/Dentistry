import { Timestamp } from "firebase-admin/firestore";

export interface AppointmentDocument {
  id?: string;
  patientName: string;
  patientPhone: string;
  appointmentDateTime: Timestamp;
  clinicId: string;
  doctorName?: string;
  reason?: string;
  status: "Pending" | "Scheduled" | "Completed" | "Cancelled" | "No Show";
  reminderSent: boolean;
  reminderSentAt?: Timestamp;
  confirmationSent: boolean;
  confirmationSentAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface MetaWhatsAppConfig {
  apiToken: string;
  phoneNumberId: string;
  apiVersion?: string;
}

export interface TemplateParameter {
  type: "text";
  text: string;
}

export interface TemplateComponent {
  type: "body" | "header" | "button";
  parameters: TemplateParameter[];
}

export interface MetaTemplatePayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components: TemplateComponent[];
  };
}

export interface MetaApiResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

export interface SendMessageParams {
  patientName: string;
  patientPhone: string;
  appointmentDateTime: Timestamp | Date;
  clinicName?: string;
  doctorName?: string;
}
