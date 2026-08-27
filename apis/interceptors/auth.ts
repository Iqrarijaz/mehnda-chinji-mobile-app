import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { secureStorage } from '@/utils/storage';
import { tokenCache } from '@/lib/tokenCache';
import { getDeviceInfo } from '@/lib/deviceInfo';
import { refreshAccessToken } from './refresh';

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
 * Signs the user out locally. Redirection is handled reactively elsewhere via
 * the tokenCache listener (AuthContext).
 */
function forceSignOut(): void {
    tokenCache.setSessionExpired(true);
    tokenCache.clear();
    secureStorage.removeItem('userData');
}

/**
 * Handles a 401 by trying to renew the session before giving up on it.
 *
 * Returns a promise for the replayed request when the token was renewed, or
 * `null` when the caller should carry on down the error pipeline. Previously
 * every 401 signed the user out on the spot, which meant an access token
 * lapsing — an ordinary, expected event — looked identical to being revoked.
 *
 * Requests excluded from this:
 *  - login and refresh calls, where a 401 is the answer, not a stale token;
 *  - a request already replayed once, guarded by `_retriedAfterRefresh`, so a
 *    server that returns 401 no matter what cannot drive an endless loop.
 */
export async function handleUnauthorized(error: any, apiClient: any): Promise<any | null> {
    const config = error.config as any;
    const status = error.response?.status;

    if (status !== 401 || !config) return null;

    const url: string = config.url || '';
    if (url.includes('login') || url.includes('refresh-token')) return null;

    if (config._retriedAfterRefresh) {
        forceSignOut();
        return null;
    }

    const newToken = await refreshAccessToken();
    if (!newToken) {
        forceSignOut();
        return null;
    }

    config._retriedAfterRefresh = true;
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` };
    return apiClient(config);
}
