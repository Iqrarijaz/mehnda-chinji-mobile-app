import * as Notifications from 'expo-notifications';

/**
 * Category identifier for a notification that links to a single viewable
 * item (currently: marketplace listings). Attached notifications get a
 * "View Item" / "Dismiss" action pair, both in the foreground in-app
 * banner and in the OS notification tray — supported cross-platform by
 * expo-notifications' category API.
 */
export const ITEM_ACTION_CATEGORY = 'item_actions';

export const VIEW_ITEM_ACTION = 'VIEW_ITEM';
export const DISMISS_ACTION = 'DISMISS';

/**
 * Registers the notification action categories used across the app. Safe
 * to call multiple times (each call just re-registers the same category)
 * — call once at app startup, before any notification with
 * `categoryIdentifier: ITEM_ACTION_CATEGORY` can be scheduled or received.
 */
export async function registerNotificationCategories() {
    try {
        await Notifications.setNotificationCategoryAsync(ITEM_ACTION_CATEGORY, [
            {
                identifier: VIEW_ITEM_ACTION,
                buttonTitle: 'View Item',
                options: { opensAppToForeground: true },
            },
            {
                identifier: DISMISS_ACTION,
                buttonTitle: 'Dismiss',
                options: { opensAppToForeground: false, isDestructive: true },
            },
        ]);
    } catch (error) {
        if (__DEV__) console.warn('Failed to register notification categories:', error);
    }
}
