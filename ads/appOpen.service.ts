import {
  AppOpenAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { useAdsStore, selectCanShowAppOpen } from '../store/ads.store';
import { AD_UNIT_IDS } from '../constants/ads';
import { ExponentialBackoff } from './utils/backoff';
import { analyticsService, AnalyticsEvents } from '@/analytics';

class AppOpenService {
  private static instance: AppOpenService | null = null;

  private appOpenAd: AppOpenAd | null = null;
  private currentUnitId = '';

  private isLoaded = false;
  private isPreloading = false;
  private isShowing = false;

  private loadTimer: ReturnType<typeof setTimeout> | null = null;

  private loadStartTime = 0;
  private loadedTime = 0;

  private readonly SHOW_COOLDOWN = 0; // Disabled cooldown to show ad on every launch
  private readonly AD_EXPIRATION_TIME = 4 * 60 * 60 * 1000; // 4 hours in milliseconds (Google Policy Limit)

  private backoff = new ExponentialBackoff();

  private constructor() {}

  public static getInstance(): AppOpenService {
    if (!AppOpenService.instance) {
      AppOpenService.instance = new AppOpenService();
    }

    return AppOpenService.instance;
  }

  /**
   * ----------------------------------------
   * Cleanup
   * ----------------------------------------
   */
  private cleanupAd() {
    if (this.appOpenAd) {
      this.appOpenAd.removeAllListeners();
      this.appOpenAd = null;
    }

    this.isLoaded = false;
    this.isPreloading = false;
    this.loadedTime = 0;
  }

  private clearTimers() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
  }

  public destroy() {
    this.clearTimers();
    this.cleanupAd();
  }

  /**
   * ----------------------------------------
   * Create Ad
   * ----------------------------------------
   */
  private createAd() {
    this.cleanupAd();

    const unitId = AD_UNIT_IDS.APP_OPEN;
    this.currentUnitId = unitId;

    try {
      this.appOpenAd = AppOpenAd.createForAdRequest(
        unitId,
        {
          requestNonPersonalizedAdsOnly: true, // GDPR/Privacy compliant by default
        },
      );

      /**
       * Loaded
       */
      this.appOpenAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
          this.isLoaded = true;
          this.isPreloading = false;
          this.loadedTime = Date.now();

          this.backoff.reset();

          const duration = Date.now() - this.loadStartTime;

          useAdsStore
            .getState()
            .setAdLoaded('appOpen', true);

          analyticsService.trackEvent(
            AnalyticsEvents.AD_LOADED,
            {
              type: 'app_open',
            },
          );

          analyticsService.trackEvent(
            AnalyticsEvents.AD_LOAD_TIME,
            {
              type: 'app_open',
              duration,
            },
          );
        },
      );

      /**
       * Opened
       */
      this.appOpenAd.addAdEventListener(
        AdEventType.OPENED,
        () => {
          analyticsService.trackEvent(
            AnalyticsEvents.AD_SHOWN,
            {
              type: 'app_open',
            },
          );
        },
      );

      /**
       * Closed
       */
      this.appOpenAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          this.isShowing = false;
          useAdsStore.getState().setLastAppOpenShowTime(Date.now());
          useAdsStore.getState().setAppOpenShowing(false);

          useAdsStore
            .getState()
            .setAdLoaded('appOpen', false);

          analyticsService.trackEvent(
            AnalyticsEvents.AD_CLOSED,
            {
              type: 'app_open',
            },
          );

          this.cleanupAd();

          // preload next ad
          this.load();
        },
      );

      /**
       * Error
       */
      this.appOpenAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error(
            `[AppOpenService] Error loading ad unit ${this.currentUnitId}:`,
            error,
          );

          this.isShowing = false;
          this.isLoaded = false;
          this.isPreloading = false;
          useAdsStore.getState().setAppOpenShowing(false);

          useAdsStore
            .getState()
            .setAdLoaded('appOpen', false);

          analyticsService.trackEvent(
            AnalyticsEvents.AD_FAILED,
            {
              type: 'app_open',
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
      this.appOpenAd.addAdEventListener(
        AdEventType.PAID,
        (value: any) => {
          if (!value) return;

          analyticsService.trackEvent(
            AnalyticsEvents.AD_REVENUE,
            {
              type: 'app_open',
              value: value.valueMicros,
              currency: value.currencyCode,
              precision: value.precision,
            },
          );
        },
      );
    } catch (error) {
      console.error(
        '[AppOpenService] Failed to create ad:',
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
    const delay = this.backoff.getNextDelay();

    if (delay === null) {
      console.warn(
        '[AppOpenService] Max retry reached.',
      );

      return;
    }

    this.clearTimers();

    this.loadTimer = setTimeout(() => {
      this.load();
    }, delay);

    console.log(
      `[AppOpenService] Retry in ${delay}ms`,
    );
  }

  /**
   * ----------------------------------------
   * Load Ad
   * ----------------------------------------
   */
  public load() {
    const canShow = selectCanShowAppOpen(
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

    if (!this.appOpenAd) {
      this.createAd();
    }

    if (!this.appOpenAd) {
      return;
    }

    try {
      this.isPreloading = true;
      this.loadStartTime = Date.now();

      this.appOpenAd.load();
    } catch (error) {
      console.error(
        '[AppOpenService] Load failed:',
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
  public async show(isProtectedScreen = false) {
    const canShow = selectCanShowAppOpen(
      useAdsStore.getState(),
    );

    const now = Date.now();
    const lastShowTime = useAdsStore.getState().lastAppOpenShowTime || 0;

    // Safety checks: Cooldown, loaded state, global enabled flag, and Protected Screen policy
    if (
      !canShow ||
      this.isShowing ||
      isProtectedScreen ||
      now - lastShowTime < this.SHOW_COOLDOWN
    ) {
      return false;
    }

    if (this.isLoaded && this.appOpenAd) {
      // 1. Verify if the cached ad has expired (Google Policy enforces a 4-hour limit)
      const adAge = now - this.loadedTime;
      if (adAge > this.AD_EXPIRATION_TIME) {
        console.warn('[AppOpenService] Ad expired (older than 4 hours). Discarding and preloading fresh ad.');
        this.cleanupAd();
        this.load();
        return false;
      }

      try {
        this.isShowing = true;
        useAdsStore.getState().setAppOpenShowing(true);

        await this.appOpenAd.show();

        return true;
      } catch (error) {
        console.error(
          '[AppOpenService] Show failed:',
          error,
        );

        this.isShowing = false;
        useAdsStore.getState().setAppOpenShowing(false);

        return false;
      }
    }

    this.load();

    return false;
  }

  public getIsLoaded() {
    return this.isLoaded;
  }
}

export default AppOpenService;
