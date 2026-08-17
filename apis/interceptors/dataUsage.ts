import { useDataUsageStore } from '@/store/dataUsageStore';

/**
 * Approximates the outgoing request payload size in bytes. Avoids
 * JSON.stringify on FormData (can be large/slow) and falls back to 0 on
 * non-serializable data.
 */
export function measureRequestSize(config: any): number {
    if (typeof config.data === 'string') {
        return config.data.length;
    }
    if (config.data && !(config.data instanceof FormData)) {
        try {
            return JSON.stringify(config.data).length;
        } catch (e) {
            return 0;
        }
    }
    return 0;
}

/** Records total bytes transferred (request + response) for a successful call. */
export function trackResponseUsage(response: any): void {
    try {
        const requestSize = response.config?.metadata?.requestSize || 0;
        const contentLengthStr = response.headers?.['content-length'];
        const responseSize = contentLengthStr ? parseInt(contentLengthStr as string, 10) : 0;
        const totalBytes = requestSize + responseSize;

        if (totalBytes > 0) {
            useDataUsageStore.getState().trackUsage(totalBytes);
        }
    } catch (e) {
        console.warn('Data Usage Tracking Error:', e);
    }
}

/** Records bytes transferred even when the request ultimately failed (response still present). */
export function trackErrorUsage(error: any): void {
    if (!error.response) return;
    try {
        const config = error.config as any;
        const requestSize = config?.metadata?.requestSize || 0;
        const contentLengthStr = error.response.headers?.['content-length'];
        const responseSize = contentLengthStr ? parseInt(contentLengthStr as string, 10) : 0;
        useDataUsageStore.getState().trackUsage(requestSize + responseSize);
    } catch (e) { }
}
