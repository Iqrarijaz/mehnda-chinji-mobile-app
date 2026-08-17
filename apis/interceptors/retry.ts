import type { AxiosError, AxiosInstance } from 'axios';
import { analyticsService, AnalyticsEvents } from '@/analytics';

const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries a failed request with exponential backoff when its status is
 * retryable and it hasn't already exhausted MAX_RETRIES. Returns a promise
 * for the retried request when a retry is scheduled, or `null` when the
 * caller should continue down the rest of the error-handling pipeline
 * (permanent failure).
 */
export function retryIfEligible(error: AxiosError, apiClient: AxiosInstance): Promise<any> | null {
    const config = error.config as any;
    const status = error.response?.status;

    if (!status || !RETRYABLE_STATUS_CODES.includes(status)) return null;

    config.retryCount = config.retryCount || 0;
    if (config.retryCount >= MAX_RETRIES) return null;

    config.retryCount += 1;
    const delay = Math.pow(2, config.retryCount) * 1000;

    analyticsService.trackEvent(AnalyticsEvents.API_RETRY, {
        status,
        endpoint: config.url,
        attempt: config.retryCount,
        delay
    });

    if (__DEV__) {
        console.log(`API Client: Retrying ${config.url} (Attempt ${config.retryCount}) in ${delay}ms`);
    }

    return sleep(delay).then(() => apiClient(config));
}
