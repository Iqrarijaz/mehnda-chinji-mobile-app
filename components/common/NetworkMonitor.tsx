import React, { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { useDataUsageStore } from '@/store/dataUsageStore';
import OfflineIndicator from './OfflineIndicator';

/**
 * NetworkMonitor component isolates NetInfo listeners and offline state
 * to prevent expensive RootLayout re-renders when connectivity changes.
 */
const NetworkMonitor = () => {
    const [isOffline, setIsOffline] = useState(false);
    const isOfflineRef = useRef(isOffline);

    useEffect(() => {
        isOfflineRef.current = isOffline;
    }, [isOffline]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const isConnected = !!state.isConnected && !!state.isInternetReachable !== false;

            // Track connection changes
            if (isOfflineRef.current !== !isConnected) {
                analyticsService.trackEvent(AnalyticsEvents.CONNECTION_CHANGED, {
                    status: isConnected ? 'online' : 'offline',
                    type: state.type
                });
            }

            setIsOffline(!isConnected);

            // Update data usage store network type
            const store = useDataUsageStore.getState();
            if (!isConnected) {
                store.setNetworkType('none');
            } else if (state.type === 'wifi') {
                store.setNetworkType('wifi');
            } else if (state.type === 'cellular') {
                store.setNetworkType('cellular');
            } else {
                store.setNetworkType('none');
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <OfflineIndicator visible={isOffline} />
    );
};


export default React.memo(NetworkMonitor);
