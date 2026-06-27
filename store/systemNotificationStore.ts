import { create } from 'zustand';
import { getConfiguration } from '@/apis/public';

export interface SystemPushConfigItem {
    enabled: boolean;
    type: string;
    times: string[];
    notification?: {
        title: string;
        body: string;
        route?: string;
    };
}

export type SystemPushConfig = Record<string, SystemPushConfigItem>;

export const FALLBACK_SYSTEM_NOTIFICATIONS: SystemPushConfig = {
    SURAH_YASEEN: {
        enabled: true,
        type: 'daily',
        times: ['06:00'],
        notification: {
            title: '📖 سورۃ یٰسین کی تلاوت کا وقت',
            body: 'اپنی صبح قرآن کے دل، سورۃ یٰسین، کی تلاوت سے روشن کریں۔',
            route: '/quran/36',
        },
    },
    SURAH_MULK: {
        enabled: true,
        type: 'daily',
        times: ['21:00'],
        notification: {
            title: '🌙 سونے سے پہلے سورۃ الملک',
            body: 'نبی ﷺ نے سورۃ الملک کی فضیلت بیان فرمائی۔ آج رات سونے سے پہلے اس کی تلاوت کریں۔',
            route: '/quran/67',
        },
    },
    WEATHER_ALERT: {
        enabled: true,
        type: 'daily',
        times: ['07:00', '22:00'],
        notification: {
            title: '🌧️ Weather Alert',
            body: 'Weather updates are available for your city.',
            route: '/weather',
        },
    },
    DAILY_DUA: {
        enabled: true,
        type: 'daily',
        times: ['08:00'],
        notification: {
            title: '🤲 آج کی دعا',
            body: 'اپنے دن کا آغاز دعا اور ذکر سے کریں۔',
        },
    },
};

interface SystemNotificationState {
    config: SystemPushConfig | null;
    isLoading: boolean;
    hasFetched: boolean;
    fetchSystemConfig: () => Promise<void>;
}

export const useSystemNotificationStore = create<SystemNotificationState>((set) => ({
    config: null,
    isLoading: false,
    hasFetched: false,

    fetchSystemConfig: async () => {
        set({ isLoading: true });
        try {
            const response = await getConfiguration('SYSTEM_PUSH_NOTIFICATIONS') as any;
            if (response.data && response.data.value) {
                // If backend returns { data: { value: { SURAH_YASEEN: {...} } } } 
                // We'll parse or use it directly depending on the backend format
                let configData = response.data.value;
                if (typeof configData === 'string') {
                    configData = JSON.parse(configData);
                }
                set({ config: configData, hasFetched: true });
            } else if (response.data && Object.keys(response.data).length > 0) {
                // In case it returns the object directly
                set({ config: response.data, hasFetched: true });
            } else {
                set({ config: FALLBACK_SYSTEM_NOTIFICATIONS, hasFetched: true });
            }
        } catch (error) {
            console.error('Failed to fetch system push notifications config:', error);
            // Fallback to defaults on error
            set({ config: FALLBACK_SYSTEM_NOTIFICATIONS, hasFetched: true });
        } finally {
            set({ isLoading: false });
        }
    },
}));
