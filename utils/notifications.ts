import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
    let enabled = false;

    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        enabled = granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
        const authStatus = await messaging().requestPermission();
        enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    }

    if (!enabled) {
        console.log('Permission denied. Notifications will cry silently.');
        return;
    }

    try {
        // Get the device token
        const token = await messaging().getToken();
        console.log("FCM Token:", token);
        return token;
    } catch (e) {
        console.error("Error getting FCM token:", e);
    }
}
