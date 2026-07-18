import { useState, useCallback, useEffect } from 'react';
import { useAdsStore, selectCanShowInterstitial, selectCanShowRewarded } from '../../store/ads.store';
import RewardedService from '../rewarded.service';
import InterstitialService from '../interstitial.service';

/**
 * Hook to access global ads configuration and state
 */
export const useAds = () => {
  const config = useAdsStore((state) => state.adsConfig);
  const isLoading = useAdsStore((state) => state.isLoading);
  const isPremium = useAdsStore((state) => state.isPremium);

  return {
    config,
    isLoading,
    isAdFree: isPremium,
  };
};

/**
 * Specialized hook for interstitial ads with automatic preloading
 */
export const useInterstitialAd = () => {
  const canShow = useAdsStore(selectCanShowInterstitial);
  const isAdLoaded = useAdsStore((state) => state.isAdLoaded.interstitial);

  useEffect(() => {
    if (canShow && !isAdLoaded) {
      InterstitialService.getInstance().load();
    }
  }, [canShow, isAdLoaded]);

  const showAd = useCallback((force: boolean = false) => {
    if (canShow) {
      InterstitialService.getInstance().show(force);
    }
  }, [canShow]);

  return {
    showAd,
    preload: () => InterstitialService.getInstance().load(),
    canShow,
    isAdLoaded,
  };
};

/**
 * Specialized hook for rewarded ads with reactive loading state
 */
export const useRewardedAd = () => {
  const [isShowing, setIsShowing] = useState(false);
  const canShow = useAdsStore(selectCanShowRewarded);
  const isAdLoaded = useAdsStore((state) => state.isAdLoaded.rewarded);

  useEffect(() => {
    if (canShow && !isAdLoaded) {
      RewardedService.getInstance().load();
    }
  }, [canShow, isAdLoaded]);

  const showAd = useCallback(async (onReward: () => void) => {
    if (!canShow) {
      console.log('[useRewardedAd] Ads disabled for this user/config');
      return;
    }

    if (!isAdLoaded) {
      console.log('[useRewardedAd] Ad not loaded yet, preloading...');
      RewardedService.getInstance().load();
      return;
    }

    setIsShowing(true);
    const success = await RewardedService.getInstance().show(() => {
      onReward();
      setIsShowing(false);
    });
    
    if (!success) {
      setIsShowing(false);
    }
  }, [canShow, isAdLoaded]);

  return {
    showAd,
    isShowing,
    isAdLoaded,
    canShow,
    preload: () => RewardedService.getInstance().load(),
  };
};

/**
 * Hook to listen for specific ad events
 * Use this for custom UI reactions (e.g., showing a "Thank You" toast)
 */
export const useAdEvent = (type: 'interstitial' | 'rewarded' | 'appOpen', onLoaded?: () => void) => {
  const isLoaded = useAdsStore((state) => state.isAdLoaded[type]);

  useEffect(() => {
    if (isLoaded && onLoaded) {
      onLoaded();
    }
  }, [isLoaded]);
};
