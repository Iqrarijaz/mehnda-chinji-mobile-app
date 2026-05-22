import {
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { AppState, AppStateStatus } from 'react-native';

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

  private loadTimer: ReturnType<typeof setTimeout> | null = null;
  private showPendingTimer: ReturnType<typeof setTimeout> | null = null;

  private loadStartTime = 0;
  private showPending = false;
  private readonly SHOW_PENDING_TIMEOUT = 5000;

  private backoff = new ExponentialBackoff();

  private appStateSubscription: any = null;

  private constructor() {
    this.handleAppState();
  }

  public static getInstance(): RewardedService {
    if (!RewardedService.instance) {
      RewardedService.instance = new RewardedService();
    }

    return RewardedService.instance;
  }

  /**
   * ----------------------------------------
   * App State Handling
   * ----------------------------------------
   */
  private handleAppState() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.onAppStateChange,
    );
  }

  private onAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      const canShow = selectCanShowRewarded(useAdsStore.getState());

      if (
        canShow &&
        !this.isLoaded &&
        !this.isPreloading &&
        !this.isShowing
      ) {
        this.load();
      }
    }
  };

  /**
   * ----------------------------------------
   * Cleanup
   * ----------------------------------------
   */
  private cleanupAd() {
    if (this.rewarded) {
      this.rewarded.removeAllListeners();
      this.rewarded = null;
    }

    this.isLoaded = false;
    this.isPreloading = false;
  }

  private clearTimers() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }

    if (this.showPendingTimer) {
      clearTimeout(this.showPendingTimer);
      this.showPendingTimer = null;
    }
  }

  public destroy() {
    this.clearTimers();
    this.cleanupAd();

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * ----------------------------------------
   * Create Ad
   * ----------------------------------------
   */
  private createAd() {
    this.cleanupAd();

    try {
      this.rewarded = RewardedAd.createForAdRequest(
        __DEV__
          ? TestIds.REWARDED
          : AD_UNIT_IDS.REWARDED,
        {
          // Remove this unless legally required
          // requestNonPersonalizedAdsOnly: true,
        },
      );

      /**
       * Loaded
       */
      this.rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          this.isLoaded = true;
          this.isPreloading = false;

          this.backoff.reset();

          const duration = Date.now() - this.loadStartTime;

          useAdsStore
            .getState()
            .setAdLoaded('rewarded', true);

          analyticsService.trackEvent(
            AnalyticsEvents.AD_LOADED,
            {
              type: 'rewarded',
            },
          );

          analyticsService.trackEvent(
            AnalyticsEvents.AD_LOAD_TIME,
            {
              type: 'rewarded',
              duration,
            },
          );

          // If a show request is pending, show it immediately once loaded
          if (this.showPending && this.rewarded) {
            this.showPending = false;
            if (this.showPendingTimer) {
              clearTimeout(this.showPendingTimer);
              this.showPendingTimer = null;
            }
            try {
              this.isShowing = true;
              this.rewarded.show();
            } catch (error) {
              this.isShowing = false;
              console.error(
                '[RewardedService] Pending show failed:',
                error,
              );
            }
          }
        },
      );

      /**
       * Opened
       */
      this.rewarded.addAdEventListener(
        AdEventType.OPENED,
        () => {
          analyticsService.trackEvent(
            AnalyticsEvents.AD_SHOWN,
            {
              type: 'rewarded',
            },
          );
        },
      );

      /**
       * Closed
       */
      this.rewarded.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          this.isShowing = false;
          this.showPending = false;

          useAdsStore
            .getState()
            .setAdLoaded('rewarded', false);

          analyticsService.trackEvent(
            AnalyticsEvents.AD_CLOSED,
            {
              type: 'rewarded',
            },
          );

          this.cleanupAd();

          // preload next ad
          this.load();
        },
      );

      /**
       * Earned Reward
       */
      this.rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          if (this.onRewardEarned) {
            this.onRewardEarned();
            this.onRewardEarned = null;
          }

          analyticsService.trackEvent(
            AnalyticsEvents.AD_REWARD_EARNED,
            {
              type: 'rewarded',
              reward,
            },
          );
        },
      );

      /**
       * Error
       */
      this.rewarded.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error(
            '[RewardedService] Error:',
            error,
          );

          this.isShowing = false;
          this.isLoaded = false;
          this.isPreloading = false;
          this.showPending = false;

          useAdsStore
            .getState()
            .setAdLoaded('rewarded', false);

          analyticsService.trackEvent(
            AnalyticsEvents.AD_FAILED,
            {
              type: 'rewarded',
              error: error.message,
            },
          );

          this.cleanupAd();

          this.handleLoadError();
        },
      );

      /**
       * Revenue Tracking
       */
      this.rewarded.addAdEventListener(
        AdEventType.PAID,
        (value: any) => {
          if (!value) return;

          analyticsService.trackEvent(
            AnalyticsEvents.AD_REVENUE,
            {
              type: 'rewarded',
              value: value.valueMicros,
              currency: value.currencyCode,
              precision: value.precision,
            },
          );
        },
      );
    } catch (error) {
      console.error(
        '[RewardedService] Failed to create ad:',
        error,
      );
    }
  }

  /**
   * ----------------------------------------
   * Error Retry
   * ----------------------------------------
   */
  private handleLoadError() {
    const config = useAdsStore.getState().adsConfig;
    const baseDelay = config.rewarded_retry_delay || 5000;

    const delay = this.backoff.getNextDelay();

    if (delay === null) {
      console.warn(
        '[RewardedService] Max retry reached.',
      );

      return;
    }

    const finalDelay = Math.max(delay, baseDelay);

    this.clearTimers();

    this.loadTimer = setTimeout(() => {
      this.load();
    }, finalDelay);

    console.log(
      `[RewardedService] Retry in ${finalDelay}ms`,
    );
  }

  /**
   * ----------------------------------------
   * Load Ad
   * ----------------------------------------
   */
  public load() {
    const canShow = selectCanShowRewarded(
      useAdsStore.getState(),
    );

    if (!canShow) {
      return;
    }

    if (this.isShowing) {
      return;
    }

    if (this.isLoaded || this.isPreloading) {
      return;
    }

    if (!this.rewarded) {
      this.createAd();
    }

    if (!this.rewarded) {
      return;
    }

    try {
      this.isPreloading = true;
      this.loadStartTime = Date.now();

      this.rewarded.load();
    } catch (error) {
      console.error(
        '[RewardedService] Load failed:',
        error,
      );

      this.isPreloading = false;

      this.handleLoadError();
    }
  }

  /**
   * ----------------------------------------
   * Show Ad
   * ----------------------------------------
   */
  public async show(onReward: () => void) {
    if (this.isLoaded && this.rewarded) {
      try {
        this.isShowing = true;
        this.onRewardEarned = onReward;

        await this.rewarded.show();

        return true;
      } catch (error) {
        console.error(
          '[RewardedService] Show failed:',
          error,
        );

        this.isShowing = false;

        return false;
      }
    }

    this.load();

    // Queue the show request for when the ad finishes loading
    this.showPending = true;
    this.onRewardEarned = onReward;

    if (this.showPendingTimer) {
      clearTimeout(this.showPendingTimer);
    }

    this.showPendingTimer = setTimeout(() => {
      this.showPending = false;
      this.onRewardEarned = null;
    }, this.SHOW_PENDING_TIMEOUT);

    return false;
  }

  public getIsLoaded() {
    return this.isLoaded;
  }
}

export default RewardedService;
