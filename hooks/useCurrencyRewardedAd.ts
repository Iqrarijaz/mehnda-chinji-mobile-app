import { useCallback, useEffect, useRef } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { getRewardedAdUnitId } from '@/constants/ads';
import { useCurrencyStore } from '@/store/currencyStore';

/**
 * Wraps react-native-google-mobile-ads' `useRewardedAd` with the app's
 * "watch an ad to unlock 160+ currencies for 24h" flow: preloads the ad,
 * unlocks premium in `currencyStore` once the reward is earned, and
 * reloads a fresh ad for the next watch.
 *
 * Non-personalized ads only, matching this app's existing privacy stance
 * (Android's AD_ID permission is intentionally blocked — see app.config.js).
 */
export function useCurrencyRewardedAd() {
    const { isLoaded, isEarnedReward, isClosed, isShowing, error, load, show } = useRewardedAd(
        getRewardedAdUnitId(),
        { requestNonPersonalizedAdsOnly: true }
    );
    const unlockPremium = useCurrencyStore((s) => s.unlockPremium);
    const rewardHandledRef = useRef(false);

    // Preload on mount so the ad is ready by the time the user taps "unlock".
    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (isEarnedReward && !rewardHandledRef.current) {
            rewardHandledRef.current = true;
            unlockPremium();
            analyticsService.trackEvent(AnalyticsEvents.CURRENCY_AD_UNLOCK_COMPLETED);
        }
    }, [isEarnedReward, unlockPremium]);

    useEffect(() => {
        if (isClosed) {
            rewardHandledRef.current = false;
            load(); // preload the next watch
        }
    }, [isClosed, load]);

    useEffect(() => {
        if (error) {
            analyticsService.trackEvent(AnalyticsEvents.CURRENCY_AD_UNLOCK_FAILED, {
                message: error.message,
            });
        }
    }, [error]);

    const showAd = useCallback(() => {
        if (!isLoaded) return;
        analyticsService.trackEvent(AnalyticsEvents.CURRENCY_AD_UNLOCK_STARTED);
        show();
    }, [isLoaded, show]);

    return {
        isAdLoaded: isLoaded,
        isAdShowing: isShowing,
        adError: error,
        showAd,
    };
}
