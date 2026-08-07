import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const ADHAN_CHANNEL_ID = 'adhan-channel-v3';

export async function setupAdhanChannel() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL_ID, {
        name: 'Prayer Notifications',
        description: 'Adhan notification channel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        sound: 'azaan' });
}
