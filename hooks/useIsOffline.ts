import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Reactive connectivity flag for screens that want to explain *why* they're
 * showing stale/cached data (e.g. the Currency screen's "last known rates"
 * subtitle) — separate from the app-wide `NetworkMonitor`/`OfflineIndicator`,
 * which only shows a global banner and doesn't expose the state to screens.
 */
export function useIsOffline(): boolean {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const isConnected = !!state.isConnected && state.isInternetReachable !== false;
            setIsOffline(!isConnected);
        });
        return () => unsubscribe();
    }, []);

    return isOffline;
}
