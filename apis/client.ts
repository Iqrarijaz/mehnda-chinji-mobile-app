import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { baseUrl } from '@/configs';
import { errorLogger } from '@/lib/errorLogger';
import { secureStorage } from '@/utils/storage';
import { useDataUsageStore } from '@/store/dataUsageStore';

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
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token & Measure Request Size
apiClient.interceptors.request.use(
    async (config: any) => {
        try {
            // Measure request size
            const requestData = config.data ? JSON.stringify(config.data) : '';
            config.metadata = { requestSize: requestData.length };

            const userData = await secureStorage.getItem('userData');
            if (userData) {
                const { token } = JSON.parse(userData);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.error('API Client: Error fetching token', error);
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
            const responseData = response.data ? JSON.stringify(response.data) : '';
            const responseSize = responseData.length;
            const totalBytes = requestSize + responseSize;

            if (totalBytes > 0) {
                useDataUsageStore.getState().trackUsage(totalBytes);
            }
        } catch (e) {
            console.warn('Data Usage Tracking Error:', e);
        }

        return response.data;
    },
    (error: AxiosError) => {
        // Still track usage even on error if response exists
        if (error.response) {
            try {
                const requestSize = (error.config as any)?.metadata?.requestSize || 0;
                const responseData = error.response.data ? JSON.stringify(error.response.data) : '';
                const responseSize = responseData.length;
                useDataUsageStore.getState().trackUsage(requestSize + responseSize);
            } catch (e) { }
        }

        const message = (error.response?.data as any)?.message || error.message || 'An unexpected error occurred';
        const status = error.response?.status;
        const code = (error.response?.data as any)?.code;
        const data = error.response?.data;

        const apiError = new ApiError(message, status, code, data);
        errorLogger.logApiError(apiError);

        return Promise.reject(apiError);
    }
);

export default apiClient;
