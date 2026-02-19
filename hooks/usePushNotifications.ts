import { SAVE_FCM_TOKEN } from '@/apis/profile';
import { useAuth } from '@/context/AuthContext';
import messaging from '@react-native-firebase/messaging';
import { useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export const usePushNotifications = () => {
    const [fcmToken, setFcmToken] = useState<string | undefined>();
    const { user, isAuthenticated } = useAuth();
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);

    async function requestUserPermission() {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                setIsPermissionGranted(true);
                return true;
            }
        } else {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                setIsPermissionGranted(true);
                return true;
            }
        }
        return false;
    }

    async function getFCMToken() {
        try {
            if (!isPermissionGranted) {
                const permission = await requestUserPermission();
                if (!permission) return;
            }

            const token = await messaging().getToken();
            console.log('FCM Token:', token);
            setFcmToken(token);

            if (token && isAuthenticated) {
                await SAVE_FCM_TOKEN({ fcmToken: token });
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    }

    useEffect(() => {
        requestUserPermission();
        getFCMToken();

        // Listen to foreground messages
        const unsubscribe = messaging().onMessage(async remoteMessage => {
            console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
            Alert.alert(
                remoteMessage.notification?.title || 'New Notification',
                remoteMessage.notification?.body
            );
        });

        // Token refresh
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
            console.log('FCM Token Refreshed:', token);
            setFcmToken(token);
            if (isAuthenticated) {
                SAVE_FCM_TOKEN({ fcmToken: token }).catch(console.error);
            }
        });

        return () => {
            unsubscribe();
            unsubscribeTokenRefresh();
        };
    }, [isAuthenticated]);

    return {
        fcmToken,
    };
};
