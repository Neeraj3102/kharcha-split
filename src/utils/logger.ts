/**
 * Production-Safe Logging Utility for KharchaSplit
 * Suppresses debug and verbose stack traces in production builds.
 */

const isProd = import.meta.env.PROD;

export const logger = {
  debug: (...args: unknown[]): void => {
    if (!isProd) {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (!isProd) {
      console.info('[INFO]', ...args);
    }
  },

  warn: (...args: unknown[]): void => {
    console.warn('[WARN]', ...args);
  },

  error: (context: string, error?: unknown): void => {
    if (isProd) {
      // In production: only log safe error summary, no raw stack traces
      const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
      console.error(`[ERROR] ${context}: ${msg}`);
    } else {
      console.error(`[ERROR] ${context}`, error);
    }
  },

  /**
   * Returns a sanitized, friendly user-facing error message
   */
  toUserMessage: (error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string => {
    if (!error) return fallback;
    if (typeof error === 'string') return error;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
        return 'Network error: Please verify your internet connection.';
      }
      if (msg.includes('permission_denied') || msg.includes('access denied')) {
        return 'Access restricted: You do not have permission for this action.';
      }
      if (msg.includes('quota') || msg.includes('rate limit')) {
        return 'Request limit reached. Please wait a moment before trying again.';
      }
    }

    return fallback;
  },
};
