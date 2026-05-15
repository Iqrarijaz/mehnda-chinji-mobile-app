import React, { memo, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { BannerAd as AdMobBanner, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAdsStore, selectCanShowBanner } from '../../store/ads.store';
import { AD_UNIT_IDS } from '../../constants/ads';
import { analyticsService, AnalyticsEvents } from '@/analytics';

interface BannerAdProps {
  style?: any;
  placement: string; // e.g., 'home', 'weather'
}

const BannerAd: React.FC<BannerAdProps> = ({ style, placement }) => {
  const canShow = useAdsStore(selectCanShowBanner);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (canShow) {
      setIsMounted(true);
    }
  }, [canShow]);

  if (!canShow || !isMounted) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {!isLoaded && (
        <View style={styles.placeholder}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
      <AdMobBanner
        unitId={AD_UNIT_IDS.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setIsLoaded(true);
          const duration = Date.now() - startTime;
          analyticsService.trackEvent(AnalyticsEvents.AD_LOADED, { type: 'banner', placement });
          analyticsService.trackEvent(AnalyticsEvents.AD_LOAD_TIME, { type: 'banner', placement, duration });
        }}
        onAdFailedToLoad={(error) => {
          console.error('[BannerAd] Failed to load:', error);
          setIsLoaded(false);
          analyticsService.trackEvent(AnalyticsEvents.AD_FAILED, { type: 'banner', placement, error: error.message });
        }}
        onAdOpened={() => {
          analyticsService.trackEvent(AnalyticsEvents.BANNER_CLICK_ATTEMPT, { type: 'banner', placement });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // Reserve minimum height to prevent layout shifts (50 is standard for mobile banners)
    minHeight: 50,
    marginVertical: 8,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
});

export default memo(BannerAd);
