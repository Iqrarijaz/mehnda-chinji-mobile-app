import * as FileSystem from 'expo-file-system/src/legacy';

const CACHE_DIR = `${FileSystem.cacheDirectory}notification_images/`;

/**
 * Downloads a remote notification image to a local file so it can be used
 * as an iOS notification attachment — `UNNotificationAttachment` (which
 * expo-notifications' `attachments` maps to) requires a local file URL, not
 * a remote one. Returns null on any failure so the notification still
 * shows (without the image) rather than failing outright.
 */
export async function downloadNotificationImage(url: string): Promise<string | null> {
    try {
        const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
        }

        const fileUri = `${CACHE_DIR}${Date.now()}.jpg`;
        const result = await FileSystem.downloadAsync(url, fileUri);
        return result.uri;
    } catch (error) {
        if (__DEV__) console.warn('Failed to download notification image:', error);
        return null;
    }
}
