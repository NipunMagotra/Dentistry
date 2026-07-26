import * as logger from "firebase-functions/logger";

export const appLogger = {
  info: (message: string, data?: Record<string, any>) => {
    logger.info(`[ClinicOS WhatsApp] ${message}`, data || {});
  },
  warn: (message: string, data?: Record<string, any>) => {
    logger.warn(`[ClinicOS WhatsApp] ⚠️ ${message}`, data || {});
  },
  error: (message: string, error?: any, context?: Record<string, any>) => {
    logger.error(`[ClinicOS WhatsApp] ❌ ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      ...(context || {}),
    });
  },
};
