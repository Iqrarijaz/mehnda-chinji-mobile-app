import React, { memo, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useAdsStore, selectCanShowNative } from '../../store/ads.store';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../../components/ThemedText';
import { AD_UNIT_IDS } from '../../constants/ads';
import { Layout } from '@/constants/layout';
import { analyticsService, AnalyticsEvents } from '@/analytics';

const NativeAd: React.FC<{ placement?: string }> = ({ placement = 'feed' }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const canShow = useAdsStore(selectCanShowNative);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [adUnitId, setAdUnitId] = useState(AD_UNIT_IDS.BANNER);
  const startTimeRef = useRef(Date.now());

  // Show immediately to avoid confusion, but handle loading state gracefully
  useEffect(() => {
    if (canShow) {
      setIsMounted(true);
    }
  }, [canShow]);

  if (!canShow || !isMounted || loadFailed) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.adHeader}>
        <View style={[styles.adBadge, { backgroundColor: colors.primary }]}>
          <ThemedText style={styles.adBadgeText}>Ad</ThemedText>
        </View>
        <ThemedText style={[styles.sponsoredText, { color: colors.textSecondary }]}>Sponsored Content</ThemedText>
      </View>

      <View style={styles.adBody}>
        {!isLoaded && (
          <View style={[styles.placeholder, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <BannerAd
          key={adUnitId}
          unitId={adUnitId}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          onAdLoaded={() => {
            setIsLoaded(true);
            const duration = Date.now() - startTimeRef.current;
            analyticsService.trackEvent(AnalyticsEvents.AD_LOADED, { type: 'native', placement });
            analyticsService.trackEvent(AnalyticsEvents.AD_LOAD_TIME, { type: 'native', placement, duration });
          }}
          onAdFailedToLoad={(error) => {
            console.error('[NativeAd] Failed to load native ad:', error);
            if (adUnitId === AD_UNIT_IDS.NATIVE && AD_UNIT_IDS.NATIVE !== AD_UNIT_IDS.BANNER) {
              console.log('[NativeAd] Retrying using Banner Ad fallback unit ID...');
              setAdUnitId(AD_UNIT_IDS.BANNER);
              startTimeRef.current = Date.now();
            } else if (adUnitId === AD_UNIT_IDS.BANNER && AD_UNIT_IDS.BANNER !== TestIds.BANNER) {
              console.log('[NativeAd] Retrying using Test Banner Ad fallback...');
              setAdUnitId(TestIds.BANNER);
              startTimeRef.current = Date.now();
            } else {
              setIsLoaded(false);
              setLoadFailed(true);
              analyticsService.trackEvent(AnalyticsEvents.AD_FAILED, { type: 'native', placement, error: error.message });
            }
          }}
          onAdOpened={() => {
            analyticsService.trackEvent(AnalyticsEvents.BANNER_CLICK_ATTEMPT, { type: 'native', placement });
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    borderRadius: Layout.borderRadius,
    overflow: 'hidden',
    padding: 8,
    // Reserved height for Medium Rectangle (250) + Header (approx 40)
    minHeight: 300,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  adBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sponsoredText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adBody: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});

export default memo(NativeAd);
