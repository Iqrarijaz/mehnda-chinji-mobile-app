import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DataUsageState {
    total: number;     // total bytes
    wifi: number;      // wifi bytes
    mobile: number;    // mobile bytes
    resetDate: string; // last reset
    networkType: 'wifi' | 'cellular' | 'none';

    // Toggles
    lowDataMode: boolean;
    downloadWifiOnly: boolean;
    autoSyncMobile: boolean;
    backgroundUsage: boolean;

    // Actions
    setNetworkType: (type: 'wifi' | 'cellular' | 'none') => void;
    trackUsage: (bytes: number) => void;
    resetUsage: () => void;
    toggleSetting: (setting: 'lowDataMode' | 'downloadWifiOnly' | 'autoSyncMobile' | 'backgroundUsage') => void;
    clearCache: () => Promise<void>;
}

export const useDataUsageStore = create<DataUsageState>()(
    persist(
        (set, get) => ({
            total: 0,
            wifi: 0,
            mobile: 0,
            resetDate: new Date().toISOString(),
            networkType: 'none',

            lowDataMode: false,
            downloadWifiOnly: true,
            autoSyncMobile: false,
            backgroundUsage: true,

            setNetworkType: (type) => set({ networkType: type }),

            trackUsage: (bytes) => {
                const { networkType, total, wifi, mobile } = get();
                if (networkType === 'wifi') {
                    set({ wifi: wifi + bytes });
                } else if (networkType === 'cellular') {
                    set({ mobile: mobile + bytes });
                }
                set({ total: total + bytes });
            },

            resetUsage: () => set({
                total: 0,
                wifi: 0,
                mobile: 0,
                resetDate: new Date().toISOString()
            }),

            toggleSetting: (setting) => set((state) => ({
                [setting]: !state[setting]
            })),

            clearCache: async () => {
                // Placeholder for actual cache clearing logic if needed
                // For now, we simulate success
                return new Promise((resolve) => setTimeout(resolve, 1000));
            },
        }),
        {
            name: 'dataUsage-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                total: state.total,
                wifi: state.wifi,
                mobile: state.mobile,
                resetDate: state.resetDate,
                lowDataMode: state.lowDataMode,
                downloadWifiOnly: state.downloadWifiOnly,
                autoSyncMobile: state.autoSyncMobile,
                backgroundUsage: state.backgroundUsage,
            }),
        }
    )
);
