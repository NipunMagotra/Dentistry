import { appLogger } from "./logger";

/**
 * Executes an async function with exponential backoff retries.
 * Useful for handling transient Meta WhatsApp API network hiccups or HTTP 429/5xx rate limits.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const backoffFactor = options.backoffFactor ?? 2;
  const operationName = options.operationName ?? "Async Operation";

  let lastError: any;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      // Do not retry client 4xx errors (except 429 Too Many Requests)
      const statusCode = err?.status || err?.statusCode;
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        appLogger.warn(`${operationName} failed with non-retryable status ${statusCode}`, { error: err.message });
        throw err;
      }

      if (attempt < maxRetries) {
        appLogger.warn(`${operationName} failed (Attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`, {
          error: err.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= backoffFactor;
      }
    }
  }

  appLogger.error(`${operationName} failed after ${maxRetries} attempts.`, lastError);
  throw lastError;
}
