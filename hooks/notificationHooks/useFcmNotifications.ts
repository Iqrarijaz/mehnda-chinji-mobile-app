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
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export const useFcmNotifications = () => {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const { isAuthenticated, updateUser } = useAuth();
    const router = useRouter();

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
            
            // Trigger a local notification so the user sees the FCM message in the foreground
            if (remoteMessage.notification) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: remoteMessage.notification.title,
                        body: remoteMessage.notification.body,
                        data: remoteMessage.data,
                    },
                    trigger: null, // Show immediately
                });
            }
        });

        // Handle background taps
        const unsubscribeOnNotificationOpenedApp = messagingInstance.onNotificationOpenedApp(remoteMessage => {
            if (__DEV__) console.log('👉 FCM Notification caused app to open from background:', remoteMessage);
            if (remoteMessage.data?.route) {
                router.push(remoteMessage.data.route as any);
            }
        });

        // Handle quit state taps
        messagingInstance.getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                if (__DEV__) console.log('👉 FCM Notification caused app to open from quit state:', remoteMessage);
                if (remoteMessage.data?.route) {
                    setTimeout(() => {
                        router.push(remoteMessage.data.route as any);
                    }, 1000);
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribeTokenRefresh();
            unsubscribeOnMessage();
            unsubscribeOnNotificationOpenedApp();
        };
    }, [isAuthenticated, syncFcmTokenWithBackend]);

    return { fcmToken };
};
