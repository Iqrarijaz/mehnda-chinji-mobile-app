import { create } from 'zustand';
import { getNotificationPreferences, manageNotifications } from '@/apis/notifications';
import Toast from 'react-native-toast-message';

export interface NotificationPreferences {
    blood: boolean;
    business: boolean;
    education: boolean;
    emergency: boolean;
    govt: boolean;
    health: boolean;
    religious: boolean;
    feed: boolean;
    weather: boolean;
    prayer: boolean;
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
    blood: false,
    business: false,
    education: false,
    emergency: false,
    govt: false,
    health: false,
    religious: true,
    feed: true,
    weather: true,
    prayer: true,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
    preferences: DEFAULT_PREFERENCES,
    isLoading: false,
    isSaving: false,

    initializePreferences: (prefs) => {
        if (prefs) {
            set({ preferences: prefs });
        }
    },

    loadPreferences: async () => {
        set({ isLoading: true });
        try {
            const response = await getNotificationPreferences() as any;
            if (response.success && response.data) {
                set({ preferences: response.data });
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

        try {
            const response = await manageNotifications(newPrefs) as any;
            if (!response.success) {
                throw new Error(response.message || 'Update failed');
            }
            // Toast on success (optional, but requested for feedback)
            Toast.show({
                type: 'success',
                text1: 'Preferences Updated',
                text2: `Successfully toggled ${key} notifications.`
            });
        } catch (error: any) {
            // Rollback on failure
            set({ preferences: previousPrefs });
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
