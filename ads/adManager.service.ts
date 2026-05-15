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
   * Preloads all ad formats to ensure they are ready
   * Uses staggered loading to prioritize UX and reduce network/battery impact
   */
  public preloadAll() {
    // Interstitials are high priority for transition points
    InterstitialService.getInstance().load();
    
    // Staggered loading to avoid network congestion
    setTimeout(() => {
      RewardedService.getInstance().load();
    }, 1500);

    setTimeout(() => {
      AppOpenService.getInstance().load();
    }, 3000);
  }
}

export default AdManager.getInstance();
