import AdMobService from './admob.service';
import InterstitialService from './interstitial.service';
import RewardedService from './rewarded.service';
import AppOpenService from './appOpen.service';
import { analyticsService, AnalyticsEvents } from '@/analytics';

/**
 * Unified AdManager to coordinate all ad formats and lifecycle events
 */
class AdManager {
  private static instance: AdManager;

  private constructor() {}

  public static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  /**
   * Initializes the entire ad system
   */
  public async init() {
    try {
      // 1. Initialize AdMob SDK, UMP and Remote Config
      await AdMobService.init();

      // 2. Initial Preload with delay to let app settle
      setTimeout(() => {
        this.preloadAll();
      }, 2000);

      analyticsService.trackEvent(AnalyticsEvents.AD_MANAGER_INIT, { status: 'success' });
    } catch (error) {
      console.error('[AdManager] Initialization failed:', error);
      analyticsService.trackEvent(AnalyticsEvents.AD_MANAGER_INIT, { status: 'failed', error });
    }
  }

  /**
   * Preloads critical startup ad formats to ensure they are ready.
   * Staggers loads to prioritize user experience and reduce network/CPU congestion.
   * Rewarded ads are excluded from startup preloading to conserve memory and network resources
   * on lower-end devices; they are instead loaded reactively when entering relevant screens.
   */
  public preloadAll() {
    // 1. Interstitials: High-priority for early transitions
    InterstitialService.getInstance().load();
    
    // 2. App Open Ads: Staggered preload (1.5s delay) to prioritize boot performance
    // and ensure fill readiness for subsequent app foreground events.
    setTimeout(() => {
      AppOpenService.getInstance().load();
    }, 1500);
  }
}

export default AdManager.getInstance();
