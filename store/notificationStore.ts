import { create } from 'zustand';
import { getNotificationPreferences, manageNotifications } from '@/apis/notifications';
import Toast from 'react-native-toast-message';
import { NOTIFICATION_TOPICS } from '@/constants/notificationTopics';
import { getMessaging, subscribeToTopic, unsubscribeFromTopic } from '@react-native-firebase/messaging';

export interface NotificationPreferences {
    business: boolean;
    education: boolean;
    emergency: boolean;
    govt: boolean;
    health: boolean;
    religious: boolean;
    weather: boolean;
    prayer: boolean;
    cricket: boolean;
    fuel: boolean;
}

interface NotificationState {
    preferences: NotificationPreferences;
    isLoading: boolean;
    isSaving: boolean;
    loadPreferences: () => Promise<void>;
    setPreference: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
    initializePreferences: (prefs: NotificationPreferences) => void;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    business: false,
    education: false,
    emergency: false,
    govt: false,
    health: false,
    religious: true,
    weather: true,
    prayer: true,
    cricket: true,
    fuel: true,
};

const syncFCMSubscriptions = async (prefs: NotificationPreferences) => {
    try {
        const messagingInstance = getMessaging();
        const promises = Object.entries(NOTIFICATION_TOPICS).map(async ([key, topic]) => {
            const isEnabled = prefs[key as keyof NotificationPreferences];
            if (isEnabled) {
                await subscribeToTopic(messagingInstance, topic);
            } else {
                await unsubscribeFromTopic(messagingInstance, topic);
            }
        });
        await Promise.all(promises);
        if (__DEV__) console.log('📡 Synced all FCM topic subscriptions.');
    } catch (error) {
        console.error('Failed to sync FCM topic subscriptions:', error);
    }
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
    preferences: DEFAULT_PREFERENCES,
    isLoading: false,
    isSaving: false,

    initializePreferences: (prefs) => {
        if (prefs) {
            set({ preferences: prefs });
            syncFCMSubscriptions(prefs);
        }
    },

    loadPreferences: async () => {
        set({ isLoading: true });
        try {
            const response = await getNotificationPreferences() as any;
            if (response.success && response.data) {
                set({ preferences: response.data });
                syncFCMSubscriptions(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load notification preferences:', error);
            Toast.show({
                type: 'error',
                text1: 'Update Error',
                text2: 'Could not fetch current preferences.'
            });
        } finally {
            set({ isLoading: false });
        }
    },

    setPreference: async (key, value) => {
        const previousPrefs = get().preferences;
        const newPrefs = { ...previousPrefs, [key]: value };

        // Optimistic update
        set({ preferences: newPrefs, isSaving: true });

        // Update FCM subscription locally
        const topic = NOTIFICATION_TOPICS[key];
        if (topic) {
            try {
                const messagingInstance = getMessaging();
                if (value) {
                    await subscribeToTopic(messagingInstance, topic);
                    if (__DEV__) console.log(`📡 Subscribed to FCM topic: ${topic}`);
                } else {
                    await unsubscribeFromTopic(messagingInstance, topic);
                    if (__DEV__) console.log(`📡 Unsubscribed from FCM topic: ${topic}`);
                }
            } catch (topicError) {
                console.error(`Failed to toggle FCM subscription for ${topic}:`, topicError);
            }
        }

        try {
            const response = await manageNotifications(newPrefs) as any;
            if (!response.success) {
                throw new Error(response.message || 'Update failed');
            }
        } catch (error: any) {
            // Rollback on failure
            set({ preferences: previousPrefs });
            
            // Rollback FCM subscription locally
            if (topic) {
                try {
                    const messagingInstance = getMessaging();
                    if (previousPrefs[key]) {
                        await subscribeToTopic(messagingInstance, topic);
                    } else {
                        await unsubscribeFromTopic(messagingInstance, topic);
                    }
                } catch (rollbackError) {
                    console.error('FCM rollback failed:', rollbackError);
                }
            }

            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error.message || 'Could not sync preferences with server.'
            });
        } finally {
            set({ isSaving: false });
        }
    },
}));
