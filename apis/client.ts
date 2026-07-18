import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { baseUrl } from '@/configs';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { errorLogger } from '@/lib/errorLogger';
import { secureStorage } from '@/utils/storage';
import { useDataUsageStore } from '@/store/dataUsageStore';
import { tokenCache } from '@/lib/tokenCache';
import { getApiUrl } from '@/lib/remoteConfig';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { getDeviceInfo } from '@/lib/deviceInfo';
import { Platform } from 'react-native';

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

const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const apiClient = axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token & Measure Request Size
apiClient.interceptors.request.use(
    async (config: any) => {
        try {
            // Set dynamic baseURL from Remote Config
            config.baseURL = getApiUrl();

            // Measure request size approx (avoid stringify if possible)
            let requestSize = 0;
            if (typeof config.data === 'string') {
                requestSize = config.data.length;
            } else if (config.data && !(config.data instanceof FormData)) {
                // Warning: Can still be slow for very large POST payloads
                try { requestSize = JSON.stringify(config.data).length; } catch (e) { }
            }
            config.metadata = { 
                requestSize,
                startTime: Date.now()
            };

            // 1. Read from in-memory cache — synchronous, zero I/O
            let token = tokenCache.get();

            // 2. Cold-start fallback only: AuthContext hasn't populated the cache yet.
            //    Read from SecureStore once and prime the cache so this path never repeats.
            if (!token) {
                const userData = await secureStorage.getItem('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    token = parsed.token ?? null;
                    if (token) tokenCache.set(token);
                }
            }

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // --- Metadata Headers ---
            const appVersion = Constants.expoConfig?.version || '1.0.0';
            const platform = Device.osName;
            const deviceModel = Device.modelName;
            const osVersion = Device.osVersion;

            config.headers['x-app-version'] = appVersion;
            config.headers['x-platform'] = platform;
            config.headers['x-device-model'] = deviceModel;
            config.headers['x-os-version'] = osVersion;
            config.headers['x-channel'] = 'mobile_app';
            config.headers['x-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Get Unique Device ID and Network Info from Cache
            const deviceInfo = getDeviceInfo();
            config.headers['x-device-id'] = deviceInfo.deviceId;
            config.headers['x-net-type'] = deviceInfo.networkType;
            if (deviceInfo.localIp) {
                config.headers['x-local-ip'] = deviceInfo.localIp;
            }
        } catch (error) {
            console.error('API Client: Error attaching token', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Uniform Error Handling, Data Extraction & Data Tracking
apiClient.interceptors.response.use(
    (response: any) => {
        // Track data usage
        try {
            const requestSize = response.config.metadata?.requestSize || 0;
            const contentLengthStr = response.headers?.['content-length'];
            // Fallback to 0 instead of stringifying to avoid blocking the JS thread
            const responseSize = contentLengthStr ? parseInt(contentLengthStr as string, 10) : 0;
            const totalBytes = requestSize + responseSize;

            if (totalBytes > 0) {
                useDataUsageStore.getState().trackUsage(totalBytes);
            }

            // Performance Tracking: SLOW_API_RESPONSE
            const startTime = response.config.metadata?.startTime;
            if (startTime) {
                const duration = Date.now() - startTime;
                if (duration > 3000) {
                    analyticsService.trackEvent(AnalyticsEvents.SLOW_API_RESPONSE, {
                        endpoint: response.config.url,
                        duration,
                        method: response.config.method
                    });
                }
            }
        } catch (e) {
            console.warn('Data Usage Tracking Error:', e);
        }

        return response.data;
    },
    (error: AxiosError) => {
        const config = error.config as any;

        // Still track usage even on error if response exists
        if (error.response) {
            try {
                const requestSize = config?.metadata?.requestSize || 0;
                const contentLengthStr = error.response.headers?.['content-length'];
                const responseSize = contentLengthStr ? parseInt(contentLengthStr as string, 10) : 0;
                useDataUsageStore.getState().trackUsage(requestSize + responseSize);
            } catch (e) { }
        }

        const status = error.response?.status;
        const isLoginRequest = config?.url?.includes('login');

        // Handle Session Expiration (Unified 401 Handling)
        if (status === 401 && !isLoginRequest) {
            tokenCache.setSessionExpired(true);
            tokenCache.clear();
            secureStorage.removeItem('userData');
            // Redirection is now handled reactively by AuthContext via tokenCache listener
        }

        // Retry Logic
        if (status && RETRYABLE_STATUS_CODES.includes(status)) {
            config.retryCount = config.retryCount || 0;

            if (config.retryCount < MAX_RETRIES) {
                config.retryCount += 1;

                // Exponential backoff delay
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
        }

        const message = (error.response?.data as any)?.message || error.message || 'An unexpected error occurred';
        const code = (error.response?.data as any)?.code;
        const data = error.response?.data;

        if (__DEV__) {
            console.warn('⚠️ API Error Data:', JSON.stringify(data).slice(0, 500));
        }

        const apiError = new ApiError(message, status, code, data);
        errorLogger.logApiError(apiError);

        // Track API Error
        analyticsService.trackEvent(AnalyticsEvents.API_ERROR, {
            status,
            endpoint: config?.url,
            method: config?.method,
            message: message.slice(0, 100), // Cap length
        });

        // Performance Tracking: SLOW_API_RESPONSE (even on error)
        const startTime = config?.metadata?.startTime;
        if (startTime) {
            const duration = Date.now() - startTime;
            if (duration > 3000) {
                analyticsService.trackEvent(AnalyticsEvents.SLOW_API_RESPONSE, {
                    endpoint: config?.url,
                    duration,
                    method: config?.method,
                    status
                });
            }
        }

        return Promise.reject(apiError);
    }
);

export default apiClient;
