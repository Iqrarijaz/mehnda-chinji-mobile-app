import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { useAdsStore, selectCanShowInterstitial } from '../store/ads.store';
import { AD_UNIT_IDS } from '../constants/ads';
import { ExponentialBackoff } from './utils/backoff';
import { analyticsService, AnalyticsEvents } from '@/analytics';

class InterstitialService {
  private static instance: InterstitialService | null = null;
  private interstitial: InterstitialAd | null = null;
  private isLoaded = false;
  private isPreloading = false;
  private isShowing = false;
  private triggerCount = 0;
  private backoff = new ExponentialBackoff();
  private loadTimer: any = null;
  private loadStartTime: number = 0;

  private constructor() {}

  public static getInstance(): InterstitialService {
    if (!InterstitialService.instance) {
      InterstitialService.instance = new InterstitialService();
    }
    return InterstitialService.instance;
  }

  private cleanup() {
    if (this.interstitial) {
      this.interstitial.removeAllListeners();
      this.interstitial = null;
    }
    this.isLoaded = false;
    this.isPreloading = false;
  }

  private createAd() {
    this.cleanup();

    try {
      this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
        this.isPreloading = false;
        this.backoff.reset();
        const duration = Date.now() - this.loadStartTime;
        useAdsStore.getState().setAdLoaded('interstitial', true);
        analyticsService.trackEvent(AnalyticsEvents.AD_LOADED, { type: 'interstitial' });
        analyticsService.trackEvent(AnalyticsEvents.AD_LOAD_TIME, { type: 'interstitial', duration });
      });

      this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        this.isShowing = false;
        this.cleanup();
        useAdsStore.getState().setAdLoaded('interstitial', false);
        this.load(); // Auto-preload next
        analyticsService.trackEvent(AnalyticsEvents.AD_CLOSED, { type: 'interstitial' });
      });

      this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('[InterstitialService] Error:', error);
        this.cleanup();
        useAdsStore.getState().setAdLoaded('interstitial', false);
        this.handleLoadError(error);
      });
      
      this.interstitial.addAdEventListener(AdEventType.OPENED, () => {
        this.isShowing = true;
        analyticsService.trackEvent(AnalyticsEvents.AD_SHOWN, { type: 'interstitial' });
      });

    } catch (e) {
      console.error('[InterstitialService] Failed to create ad:', e);
    }
  }

  private handleLoadError(error: Error) {
    const delay = this.backoff.getNextDelay();
    if (delay !== null) {
      console.log(`[InterstitialService] Retrying in ${delay}ms...`);
      if (this.loadTimer) clearTimeout(this.loadTimer);
      this.loadTimer = setTimeout(() => this.load(), delay);
    }
    analyticsService.trackEvent(AnalyticsEvents.AD_FAILED, { type: 'interstitial', error: error.message });
  }

  public load() {
    const canShow = selectCanShowInterstitial(useAdsStore.getState());
    if (!canShow || this.isShowing) return;

    if (!this.interstitial) {
      this.createAd();
    }

    if (this.interstitial && !this.isLoaded && !this.isPreloading) {
      this.isPreloading = true;
      this.loadStartTime = Date.now();
      this.interstitial.load();
    }
  }

  public show(force: boolean = false) {
    const state = useAdsStore.getState();
    const canShow = selectCanShowInterstitial(state);
    
    if (!canShow || this.isShowing) return;

    this.triggerCount++;
    const interval = state.adsConfig.interstitial_interval || 3;

    if (!force && this.triggerCount % interval !== 0) {
      return;
    }

    if (this.isLoaded && this.interstitial) {
      this.interstitial.show();
    } else {
      this.load();
    }
  }
}

export default InterstitialService;
