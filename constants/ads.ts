import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Strict Environment Detection:
 * In React Native / Expo EAS release builds, __DEV__ is guaranteed to be false.
 */
export const IS_PROD = !__DEV__;

// Set to true ONLY if you want to test live production ads locally in dev mode.
// Note: Ensure your local device/emulator is registered in AdMob Console as a test device!
export const FORCE_PROD_ADS_IN_DEV = false;

/**
 * Production Ad Unit IDs (AdMob Dashboard)
 */
export const PROD_AD_UNITS = {
  BANNER: 'ca-app-pub-1707254546231644/2265110414',
  INTERSTITIAL: 'ca-app-pub-1707254546231644/4312708732',
  REWARDED: 'ca-app-pub-1707254546231644/4808115916',
  NATIVE: 'ca-app-pub-1707254546231644/8831121408',
  APP_OPEN: 'ca-app-pub-1707254546231644/6638026739',
};

export type AdType = keyof typeof PROD_AD_UNITS;

/**
 * Strict Ad Unit Resolver:
 * - In Production: ALWAYS returns the real Ad Unit ID (or null). NEVER falls back to TestIds.
 * - In Development: Uses Google TestIds (unless FORCE_PROD_ADS_IN_DEV is enabled).
 */
export function getAdUnitId(adType: AdType): string | null {
  if (IS_PROD || FORCE_PROD_ADS_IN_DEV) {
    const prodId = PROD_AD_UNITS[adType];
    if (!prodId) {
      console.warn(`[AdMob] Warning: Missing production Ad Unit ID for ${adType}`);
      return null;
    }
    return prodId;
  }

  // Development mode fallback
  switch (adType) {
    case 'BANNER':
      return TestIds.BANNER;
    case 'INTERSTITIAL':
      return TestIds.INTERSTITIAL;
    case 'REWARDED':
      return TestIds.REWARDED;
    case 'NATIVE':
      return TestIds.BANNER;
    case 'APP_OPEN':
      return TestIds.APP_OPEN;
    default:
      return TestIds.BANNER;
  }
}

/**
 * Centralized AD_UNIT_IDS for backward compatibility with existing imports.
 * In production, every getter guarantees a production Ad Unit ID and NEVER returns a Test ID.
 */
export const AD_UNIT_IDS = {
  get BANNER(): string {
    return getAdUnitId('BANNER') || PROD_AD_UNITS.BANNER;
  },
  get INTERSTITIAL(): string {
    return getAdUnitId('INTERSTITIAL') || PROD_AD_UNITS.INTERSTITIAL;
  },
  get REWARDED(): string {
    return getAdUnitId('REWARDED') || PROD_AD_UNITS.REWARDED;
  },
  get NATIVE(): string {
    return getAdUnitId('NATIVE') || PROD_AD_UNITS.NATIVE;
  },
  get APP_OPEN(): string {
    return getAdUnitId('APP_OPEN') || PROD_AD_UNITS.APP_OPEN;
  },
};
