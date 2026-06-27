import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useSystemNotificationStore, FALLBACK_SYSTEM_NOTIFICATIONS } from '@/store/systemNotificationStore';
import { useAuth } from '@/context/AuthContext';

export const useSystemPushNotifications = () => {
    const { config, fetchSystemConfig, hasFetched } = useSystemNotificationStore();
    const { isAuthenticated } = useAuth();

    // Fetch config lazily, only if the user is authenticated
    useEffect(() => {
        if (!isAuthenticated || hasFetched) return;

        // Delay the fetch to reduce load on app startup/splash screen
        const timer = setTimeout(() => {
            fetchSystemConfig();
        }, 10000); // 10 seconds delay

        return () => clearTimeout(timer);
    }, [fetchSystemConfig, isAuthenticated, hasFetched]);

    // React to config changes and schedule
    useEffect(() => {
        const syncNotifications = async () => {
            if (!hasFetched) return;

            try {
                // 1. Check permissions
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    // Usually permissions are asked in registerForPushNotificationsAsync
                    // but we can ensure we only schedule if granted.
                    const { status } = await Notifications.getPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    if (__DEV__) console.log('Skipping system push scheduling: Push permissions not granted.');
                    return;
                }

                // 2. Fetch all currently scheduled notifications
                const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                const activeConfig = config || FALLBACK_SYSTEM_NOTIFICATIONS;

                // 3. Cancel previously scheduled notifications that match our system types to avoid duplicates/stale times
                for (const n of scheduled) {
                    const type = n.content.data?.type;
                    if (typeof type === 'string' && activeConfig[type]) {
                        await Notifications.cancelScheduledNotificationAsync(n.identifier);
                    } else if (
                        typeof type === 'string' &&
                        ['SURAH_YASEEN', 'SURAH_MULK', 'WEATHER_ALERT', 'DAILY_DUA'].includes(type)
                    ) {
                        // Cleanup old notifications even if they are removed from remote config
                        await Notifications.cancelScheduledNotificationAsync(n.identifier);
                    }
                }

                // 4. Schedule new notifications
                for (const [key, item] of Object.entries(activeConfig)) {
                    if (!item.enabled) continue;

                    // Fallback configuration if missing from remote
                    const fallbackItem = FALLBACK_SYSTEM_NOTIFICATIONS[key];
                    const notificationTitle = item.notification?.title || fallbackItem?.notification?.title || 'Notification';
                    const notificationBody = item.notification?.body || fallbackItem?.notification?.body || 'You have a new message.';

                    // Route mapping (use backend route if provided, otherwise fallback to hardcoded mappings)
                    let route: string | undefined = item.notification?.route || fallbackItem?.notification?.route;
                    if (!route) {
                        if (key === 'SURAH_YASEEN') route = '/quran/36';
                        if (key === 'SURAH_MULK') route = '/quran/67';
                        if (key === 'WEATHER_ALERT') route = '/weather';
                    }

                    // Parse times
                    for (const timeStr of item.times) {
                        const [hourStr, minuteStr] = timeStr.split(':');
                        const hour = parseInt(hourStr, 10);
                        const minute = parseInt(minuteStr, 10);

                        if (!isNaN(hour) && !isNaN(minute)) {
                            await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: notificationTitle,
                                    body: notificationBody,
                                    sound: true,
                                    data: {
                                        type: key, // Keep the uppercase key as the type
                                        route,
                                    },
                                },
                                trigger: {
                                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                                    hour,
                                    minute,
                                },
                            });
                        }
                    }
                }

                if (__DEV__) console.log('✅ Synced dynamic system push notifications.');

            } catch (error) {
                console.warn('Failed to sync system push notifications', error);
            }
        };

        syncNotifications();
    }, [config, hasFetched]);
};
