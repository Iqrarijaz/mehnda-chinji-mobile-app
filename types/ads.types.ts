export interface AdsConfig {
  enabled: boolean;
  banner: boolean;
  native: boolean;
  interstitial: boolean;
  rewarded: boolean;
  appOpen: boolean;
  interstitial_interval?: number; // Frequency control for interstitials
  rewarded_retry_delay?: number; // Base delay for rewarded ad retries
}

export interface AdsState {
  adsConfig: AdsConfig;
  isLoading: boolean;
  isAdLoaded: {
    interstitial: boolean;
    rewarded: boolean;
    appOpen: boolean;
  };
  lastFetchedAt: number | null;
  userRole: string | null;
  
  setAdsConfig: (config: AdsConfig) => void;
  setLoading: (loading: boolean) => void;
  setAdLoaded: (type: 'interstitial' | 'rewarded' | 'appOpen', loaded: boolean) => void;
  setLastFetchedAt: (timestamp: number) => void;
  setUserRole: (role: string | null) => void;
}

export const DEFAULT_ADS_CONFIG: AdsConfig = {
  enabled: true,
  banner: true,
  native: true,
  interstitial: true,
  rewarded: true,
  appOpen: true,
  interstitial_interval: 3,
  rewarded_retry_delay: 5000,
};
