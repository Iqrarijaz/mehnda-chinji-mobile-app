/**
 * Centralized Error Logger for the application.
 * Currently logs to console, but can be extended to use services like Sentry or Bugsnag.
 */

import Sentry from './sentry';

export interface ErrorDetails {
  componentName?: string;
  action?: string;
  status?: number;
  code?: string;
  data?: any;
  [key: string]: any;
}

class ErrorLogger {
  log(error: Error | any, details: ErrorDetails = {}) {
    const timestamp = new Date().toISOString();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    if (__DEV__) {
      console.error(`[ErrorLogger] ${timestamp}`, {
        message,
        ...details,
        stack,
      });
    } else {
      // In production, send to remote logging service
      Sentry.captureException(error, { extra: details });
      console.warn(`[ErrorLogger] ${timestamp} ${message}`, details);
    }
  }

  logApiError(error: any, details: ErrorDetails = {}) {
    this.log(error, {
      ...details,
      type: 'API_ERROR',
      status: error.status,
      code: error.code,
      data: error.data,
    });
  }
}

export const errorLogger = new ErrorLogger();
