import { savePushToken } from '@/apis/profile';
import { useAuth } from '@/context/AuthContext';
import { clientStorage } from '@/utils/storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const usePushNotifications = () => {
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [notification, setNotification] =
        useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
    const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

    const { isAuthenticated } = useAuth();

    const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
        try {
            // alert('🚀 Starting push notification registration...');

            if (Platform.OS === 'android') {
                console.log('📱 Setting Android notification channel...');
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            // ---- Permissions ----
            const { status: existingStatus, canAskAgain } =
                await Notifications.getPermissionsAsync();

            console.log('🔐 Existing permission status:', existingStatus);

            let finalStatus = existingStatus;

            if (existingStatus !== 'granted' && canAskAgain) {
                console.log('🔔 Requesting notification permissions...');
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log('🔐 New permission status:', finalStatus);
            }

            if (finalStatus !== 'granted') {
                console.warn('❌ Notification permission not granted:', finalStatus);
                return;
            }

            if (!Device.isDevice) {
                console.warn('❌ Not a physical device. Push tokens require real hardware.');
                return;
            }

            // ---- Project ID ----
            const projectId =
                Constants.expoConfig?.extra?.eas?.projectId ??
                Constants.easConfig?.projectId;

            console.log('🆔 Resolved project ID:', projectId);

            if (!projectId) {
                console.error(
                    '❌ EAS projectId missing. Check app.json → extra.eas.projectId'
                );
                return;
            }

            // ---- Get Token ----
            console.log('📡 Requesting Expo push token...');
            const { data } = await Notifications.getExpoPushTokenAsync({
                projectId,
            });

            console.log('✅ Expo push token received:', data);

            return data;
        } catch (error) {
            console.error('🔥 Push registration failed:', error);
            return;
        }
    };

    const syncTokenWithBackend = useCallback(async (token: string) => {
        try {
            const storedToken = await clientStorage.getItem('push_token');

            if (storedToken === token) {
                console.log('ℹ️ Push token already synced. Skipping backend call.');
                return;
            }

            console.log('🌍 Syncing push token with backend...');
            await savePushToken({ pushToken: token });

            await clientStorage.setItem('push_token', token);
            console.log('✅ Push token synced successfully.');
        } catch (error) {
            console.error('❌ Failed to sync push token:', error);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        registerForPushNotificationsAsync().then(token => {
            if (token && isMounted) {
                setPushToken(token);

                if (isAuthenticated) {
                    syncTokenWithBackend(token);
                }
            }
        });

        notificationListener.current =
            Notifications.addNotificationReceivedListener(notification => {
                console.log('📩 Notification received:', notification);
                setNotification(notification);
            });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(response => {
                console.log('👉 Notification interaction:', response);
            });

        return () => {
            isMounted = false;
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [isAuthenticated, syncTokenWithBackend]);

    return { pushToken, notification };
};