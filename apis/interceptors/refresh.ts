import axios from 'axios';
import { baseUrl } from '@/configs';
import { getApiUrl } from '@/lib/remoteConfig';
import { secureStorage } from '@/utils/storage';
import { tokenCache } from '@/lib/tokenCache';

/**
 * Refreshing runs on its own bare axios instance, deliberately.
 *
 * The shared apiClient attaches the (expired) access token and routes failures
 * back through this same 401 handler, so refreshing through it would attach the
 * credential that just failed and recurse on its own failure. A plain instance
 * has neither problem.
 */
const refreshClient = axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

/**
 * In flight refresh, shared by every caller.
 *
 * A screen that fires five queries at once gets five 401s at once. Without
 * this, each would refresh independently: the first rotates the token, the
 * other four then present a token the server has already retired, and the
 * backend reads four spent tokens as a replay and revokes the session — the
 * exact opposite of staying signed in. One refresh, everyone awaits it.
 */
let inFlight: Promise<string | null> | null = null;

async function persistTokens(token: string, refreshToken: string | null): Promise<void> {
    tokenCache.set(token);
    if (refreshToken) tokenCache.setRefresh(refreshToken);

    // Merge into the stored blob rather than replacing it: it also holds the
    // user object, which must survive a refresh untouched.
    try {
        const raw = await secureStorage.getItem('userData');
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.token = token;
        if (refreshToken) parsed.refreshToken = refreshToken;
        await secureStorage.setItem('userData', JSON.stringify(parsed));
    } catch (e) {
        // A failed write is survivable — the in-memory cache carries this run.
        // The next cold start falls back to the stored refresh token.
        console.error('[Refresh] Failed to persist refreshed tokens', e);
    }
}

/**
 * Reads the refresh token from memory, falling back to SecureStore for the
 * cold-start case where AuthContext has not populated the cache yet.
 */
async function resolveRefreshToken(): Promise<string | null> {
    const cached = tokenCache.getRefresh();
    if (cached) return cached;

    try {
        const raw = await secureStorage.getItem('userData');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const stored = parsed?.refreshToken ?? null;
        if (stored) tokenCache.setRefresh(stored);
        return stored;
    } catch {
        return null;
    }
}

async function doRefresh(): Promise<string | null> {
    const refreshToken = await resolveRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await refreshClient.post(
            '/auth/user/refresh-token',
            { refreshToken },
            { baseURL: getApiUrl() }
        );

        const payload = response?.data?.data ?? response?.data;
        const nextToken: string | undefined = payload?.token;
        const nextRefresh: string | undefined = payload?.refreshToken;

        if (!nextToken) return null;

        await persistTokens(nextToken, nextRefresh ?? null);
        return nextToken;
    } catch {
        // Any failure here — expired, revoked, replayed, or offline — means we
        // cannot produce a valid token. The caller signs the user out.
        return null;
    }
}

/**
 * Returns a fresh access token, or null if the session cannot be renewed.
 * Concurrent callers share a single underlying request.
 */
export function refreshAccessToken(): Promise<string | null> {
    if (!inFlight) {
        inFlight = doRefresh().finally(() => { inFlight = null; });
    }
    return inFlight;
}

/** Test seam: drops any shared in-flight refresh. */
export function __resetRefreshState(): void {
    inFlight = null;
}
