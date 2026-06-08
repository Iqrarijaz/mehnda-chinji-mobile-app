import { TestIds } from 'react-native-google-mobile-ads';

// Set this to true to test production Ad Unit IDs in development mode.
// Ensure your device is registered as a Test Device in the AdMob Console first!
export const FORCE_PROD_ADS_IN_DEV = false;

const useTestIds = __DEV__ && !FORCE_PROD_ADS_IN_DEV;

/**
 * Centralized Ad Unit IDs
 */
export const AD_UNIT_IDS = {
  BANNER: useTestIds
    ? TestIds.BANNER
    : 'ca-app-pub-1707254546231644/2265110414',

  INTERSTITIAL: useTestIds
    ? TestIds.INTERSTITIAL
    : 'ca-app-pub-1707254546231644/4312708732',

  REWARDED: useTestIds
    ? TestIds.REWARDED
    : 'ca-app-pub-1707254546231644/4808115916',

  NATIVE: useTestIds
    ? TestIds.BANNER
    : 'ca-app-pub-1707254546231644/8831121408',

  APP_OPEN: useTestIds
    ? TestIds.APP_OPEN
    : 'ca-app-pub-1707254546231644/6638026739',
};
