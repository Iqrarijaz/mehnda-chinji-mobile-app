import axios, { AxiosError } from 'axios';
import { baseUrl } from '@/configs';
import { getApiUrl } from '@/lib/remoteConfig';

import { measureRequestSize, trackResponseUsage, trackErrorUsage } from './interceptors/dataUsage';
import { attachAuthHeaders, handleUnauthorized } from './interceptors/auth';
import { retryIfEligible } from './interceptors/retry';
import { stampStartTime, trackIfSlow, logAndTrackApiError } from './interceptors/analytics';

// Standardized Error Class
export class ApiError extends Error {
    status?: number;
    code?: string;
    data?: any;

    constructor(message: string, status?: number, code?: string, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.data = data;
    }
}

const apiClient = axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: dynamic routing, request-size metadata, auth & device headers.
// Composed from apis/interceptors/* — see each module for the individual concerns.
apiClient.interceptors.request.use(
    async (config: any) => {
        try {
            // Set dynamic baseURL from Remote Config
            config.baseURL = getApiUrl();

            config.metadata = { requestSize: measureRequestSize(config) };
            stampStartTime(config);

            await attachAuthHeaders(config);
        } catch (error) {
            console.error('API Client: Error attaching token', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: data usage tracking, retry-on-failure, and uniform error shaping.
// Composed from apis/interceptors/* — see each module for the individual concerns.
apiClient.interceptors.response.use(
    (response: any) => {
        trackResponseUsage(response);
        trackIfSlow(response.config?.metadata?.startTime, response.config?.url, response.config?.method);
        return response.data;
    },
    async (error: AxiosError) => {
        const config = error.config as any;

        // Still track usage even on error if response exists
        trackErrorUsage(error);

        // Session renewal (unified 401 handling). Returns a promise for the
        // replayed request when the token was renewed, so the caller never sees
        // the 401 at all; null means the session is genuinely gone and the
        // error should continue down this pipeline.
        const replayed = await handleUnauthorized(error, apiClient);
        if (replayed) return replayed;

        // Retry Logic — short-circuits here and skips the rest of this handler when retrying
        const retry = retryIfEligible(error, apiClient);
        if (retry) return retry;

        const message = (error.response?.data as any)?.message || error.message || 'An unexpected error occurred';
        const code = (error.response?.data as any)?.code;
        const data = error.response?.data;
        const status = error.response?.status;

        const apiError = new ApiError(message, status, code, data);
        logAndTrackApiError(apiError, config?.url, config?.method);

        // Performance Tracking: SLOW_API_RESPONSE (even on error)
        trackIfSlow(config?.metadata?.startTime, config?.url, config?.method, status);

        return Promise.reject(apiError);
    }
);

export const privateAxios = apiClient;
export default apiClient;
