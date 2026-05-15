import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Centralized Ad Unit IDs
 */
export const AD_UNIT_IDS = {
  BANNER: __DEV__ 
    ? TestIds.BANNER 
    : 'ca-app-pub-1707254546231644/2265110414',
  
  INTERSTITIAL: __DEV__ 
    ? TestIds.INTERSTITIAL 
    : 'ca-app-pub-1707254546231644/3460596415',
  
  REWARDED: __DEV__ 
    ? TestIds.REWARDED 
    : 'ca-app-pub-1707254546231644/4808115916',
    
  NATIVE: __DEV__ 
    ? TestIds.BANNER 
    : 'ca-app-pub-1707254546231644/8831121408',

  APP_OPEN: __DEV__
    ? TestIds.APP_OPEN
    : 'ca-app-pub-1707254546231644/6638026739',
};
