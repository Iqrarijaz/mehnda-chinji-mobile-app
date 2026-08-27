import crashlytics from '@react-native-firebase/crashlytics';

/**
 * Record a non-fatal error to Firebase Crashlytics.
 * Equivalent to Sentry.captureException().
 */
export function recordError(error: Error, context?: string): void {
    if (__DEV__) {
        console.warn('[Crashlytics] recordError (DEV not sent):', error, context);
        return;
    }
    if (context) {
        crashlytics().log(context);
    }
    crashlytics().recordError(error);
}

/**
 * Tag the current user for crash reports.
 */
export function setCrashlyticsUser(userId: string | null): void {
    if (__DEV__) return;
    if (userId) {
        crashlytics().setUserId(userId);
    } else {
        crashlytics().setUserId('');
    }
}

/**
 * Log a breadcrumb string.
 */
export function log(message: string): void {
    if (__DEV__) return;
    crashlytics().log(message);
}

export default crashlytics;
