import { savePushToken } from '@/apis/profile';
import { useAuth } from '@/context/AuthContext';
import { clientStorage } from '@/utils/storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';


export const usePushNotifications = () => {
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [notification, setNotification] =
        useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
    const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
    const router = useRouter();

    const { isAuthenticated, updateUser } = useAuth();

    const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            const { status: existingStatus, canAskAgain } =
                await Notifications.getPermissionsAsync();

            let finalStatus = existingStatus;

            if (existingStatus !== 'granted' && canAskAgain) {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                if (__DEV__) console.log('🔐 New permission status:', finalStatus);
            }

            if (finalStatus !== 'granted') {
                if (__DEV__) console.warn('❌ Notification permission not granted:', finalStatus);
                return;
            }

            if (!Device.isDevice) {
                if (__DEV__) console.warn('❌ Not a physical device. Push tokens require real hardware.');
                return;
            }

            // ---- Project ID ----
            const projectId =
                Constants.expoConfig?.extra?.eas?.projectId ??
                Constants.easConfig?.projectId;

            if (__DEV__) console.log('🆔 Resolved project ID:', projectId);

            if (!projectId) {
                if (__DEV__) {
                    console.error(
                        '❌ EAS projectId missing. Check app.json → extra.eas.projectId'
                    );
                }
                return;
            }

            // ---- Get Token ----
            if (__DEV__) console.log('📡 Requesting Expo push token...');
            const { data } = await Notifications.getExpoPushTokenAsync({
                projectId,
            });

            if (__DEV__) console.log('✅ Expo push token received:', data);

            return data;
        } catch (error) {
            if (__DEV__) console.error('🔥 Push registration failed:', error);
            return;
        }
    };

    const syncTokenWithBackend = useCallback(async (token: string) => {
        try {
            if (__DEV__) console.log('🌍 Syncing push token with backend...');
            await savePushToken({ pushToken: token });
            await updateUser({ pushToken: token });

            if (__DEV__) console.log('✅ Push token synced successfully.');
        } catch (error) {
            if (__DEV__) console.error('❌ Failed to sync push token:', error);
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
                if (!isMounted) return;
                if (__DEV__) console.log('📩 Notification received:', notification);
                setNotification(notification);
            });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(response => {
                if (!isMounted) return;
                const data = response.notification.request.content.data;
                if (__DEV__) console.log('👉 Notification interaction:', response);

                if (data?.route) {
                    router.push(data.route as any);
                } else if (data?.type === 'weather_rain') {
                    router.push('/weather');
                } else if (typeof data?.type === 'string' && data.type.toLowerCase() === 'blood') {
                    router.push('/blood');
                }
            });

        return () => {
            isMounted = false;
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [isAuthenticated, syncTokenWithBackend]);

    return { pushToken, notification };
};