/**
 * In-memory token cache.
 *
 * Avoids reading from SecureStore (encrypted disk I/O) on every API request.
 * The token is set once at login/app-load and cleared at logout.
 * The API interceptor reads from here synchronously — zero I/O per request.
 */

let _token: string | null = null;

export const tokenCache = {
    get: (): string | null => _token,
    set: (token: string): void => { _token = token; },
    clear: (): void => { _token = null; },
};
