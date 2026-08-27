/**
 * Centralized Error Logger for the application.
 * Currently logs to console, but can be extended to use services like Sentry or Bugsnag.
 */

import { recordError } from './crashlytics';

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
    let message: string;
    let stack: string | undefined;
    
    if (error instanceof Error) {
        message = error.message;
        stack = error.stack;
    } else {
        // Handle Axios errors or other object errors gracefully
        message = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        stack = undefined;
    }

    if (__DEV__) {
      console.error(`[ErrorLogger] ${timestamp}`, {
        message,
        ...details,
        stack,
      });
    } else {
      // In production, send to remote logging service (Firebase Crashlytics)
      const errObj = error instanceof Error ? error : new Error(message);
      recordError(errObj, Object.keys(details).length ? JSON.stringify(details) : undefined);
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
