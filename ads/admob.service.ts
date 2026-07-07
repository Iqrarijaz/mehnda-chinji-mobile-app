import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import remoteConfig from '@react-native-firebase/remote-config';
import { useAdsStore } from '../store/ads.store';
import { DEFAULT_ADS_CONFIG, AdsConfig } from '../types/ads.types';
import { FORCE_PROD_ADS_IN_DEV } from '../constants/ads';

const FETCH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

class AdMobService {
  private static instance: AdMobService;
  private isInitialized = false;

  private constructor() { }

  public static getInstance(): AdMobService {
    if (!AdMobService.instance) {
      AdMobService.instance = new AdMobService();
    }
    return AdMobService.instance;
  }

  /**
   * Initializes the entire monetization stack: UMP -> SDK -> Remote Config
   */
  public async init() {
    if (this.isInitialized) return;

    try {
      // 1. Handle User Consent (UMP)
      await this.handleConsent();

      // 2. Initialize AdMob SDK
      const adapterStatuses = await mobileAds().initialize();
      console.log('[AdMobService] SDK Initialized', adapterStatuses);

      this.isInitialized = true;

      // 3. Setup Remote Config (Force fresh fetch on startup/boot)
      await this.setupRemoteConfig(true);

    } catch (error) {
      console.error('[AdMobService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handles AdMob User Messaging Platform (UMP) consent flow
   */
  private async handleConsent() {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();

      if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
        const { status } = await AdsConsent.showForm();
        console.log('[AdMobService] Consent status after form:', status);
      }
    } catch (error) {
      console.warn('[AdMobService] UMP Consent error (non-fatal):', error);
    }
  }

  private async setupRemoteConfig(force = false) {
    const { setAdsConfig, setLoading, setLastFetchedAt, lastFetchedAt } = useAdsStore.getState();

    try {
      setLoading(true);
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: force ? 0 : FETCH_INTERVAL_MS,
      });

      const configStr = JSON.stringify(DEFAULT_ADS_CONFIG);
      await remoteConfig().setDefaults({
        test_ads: configStr,
        prod_ads: configStr,
      });

      const now = Date.now();
      const shouldFetch = force || !lastFetchedAt || (now - lastFetchedAt > FETCH_INTERVAL_MS);

      if (shouldFetch) {
        await remoteConfig().fetchAndActivate();
        setLastFetchedAt(now);
        console.log('[AdMobService] Remote Config fetched and activated successfully.');
      }

      const configKey = (__DEV__ && !FORCE_PROD_ADS_IN_DEV) ? 'test_ads' : 'prod_ads';
      const adsJson = remoteConfig().getValue(configKey).asString();
      const config = this.parseConfig(adsJson);

      setAdsConfig(config);
    } catch (error) {
      console.error('[AdMobService] Remote Config error:', error);
    } finally {
      setLoading(false);
    }
  }

  public async refreshConfig(force = false): Promise<void> {
    // Re-fetch remote config and update ads configuration
    await this.setupRemoteConfig(force);
  }

  private parseConfig(json: string): AdsConfig {
    if (!json || json === '') return DEFAULT_ADS_CONFIG;
    try {
      const parsed = JSON.parse(json);
      return { ...DEFAULT_ADS_CONFIG, ...parsed };
    } catch (e) {
      return DEFAULT_ADS_CONFIG;
    }
  }
}

export default AdMobService.getInstance();
