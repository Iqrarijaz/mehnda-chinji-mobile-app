import { analyticsService, AnalyticsEvents } from '@/analytics';
import { errorLogger } from '@/lib/errorLogger';

const SLOW_RESPONSE_THRESHOLD_MS = 3000;

/** Marks the request start time so the response phase can compute duration. */
export function stampStartTime(config: any): void {
    config.metadata = { ...config.metadata, startTime: Date.now() };
}

/** Fires SLOW_API_RESPONSE when a request (success or failure) exceeds the threshold. */
export function trackIfSlow(startTime: number | undefined, url?: string, method?: string, status?: number): void {
    if (!startTime) return;
    const duration = Date.now() - startTime;
    if (duration <= SLOW_RESPONSE_THRESHOLD_MS) return;

    analyticsService.trackEvent(AnalyticsEvents.SLOW_API_RESPONSE, {
        endpoint: url,
        duration,
        method,
        ...(status !== undefined ? { status } : {})
    });
}

/** Logs a failed API call to the error logger and fires an API_ERROR analytics event. */
export function logAndTrackApiError(apiError: any, endpoint?: string, method?: string): void {
    if (__DEV__) {
        try {
            const dataStr = apiError.data ? (typeof apiError.data === 'string' ? apiError.data : JSON.stringify(apiError.data)) : 'No data';
            console.warn('⚠️ API Error Data:', dataStr ? String(dataStr).slice(0, 500) : 'No data');
        } catch (e) {
            console.warn('⚠️ API Error Data: [Unserializable data]');
        }
    }

    errorLogger.logApiError(apiError);

    analyticsService.trackEvent(AnalyticsEvents.API_ERROR, {
        status: apiError.status,
        endpoint,
        method,
        message: String(apiError.message).slice(0, 100), // Cap length
    });
}
