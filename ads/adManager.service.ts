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

      // Load App Open ad immediately to maximize chance of showing on splash screen
      AppOpenService.getInstance().load();

      // 2. Initial Preload for other ads with delay to let app settle
      setTimeout(() => {
        this.preloadOtherFormats();
      }, 2000);

      analyticsService.trackEvent(AnalyticsEvents.AD_MANAGER_INIT, { status: 'success' });
    } catch (error) {
      console.error('[AdManager] Initialization failed:', error);
      analyticsService.trackEvent(AnalyticsEvents.AD_MANAGER_INIT, { status: 'failed', error });
    }
  }

  /**
   * Preloads other startup ad formats
   */
  public preloadOtherFormats() {
    InterstitialService.getInstance().load();
  }

  /**
   * Preloads all critical formats
   */
  public preloadAll() {
    AppOpenService.getInstance().load();
    InterstitialService.getInstance().load();
  }
}

export default AdManager.getInstance();
