import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * AdMob unit ID for the "watch ad to unlock all currencies" rewarded ad.
 *
 * Falls back to Google's official test unit (`TestIds.REWARDED`) in __DEV__
 * and whenever a production ID hasn't been configured yet — see
 * https://developers.google.com/admob/android/test-ads and
 * https://developers.google.com/admob/ios/test-ads.
 *
 * Set EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_ANDROID / _IOS in your .env for
 * production. Google prohibits shipping test ad units to production builds.
 */
export function getRewardedAdUnitId(): string {
    if (__DEV__) {
        return TestIds.REWARDED;
    }

    const envId = Platform.select({
        ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_IOS,
        android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_ANDROID,
        default: undefined,
    });

    return envId || TestIds.REWARDED;
}
