import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';

const STORAGE_KEYS = {
    HAS_RATED: 'rehbar_has_rated',
    LAST_PROMPT_DATE: 'rehbar_last_prompt_date',
    POSITIVE_ACTION_COUNT: 'rehbar_positive_action_count',
};

const ACTION_THRESHOLD = 5; // Show after 5 positive actions
const COOLDOWN_DAYS = 30; // Wait 30 days before asking again if they dismissed

export const ReviewService = {
    /**
     * Records a positive user action and checks if we should show the rating prompt
     * @returns {Promise<boolean>} True if the prompt should be shown
     */
    recordPositiveAction: async (): Promise<boolean> => {
        try {
            // 1. Check if already rated
            const hasRated = await AsyncStorage.getItem(STORAGE_KEYS.HAS_RATED);
            if (hasRated === 'true') return false;

            // 2. Update action count
            const countStr = await AsyncStorage.getItem(STORAGE_KEYS.POSITIVE_ACTION_COUNT);
            const count = parseInt(countStr || '0') + 1;
            await AsyncStorage.setItem(STORAGE_KEYS.POSITIVE_ACTION_COUNT, count.toString());

            // 3. Check if threshold reached
            if (count < ACTION_THRESHOLD) return false;

            // 4. Check cooldown
            const lastPromptStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT_DATE);
            if (lastPromptStr) {
                const lastPrompt = new Date(lastPromptStr);
                const now = new Date();
                const diffDays = (now.getTime() - lastPrompt.getTime()) / (1000 * 3600 * 24);
                if (diffDays < COOLDOWN_DAYS) return false;
            }

            return true;
        } catch (error) {
            console.error('Error in ReviewService:', error);
            return false;
        }
    },

    /**
     * Marks that the prompt was shown
     */
    markPromptShown: async () => {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT_DATE, new Date().toISOString());
        // Reset count to wait for more engagement before asking again if they didn't rate
        await AsyncStorage.setItem(STORAGE_KEYS.POSITIVE_ACTION_COUNT, '0');
    },

    /**
     * Marks that the user has rated (or agreed to rate)
     */
    markRated: async () => {
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_RATED, 'true');
    },

    /**
     * Opens the store page
     */
    openStore: () => {
        const packageName = 'com.rehbar.community';
        const url = Platform.select({
            ios: `itms-apps://itunes.apple.com/app/id?action=write-review`, // Replace with actual Apple ID later
            android: `market://details?id=${packageName}`,
        });

        if (url) {
            Linking.openURL(url).catch(err => console.error('Error opening store:', err));
        }
    }
};
