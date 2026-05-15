import { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import { useAdsStore, selectCanShowAppOpen } from '../store/ads.store';
import { AD_UNIT_IDS } from '../constants/ads';
import { analyticsService, AnalyticsEvents } from '@/analytics';

class AppOpenService {
  private static instance: AppOpenService | null = null;
  private appOpenAd: AppOpenAd | null = null;
  private isLoaded = false;
  private isShowing = false;
  private lastShowTime = 0;
  private readonly SHOW_COOLDOWN = 30000; // 30 seconds cooldown between app open ads

  private constructor() {}

  public static getInstance(): AppOpenService {
    if (!AppOpenService.instance) {
      AppOpenService.instance = new AppOpenService();
    }
    return AppOpenService.instance;
  }

  private cleanup() {
    if (this.appOpenAd) {
      this.appOpenAd.removeAllListeners();
      this.appOpenAd = null;
    }
    this.isLoaded = false;
  }

  private createAd() {
    this.cleanup();

    try {
      this.appOpenAd = AppOpenAd.createForAdRequest(AD_UNIT_IDS.APP_OPEN, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
        useAdsStore.getState().setAdLoaded('appOpen', true);
        analyticsService.trackEvent(AnalyticsEvents.AD_LOADED, { type: 'app_open' });
      });

      this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        this.isShowing = false;
        this.lastShowTime = Date.now();
        this.cleanup();
        useAdsStore.getState().setAdLoaded('appOpen', false);
        this.load();
        analyticsService.trackEvent(AnalyticsEvents.AD_CLOSED, { type: 'app_open' });
      });

      this.appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('[AppOpenService] Error:', error);
        this.cleanup();
        useAdsStore.getState().setAdLoaded('appOpen', false);
        analyticsService.trackEvent(AnalyticsEvents.AD_FAILED, { type: 'app_open', error: error.message });
      });

      this.appOpenAd.addAdEventListener(AdEventType.OPENED, () => {
        this.isShowing = true;
        analyticsService.trackEvent(AnalyticsEvents.AD_SHOWN, { type: 'app_open' });
      });

    } catch (e) {
      console.error('[AppOpenService] Failed to create ad:', e);
    }
  }

  public load() {
    const canShow = selectCanShowAppOpen(useAdsStore.getState());
    if (!canShow || this.isShowing) return;

    if (!this.appOpenAd) {
      this.createAd();
    }

    if (this.appOpenAd && !this.isLoaded) {
      this.appOpenAd.load();
    }
  }

  /**
   * Shows the app open ad with safety and policy checks
   * @param isProtectedScreen Whether the current screen is onboarding or auth
   */
  public show(isProtectedScreen: boolean = false) {
    const canShow = selectCanShowAppOpen(useAdsStore.getState());
    const now = Date.now();
    
    // Safety checks: Cooldown, loaded state, global enabled flag, and Protected Screen policy
    if (!canShow || this.isShowing || isProtectedScreen || (now - this.lastShowTime < this.SHOW_COOLDOWN)) {
      return;
    }

    if (this.isLoaded && this.appOpenAd) {
      this.isShowing = true;
      this.appOpenAd.show();
    } else {
      this.load();
    }
  }
}

export default AppOpenService;
