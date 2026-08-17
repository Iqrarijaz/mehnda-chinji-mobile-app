import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { secureStorage } from '@/utils/storage';
import { tokenCache } from '@/lib/tokenCache';
import { getDeviceInfo } from '@/lib/deviceInfo';

/**
 * Resolves the current auth token (in-memory cache first, SecureStore as a
 * cold-start fallback) and attaches it plus device/app metadata headers to
 * the outgoing request.
 */
export async function attachAuthHeaders(config: any): Promise<void> {
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
}

/**
 * Handles session expiration on 401 responses (excluding the login request
 * itself). Clears the cached token and persisted user data; redirection is
 * handled reactively elsewhere via the tokenCache listener (AuthContext).
 */
export function handleUnauthorized(error: any): void {
    const config = error.config as any;
    const status = error.response?.status;
    const isLoginRequest = config?.url?.includes('login');

    if (status === 401 && !isLoginRequest) {
        tokenCache.setSessionExpired(true);
        tokenCache.clear();
        secureStorage.removeItem('userData');
    }
}
