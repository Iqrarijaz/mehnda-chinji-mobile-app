/**
 * In-memory token cache.
 *
 * Avoids reading from SecureStore (encrypted disk I/O) on every API request.
 * The token is set once at login/app-load and cleared at logout.
 * The API interceptor reads from here synchronously — zero I/O per request.
 */

let _token: string | null = null;
let _sessionExpired: boolean = false;
const _listeners: (() => void)[] = [];

export const tokenCache = {
    get: (): string | null => _token,
    set: (token: string): void => { 
        _token = token; 
        _sessionExpired = false; // Reset on set
    },
    clear: (): void => { 
        _token = null;
        _listeners.forEach(cb => cb());
    },
    onClear: (callback: () => void) => {
        _listeners.push(callback);
        return () => {
            const index = _listeners.indexOf(callback);
            if (index > -1) _listeners.splice(index, 1);
        };
    },
    isSessionExpired: () => _sessionExpired,
    setSessionExpired: (val: boolean) => { _sessionExpired = val; }
};
