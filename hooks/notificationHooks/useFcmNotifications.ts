import { useEffect, useState, useCallback } from 'react';
import { 
    getMessaging, 
    requestPermission, 
    getToken, 
    subscribeToTopic, 
    onTokenRefresh, 
    onMessage,
    AuthorizationStatus 
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { saveFcmToken } from '@/apis/profile';
import { useAuth } from '@/context/AuthContext';

export const useFcmNotifications = () => {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const { isAuthenticated, updateUser } = useAuth();

    const requestUserPermission = async () => {
        try {
            const messagingInstance = getMessaging();
            const authStatus = await requestPermission(messagingInstance);
            const enabled =
                authStatus === AuthorizationStatus.AUTHORIZED ||
                authStatus === AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                if (__DEV__) console.log('🔔 FCM authorization status:', authStatus);
                return true;
            }
            if (__DEV__) console.warn('❌ FCM permission not granted');
            return false;
        } catch (error) {
            if (__DEV__) console.error('🔥 FCM permission request failed:', error);
            return false;
        }
    };

    const getFcmToken = async () => {
        try {
            // Get the device token
            const messagingInstance = getMessaging();
            const token = await getToken(messagingInstance);
            if (token) {
                if (__DEV__) console.log('🔑 FCM Device Token:', token);
                return token;
            }
            return null;
        } catch (error) {
            if (__DEV__) console.error('🔥 Failed to get FCM token:', error);
            return null;
        }
    };

    const syncFcmTokenWithBackend = useCallback(async (token: string) => {
        if (!isAuthenticated) return;
        try {
            if (__DEV__) console.log('🌍 Syncing FCM token with backend...');
            await saveFcmToken({ fcmToken: token });
            await updateUser({ fcmToken: token });
            if (__DEV__) console.log('✅ FCM token synced successfully.');
        } catch (error) {
            if (__DEV__) console.error('❌ Failed to sync FCM token:', error);
        }
    }, [isAuthenticated, updateUser]);

    useEffect(() => {
        if (!isAuthenticated) return;

        let isMounted = true;
        const messagingInstance = getMessaging();

        const initFCM = async () => {
            const hasPermission = await requestUserPermission();
            if (!hasPermission) return;

            const token = await getFcmToken();
            if (token && isMounted) {
                setFcmToken(token);

                await syncFcmTokenWithBackend(token);

                // Subscribe to default topics
                try {
                    await subscribeToTopic(messagingInstance, 'global');

                    if (__DEV__) console.log('📡 Subscribed to default FCM topics');
                } catch (err) {
                    if (__DEV__) console.warn('⚠️ Topic subscription failed:', err);
                }
            }
        };

        initFCM();

        // Listen to token refreshes
        const unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async (token) => {
            if (isMounted) {
                setFcmToken(token);
                await syncFcmTokenWithBackend(token);
            }
        });

        // Handle foreground messages
        const unsubscribeOnMessage = onMessage(messagingInstance, async (remoteMessage) => {
            if (__DEV__) console.log('📩 A new FCM message arrived in foreground!', remoteMessage);
            // Firebase messages in the foreground do not automatically show a system notification alert.
            // Since they want to keep the app notification as they are, we can let local state handle it,
            // or trigger a local notification if needed. For now, we log the message.
        });

        return () => {
            isMounted = false;
            unsubscribeTokenRefresh();
            unsubscribeOnMessage();
        };
    }, [isAuthenticated, syncFcmTokenWithBackend]);

    return { fcmToken };
};
