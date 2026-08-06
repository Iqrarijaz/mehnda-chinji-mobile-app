import { savePushToken } from '@/apis/profile';
import { useAuth } from '@/context/AuthContext';
import { clientStorage } from '@/utils/storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { handleNotificationNavigation } from '@/utils/notificationNavigation';


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
            if (__DEV__) console.log('🌍 Saving push token locally...');
            // The backend uses FCM tokens for remote pushes, so we do not need to send the 
            // Expo Push Token to the backend. Additionally, Cloudflare WAF often blocks 
            // "ExponentPushToken[...]" strings because of the brackets.
            await updateUser({ pushToken: token });

            if (__DEV__) console.log('✅ Push token saved locally.');
        } catch (error) {
            if (__DEV__) console.error('❌ Failed to save push token locally:', error);
        }
    }, [updateUser]);

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

                if (data) {
                    handleNotificationNavigation(data as Record<string, any>, router);
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
