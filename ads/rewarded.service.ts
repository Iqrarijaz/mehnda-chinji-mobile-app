import { RewardedAd, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { useAdsStore, selectCanShowRewarded } from '../store/ads.store';
import { AD_UNIT_IDS } from '../constants/ads';
import { ExponentialBackoff } from './utils/backoff';
import { analyticsService, AnalyticsEvents } from '@/analytics';

class RewardedService {
  private static instance: RewardedService | null = null;
  private rewarded: RewardedAd | null = null;
  private isLoaded = false;
  private isPreloading = false;
  private isShowing = false;
  private onRewardEarned: (() => void) | null = null;
  private backoff = new ExponentialBackoff();
  private loadTimer: any = null;
  private loadStartTime: number = 0;

  private constructor() {}

  public static getInstance(): RewardedService {
    if (!RewardedService.instance) {
      RewardedService.instance = new RewardedService();
    }
    return RewardedService.instance;
  }

  private cleanup() {
    if (this.rewarded) {
      this.rewarded.removeAllListeners();
      this.rewarded = null;
    }
    this.isLoaded = false;
    this.isPreloading = false;
  }

  private createAd() {
    this.cleanup();

    try {
      this.rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.isLoaded = true;
        this.isPreloading = false;
        this.backoff.reset();
        const duration = Date.now() - this.loadStartTime;
        useAdsStore.getState().setAdLoaded('rewarded', true);
        analyticsService.trackEvent(AnalyticsEvents.AD_LOADED, { type: 'rewarded' });
        analyticsService.trackEvent(AnalyticsEvents.AD_LOAD_TIME, { type: 'rewarded', duration });
      });

      this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        this.isShowing = false;
        this.cleanup();
        useAdsStore.getState().setAdLoaded('rewarded', false);
        this.load();
        analyticsService.trackEvent(AnalyticsEvents.AD_CLOSED, { type: 'rewarded' });
      });

      this.rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        if (this.onRewardEarned) {
          this.onRewardEarned();
          this.onRewardEarned = null;
        }
        analyticsService.trackEvent(AnalyticsEvents.AD_REWARD_EARNED, { type: 'rewarded', reward });
      });

      this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('[RewardedService] Error:', error);
        this.cleanup();
        useAdsStore.getState().setAdLoaded('rewarded', false);
        this.handleLoadError(error);
      });

      this.rewarded.addAdEventListener(AdEventType.OPENED, () => {
        this.isShowing = true;
        analyticsService.trackEvent(AnalyticsEvents.AD_SHOWN, { type: 'rewarded' });
      });

    } catch (e) {
      console.error('[RewardedService] Error:', e);
    }
  }

  private handleLoadError(error: Error) {
    const config = useAdsStore.getState().adsConfig;
    const baseDelay = config.rewarded_retry_delay || 5000;
    
    const delay = this.backoff.getNextDelay();
    if (delay !== null) {
      const finalDelay = Math.max(delay, baseDelay);
      if (this.loadTimer) clearTimeout(this.loadTimer);
      this.loadTimer = setTimeout(() => this.load(), finalDelay);
    }
    analyticsService.trackEvent(AnalyticsEvents.AD_FAILED, { type: 'rewarded', error: error.message });
  }

  public load() {
    const canShow = selectCanShowRewarded(useAdsStore.getState());
    if (!canShow || this.isShowing) return;

    if (!this.rewarded) {
      this.createAd();
    }

    if (this.rewarded && !this.isLoaded && !this.isPreloading) {
      this.isPreloading = true;
      this.loadStartTime = Date.now();
      this.rewarded.load();
    }
  }

  public async show(onReward: () => void) {
    if (this.isLoaded && this.rewarded) {
      this.onRewardEarned = onReward;
      this.rewarded.show();
      return true;
    }
    this.load();
    return false;
  }

  public getIsLoaded() {
    return this.isLoaded;
  }
}

export default RewardedService;
