import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { GlobalSearchOverlay } from '@/components/common/GlobalSearchOverlay';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { UtilsGrid } from '@/components/home/UtilsGrid';
import { ContentCard } from '@/components/home/ContentCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { PasswordModal } from '@/components/setting/passwordModal';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BannerAd from '@/ads/components/BannerAd';
import { FeaturedPrideCard } from '@/components/home/FeaturedPrideCard';
import { usePosts } from '@/hooks/usePosts';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = React.useState(false);

  // Fetch live village pride posts to see if a spotlight hero exists
  const { data: prideData } = usePosts({ category: 'PRIDE' });
  const livePosts = prideData?.pages?.flatMap(page => page.data) || [];
  const featuredHero = livePosts[0];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <HomeHeader
        setIsSearchActive={setIsSearchActive}
      />

      <BannerAd placement="home" />

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSearchActive}
        >
          {/* Categories */}
          <CategoryGrid />

          {/* Daily Utilities */}
          <UtilsGrid />

          {/* Featured Village Pride Spotlight */}
          {featuredHero ? <FeaturedPrideCard /> : null}

        </ScrollView>

        {isSearchActive && (
          <GlobalSearchOverlay
            searchQuery={searchQuery}
            onClose={() => setIsSearchActive(false)}
            onSearchChange={setSearchQuery}
            topPadding={0}
            onAction={(action) => {
              if (action === 'change-password') {
                setIsPasswordModalVisible(true);
              }
            }}
          />
        )}
        <PasswordModal
          visible={isPasswordModalVisible}
          onClose={() => setIsPasswordModalVisible(false)}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 26,
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    opacity: 0.85,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.borderRadius,
    padding: Platform.OS === 'android' ? 12 : 16,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  insightIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  insightEmoji: {
    fontSize: 22,
  },
  insightTextWrap: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  insightSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
  },
});
