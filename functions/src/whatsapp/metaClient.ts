import { MetaApiResponse, MetaTemplatePayload } from "../utils/types";
import { withRetry } from "../utils/retry";
import { appLogger } from "../utils/logger";

/**
 * Meta WhatsApp Cloud API HTTP Client.
 * Handles authentication, endpoint generation, network dispatches, and retries.
 */
export class MetaWhatsAppClient {
  private apiToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.apiVersion = process.env.WHATSAPP_API_VERSION || "v19.0";

    if (!this.apiToken || !this.phoneNumberId) {
      appLogger.warn("Meta WhatsApp API credentials not set in environment variables (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID). Dispatches will be logged in fallback mode.");
    }
  }

  /**
   * Dispatches a structured Meta WhatsApp Cloud API message.
   */
  public async sendMessage(payload: MetaTemplatePayload): Promise<MetaApiResponse> {
    const endpoint = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    // Fallback/mock mode if secrets are missing in dev/test environment
    if (!this.apiToken || !this.phoneNumberId) {
      appLogger.info(" (Fallback Dispatch) WhatsApp payload:", { payload });
      return {
        messaging_product: "whatsapp",
        contacts: [{ input: payload.to, wa_id: payload.to }],
        messages: [{ id: `wamid.mock.${Date.now()}` }],
      };
    }

    return await withRetry(
      async () => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data: MetaApiResponse = await response.json();

        if (!response.ok || data.error) {
          const errMessage = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          const errObj = new Error(`Meta API Failure: ${errMessage}`);
          (errObj as any).status = response.status;
          (errObj as any).metaError = data.error;
          throw errObj;
        }

        appLogger.info(`Successfully dispatched Meta WhatsApp message to ${payload.to}`, {
          messageId: data.messages?.[0]?.id,
        });

        return data;
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        operationName: `Meta WhatsApp API Dispatch to ${payload.to}`,
      }
    );
  }
}

export const metaWhatsAppClient = new MetaWhatsAppClient();
