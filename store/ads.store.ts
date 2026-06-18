import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdsConfig, AdsState, DEFAULT_ADS_CONFIG } from '../types/ads.types';

export const useAdsStore = create<AdsState>()(
  persist(
    (set, get) => ({
      adsConfig: DEFAULT_ADS_CONFIG,
      isLoading: false,
      isAdLoaded: {
        interstitial: false,
        rewarded: false,
        appOpen: false,
      },
      lastFetchedAt: null,
      userRole: null,
      lastAppOpenShowTime: 0,
      isShowingAppOpen: false,

      setAdsConfig: (config: AdsConfig) => set({ adsConfig: config }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setAdLoaded: (type, loaded) => set((state) => ({
        isAdLoaded: { ...state.isAdLoaded, [type]: loaded }
      })),
      setLastFetchedAt: (timestamp: number) => set({ lastFetchedAt: timestamp }),
      setUserRole: (role: string | null) => set({ userRole: role }),
      setLastAppOpenShowTime: (time: number) => set({ lastAppOpenShowTime: time }),
      setAppOpenShowing: (showing: boolean) => set({ isShowingAppOpen: showing }),
    }),
    {
      name: 'ads-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        adsConfig: state.adsConfig,
        lastFetchedAt: state.lastFetchedAt,
        userRole: state.userRole,
        lastAppOpenShowTime: state.lastAppOpenShowTime,
      }),
    }
  )
);

// Helper selectors for permission checks
const isNotAdmin = (state: any) => state.userRole !== 'APP_ADMIN';

export const selectCanShowBanner = (state: any) => isNotAdmin(state) && state.adsConfig.enabled && state.adsConfig.banner;
export const selectCanShowInterstitial = (state: any) => isNotAdmin(state) && state.adsConfig.enabled && state.adsConfig.interstitial;
export const selectCanShowRewarded = (state: any) => isNotAdmin(state) && state.adsConfig.enabled && state.adsConfig.rewarded;
export const selectCanShowNative = (state: any) => isNotAdmin(state) && state.adsConfig.enabled && state.adsConfig.native;
export const selectCanShowAppOpen = (state: any) => isNotAdmin(state) && state.adsConfig.enabled && state.adsConfig.appOpen;
