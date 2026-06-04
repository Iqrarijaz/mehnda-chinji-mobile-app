import React, { memo, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAdsStore, selectCanShowNative } from '../../store/ads.store';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../../components/themedText';
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
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          unitId={AD_UNIT_IDS.NATIVE}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          onAdLoaded={() => {
            setIsLoaded(true);
            const duration = Date.now() - startTimeRef.current;
            analyticsService.trackEvent(AnalyticsEvents.AD_LOADED, { type: 'native', placement });
            analyticsService.trackEvent(AnalyticsEvents.AD_LOAD_TIME, { type: 'native', placement, duration });
          }}
          onAdFailedToLoad={(error) => {
            console.error('[NativeAd] Failed to load:', error);
            setIsLoaded(false);
            setLoadFailed(true);
            analyticsService.trackEvent(AnalyticsEvents.AD_FAILED, { type: 'native', placement, error: error.message });
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
    borderWidth: 1,
    overflow: 'hidden',
    padding: 8,
    // Reserved height for Medium Rectangle (250) + Header (approx 40)
    minHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
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
