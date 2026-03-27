// import analytics from '@react-native-firebase/analytics';
import { AnalyticsEvents, EventName } from './analyticsEvents';

/**
 * AnalyticsService handles the actual communication with Firebase.
 * It includes safety guards and development logging.
 * 
 * NOTE: Firebase native module is currently commented out to allow running in Expo Go.
 * Uncomment the analytics() calls when building the production app or using a Development Build.
 */
class AnalyticsService {
    /**
     * Core function to track any custom event.
     */
    async trackEvent(name: EventName | string, params?: Record<string, any>) {
        try {
            // await analytics().logEvent(name, params);

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
            // await analytics().logLogin({ method });
            if (__DEV__) console.log('📊 [Analytics] User Logged In');
        } catch (e) { }
    }

    /**
     * Specifically log user sign up.
     */
    async logSignUp(method: string = 'email') {
        try {
            // await analytics().logSignUp({ method });
            if (__DEV__) console.log('📊 [Analytics] User Signed Up');
        } catch (e) { }
    }

    /**
     * Set user ID for cross-device tracking.
     */
    async setUserId(userId: string | null) {
        try {
            // await analytics().setUserId(userId);
        } catch (e) { }
    }

    /**
     * Set custom user properties (e.g., user role, premium status).
     */
    async setUserProperties(properties: Record<string, any>) {
        try {
            // await analytics().setUserProperties(properties);
        } catch (e) { }
    }
}

export const analyticsService = new AnalyticsService();
