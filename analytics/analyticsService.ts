import { getAnalytics, logEvent, logLogin, logSignUp, setUserId, setUserProperties } from '@react-native-firebase/analytics';
import { EventName } from './analyticsEvents';

/**
 * AnalyticsService handles the actual communication with Firebase.
 * It includes safety guards and development logging.
 * 
 * NOTE: Firebase native module is currently enabled for production.
 */
class AnalyticsService {
    /**
     * Core function to track any custom event.
     */
    async trackEvent(name: EventName | string, params?: Record<string, any>) {
        try {
            await logEvent(getAnalytics(), name, params);

            if (__DEV__) {
                console.log(`📊 [Analytics] Event: ${name}`, params || '');
            }
        } catch (error) {
            if (__DEV__) {
                console.error(`❌ [Analytics] Failed to log event: ${name}`, error);
            }
        }
    }

    /**
     * Specifically log user login.
     */
    async logLogin(method: string = 'email') {
        try {
            await logLogin(getAnalytics(), { method });
            if (__DEV__) console.log('📊 [Analytics] User Logged In');
        } catch (e) { }
    }

    /**
     * Specifically log user sign up.
     */
    async logSignUp(method: string = 'email') {
        try {
            await logSignUp(getAnalytics(), { method });
            if (__DEV__) console.log('📊 [Analytics] User Signed Up');
        } catch (e) { }
    }

    /**
     * Set user ID for cross-device tracking.
     */
    async setUserId(userId: string | null) {
        try {
            await setUserId(getAnalytics(), userId);
        } catch (e) { }
    }

    /**
     * Set custom user properties (e.g., user role, premium status).
     */
    async setUserProperties(properties: Record<string, any>) {
        try {
            await setUserProperties(getAnalytics(), properties);
        } catch (e) { }
    }
}

export const analyticsService = new AnalyticsService();
