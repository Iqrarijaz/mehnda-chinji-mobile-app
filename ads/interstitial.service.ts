import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import {
  AppState,
  AppStateStatus,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import {
  useAdsStore,
  selectCanShowInterstitial,
} from '../store/ads.store';

import { AD_UNIT_IDS } from '../constants/ads';

import {
  analyticsService,
  AnalyticsEvents,
} from '@/analytics';

/**
 * ----------------------------------------
 * Exponential Backoff
 * ----------------------------------------
 */
class ExponentialBackoff {
  private retryCount = 0;

  private readonly delays = [
    1000,
    2000,
    4000,
    8000,
    16000,
  ];

  public getNextDelay(): number | null {
    if (this.retryCount >= this.delays.length) {
      return null;
    }

    return this.delays[this.retryCount++];
  }

  public reset() {
    this.retryCount = 0;
  }
}

/**
 * ----------------------------------------
 * Interstitial Service
 * ----------------------------------------
 */
class InterstitialService {
  private static instance: InterstitialService | null = null;

  private interstitial: InterstitialAd | null = null;
  private currentUnitId = '';

  private isLoaded = false;
  private isLoading = false;
  private isShowing = false;

  private triggerCount = 0;

  private loadTimer: ReturnType<typeof setTimeout> | null =
    null;
  private showPendingTimer: ReturnType<typeof setTimeout> | null =
    null;
  private showPending = false;
  // How long a forced show() waits for a still-loading ad before giving up on
  // auto-showing it. This is the only thing standing between "ad was
  // requested" and "ad was actually shown" for the six create/update flows
  // that call show(true) right after a success action.
  //
  // 5000ms was tuned against Google's TestIds, which fill in well under a
  // second because they skip the real ad auction entirely. Production ad
  // units go through a genuine mediation waterfall (AppLovin/Facebook/Unity
  // are all wired up in app.json) and can easily take longer than that to
  // fill, especially on a cold session or a weak connection — so the forced
  // show was frequently timing out before its own preload finished, and the
  // ad that eventually loaded was simply never shown. This is why "works in
  // dev, silently fails in production" was possible without any dev-only
  // branch in the code: the bug only needed dev's ads to be *faster*, not
  // fundamentally different.
  private readonly SHOW_PENDING_TIMEOUT = 20000;

  private loadStartTime = 0;
  private loadedAt = 0;
  private lastShownAt = 0;
  private appOpenedAt = Date.now();
  private lastForegroundLoad = 0;

  private readonly MIN_SHOW_INTERVAL =
    90 * 1000;

  private readonly MAX_AD_AGE =
    60 * 60 * 1000;

  private readonly FOREGROUND_LOAD_DEBOUNCE =
    10 * 1000;

  private backoff = new ExponentialBackoff();

  private appStateSubscription:
    | { remove: () => void }
    | null = null;

  private constructor() {
    this.setupAppStateListener();
  }

  /**
   * ----------------------------------------
   * Singleton
   * ----------------------------------------
   */
  public static getInstance(): InterstitialService {
    if (!InterstitialService.instance) {
      InterstitialService.instance =
        new InterstitialService();
    }

    return InterstitialService.instance;
  }

  /**
   * ----------------------------------------
   * Initialize
   * ----------------------------------------
   */
  public initialize() {
    this.load();
  }

  /**
   * ----------------------------------------
   * App State Handling
   * ----------------------------------------
   */
  private setupAppStateListener() {
    this.appStateSubscription =
      AppState.addEventListener(
        'change',
        this.onAppStateChange,
      );
  }

  private onAppStateChange = async (
    nextState: AppStateStatus,
  ) => {
    if (nextState !== 'active') {
      return;
    }

    const now = Date.now();

    /**
     * Prevent excessive reloads
     */
    if (
      now - this.lastForegroundLoad <
      this.FOREGROUND_LOAD_DEBOUNCE
    ) {
      return;
    }

    this.lastForegroundLoad = now;

    if (
      !this.isLoaded &&
      !this.isLoading &&
      !this.isShowing
    ) {
      this.load();
    }
  };

  /**
   * ----------------------------------------
   * Cleanup
   * ----------------------------------------
   */
  private cleanupAd(preservePending = false) {
    if (this.interstitial) {
      this.interstitial.removeAllListeners();
      this.interstitial = null;
    }

    this.isLoaded = false;
    this.isLoading = false;
    if (!preservePending) {
      this.showPending = false;
    }
  }

  private clearLoadTimer() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
  }

  private clearShowPendingTimer() {
    if (this.showPendingTimer) {
      clearTimeout(this.showPendingTimer);
      this.showPendingTimer = null;
    }
  }

  public destroy() {
    this.clearLoadTimer();
    this.clearShowPendingTimer();

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
  private createAd(customUnitId?: string, preservePending = false) {
    this.cleanupAd(preservePending);

    const unitId = customUnitId || AD_UNIT_IDS.INTERSTITIAL;
    this.currentUnitId = unitId;

    try {
      this.interstitial =
        InterstitialAd.createForAdRequest(
          unitId,
          {
            // requestNonPersonalizedAdsOnly: true,
          },
        );

      /**
       * Loaded
       */
      this.interstitial.addAdEventListener(
        AdEventType.LOADED,
        () => {
          this.isLoaded = true;
          this.isLoading = false;

          this.loadedAt = Date.now();

          this.backoff.reset();

          const duration =
            Date.now() - this.loadStartTime;

          useAdsStore
            .getState()
            .setAdLoaded(
              'interstitial',
              true,
            );

          analyticsService.trackEvent(
            AnalyticsEvents.AD_LOADED,
            {
              type: 'interstitial',
            },
          );

          analyticsService.trackEvent(
            AnalyticsEvents.AD_LOAD_TIME,
            {
              type: 'interstitial',
              duration,
            },
          );

          /**
           * If a show request is pending,
           * show the ad immediately
           */
          if (
            this.showPending &&
            this.interstitial
          ) {
            this.showPending = false;
            this.clearShowPendingTimer();

            try {
              this.isShowing = true;
              this.interstitial.show();
            } catch (error) {
              this.isShowing = false;
              console.error(
                '[InterstitialService] Pending show failed:',
                error,
              );
            }
          }
        },
      );

      /**
       * Opened
       */
      this.interstitial.addAdEventListener(
        AdEventType.OPENED,
        () => {
          analyticsService.trackEvent(
            AnalyticsEvents.AD_SHOWN,
            {
              type: 'interstitial',
            },
          );
        },
      );

      /**
       * Closed
       */
      this.interstitial.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          this.isShowing = false;
          this.showPending = false;
          this.lastShownAt = Date.now();

          useAdsStore
            .getState()
            .setAdLoaded(
              'interstitial',
              false,
            );

          analyticsService.trackEvent(
            AnalyticsEvents.AD_CLOSED,
            {
              type: 'interstitial',
            },
          );

          this.cleanupAd();

          /**
           * Preload next ad
           */
          this.load();
        },
      );

      /**
       * Error
       */
      this.interstitial.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error(
            `[InterstitialService] Error loading ad unit ${this.currentUnitId}:`,
            error,
          );

          this.isShowing = false;
          this.isLoaded = false;
          this.isLoading = false;

          useAdsStore
            .getState()
            .setAdLoaded(
              'interstitial',
              false,
            );

          analyticsService.trackEvent(
            AnalyticsEvents.AD_FAILED,
            {
              type: 'interstitial',
              error: error.message,
            },
          );

          // Retry with alternate backup production ID if primary fails, otherwise back off
          const primaryProdId = AD_UNIT_IDS.INTERSTITIAL;
          const backupProdId = 'ca-app-pub-1707254546231644/3460596415';

          if (this.currentUnitId === primaryProdId && primaryProdId !== backupProdId) {
            console.log('[InterstitialService] Primary Interstitial failed. Trying backup production ID...');
            this.cleanupAd(true);
            this.createAd(backupProdId, true);
            this.isLoading = true;
            this.loadStartTime = Date.now();
            try {
              this.interstitial?.load();
            } catch (err) {
              console.error('[InterstitialService] Backup production load failed:', err);
              this.isLoading = false;
              this.showPending = false;
              this.handleLoadError();
            }
          } else {
            this.showPending = false;
            this.cleanupAd(false);
            this.handleLoadError();
          }
        },
      );

      /**
       * Revenue Tracking
       */
      this.interstitial.addAdEventListener(
        AdEventType.PAID,
        (value: any) => {
          if (!value) {
            return;
          }

          analyticsService.trackEvent(
            AnalyticsEvents.AD_REVENUE,
            {
              type: 'interstitial',
              value: value.valueMicros,
              currency:
                value.currencyCode,
              precision:
                value.precision,
            },
          );
        },
      );
    } catch (error) {
      console.error(
        '[InterstitialService] Failed to create ad:',
        error,
      );
    }
  }

  /**
   * ----------------------------------------
   * Retry Handling
   * ----------------------------------------
   */
  private handleLoadError() {
    const delay =
      this.backoff.getNextDelay();

    if (delay === null) {
      console.warn(
        '[InterstitialService] Max retry reached.',
      );

      return;
    }

    this.clearLoadTimer();

    this.loadTimer = setTimeout(() => {
      this.load();
    }, delay);

    console.log(
      `[InterstitialService] Retry in ${delay}ms`,
    );
  }

  /**
   * ----------------------------------------
   * Check Internet
   * ----------------------------------------
   */
  private async hasInternetConnection() {
    try {
      const state = await NetInfo.fetch();

      return Boolean(
        state.isConnected &&
        state.isInternetReachable,
      );
    } catch {
      return false;
    }
  }

  /**
   * ----------------------------------------
   * Load Ad
   * ----------------------------------------
   */
  public async load(force = false) {
    const canShow =
      selectCanShowInterstitial(
        useAdsStore.getState(),
      );

    if (!canShow && !force) {
      return;
    }

    if (
      this.isShowing ||
      this.isLoaded ||
      this.isLoading
    ) {
      return;
    }

    const hasInternet =
      await this.hasInternetConnection();

    if (!hasInternet) {
      return;
    }

    if (!this.interstitial) {
      this.createAd();
    }

    if (!this.interstitial) {
      return;
    }

    try {
      this.isLoading = true;

      this.loadStartTime = Date.now();

      this.interstitial.load();
    } catch (error) {
      console.error(
        '[InterstitialService] Load failed:',
        error,
      );

      this.isLoading = false;

      this.handleLoadError();
    }
  }

  /**
   * ----------------------------------------
   * Validate Ad Freshness
   * ----------------------------------------
   */
  private isAdExpired() {
    if (!this.loadedAt || !this.isLoaded) {
      return false;
    }

    return (
      Date.now() - this.loadedAt >
      this.MAX_AD_AGE
    );
  }

  /**
   * ----------------------------------------
   * Show Ad
   * ----------------------------------------
   */
  public show(force = false): boolean {
    const state =
      useAdsStore.getState();

    const canShow =
      selectCanShowInterstitial(state);

    // Allow forced display even if config disables it
    if (!canShow && !force) {
      return false;
    }

    if (this.isShowing) {
      return false;
    }

    /**
     * Prevent ads immediately
     * after app launch
     */
    if (
      !force &&
      Date.now() - this.appOpenedAt <
      15000
    ) {
      return false;
    }

    /**
     * Frequency cap
     */
    if (
      !force &&
      Date.now() - this.lastShownAt <
      this.MIN_SHOW_INTERVAL
    ) {
      return false;
    }

    /**
     * Interval control
     */
    this.triggerCount++;

    const interval =
      state.adsConfig
        .interstitial_interval || 3;

    if (
      !force &&
      this.triggerCount % interval !== 0
    ) {
      return false;
    }

    /**
     * Expired ad
     */
    if (this.isAdExpired()) {
      this.cleanupAd();

      if (!force) {
        this.load();
        return false;
      }

      // A forced show represents a completed user action (listing created,
      // business registered, essential added) — it gets exactly one shot.
      // Previously this branch returned unconditionally, which silently
      // dropped that shot whenever the preloaded ad happened to be stale
      // (loaded over an hour earlier), even for force=true. Falling through
      // to the "ad not ready" path below queues a fresh load and arms the
      // pending-show window instead of discarding the request.
    }

    /**
     * Ad ready — show immediately
     */
    if (this.isLoaded && this.interstitial) {
      try {
        this.isShowing = true;

        this.interstitial.show();

        return true;
      } catch (error) {
        console.error(
          '[InterstitialService] Show failed:',
          error,
        );

        this.isShowing = false;

        return false;
      }
    }

    /**
     * Ad not ready — preload
     */
    this.load(force);

    /**
     * If forced, queue the show request.
     * The LOADED event will auto-show it.
     * Timeout after SHOW_PENDING_TIMEOUT to prevent stale popups.
     */
    if (force) {
      this.showPending = true;

      this.clearShowPendingTimer();

      this.showPendingTimer = setTimeout(
        () => {
          this.showPending = false;
        },
        this.SHOW_PENDING_TIMEOUT,
      );
    }

    return false;
  }
}

export default InterstitialService;