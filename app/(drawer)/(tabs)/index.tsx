import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View, FlatList, Dimensions, TouchableOpacity } from 'react-native';

import { GlobalSearchOverlay } from '@/components/common/GlobalSearchOverlay';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { UtilsGrid } from '@/components/home/UtilsGrid';
import { ContentCard } from '@/components/home/ContentCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { PasswordModal } from '@/components/setting/PasswordModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BannerAd from '@/ads/components/BannerAd';
import { FeaturedPrideCard } from '@/components/home/FeaturedPrideCard';
import { usePosts } from '@/hooks/usePosts';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { SmallAnnouncementCard } from '@/components/announcements/SmallAnnouncementCard';
import { analyticsService, AnalyticsEvents } from '@/analytics';

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

  // Fetch announcements for notice board carousel
  const { data: announcements = [] } = useAnnouncements();

  // Carousel auto-play setup
  const carouselData = React.useMemo(() => {
    return announcements.slice(0, 5);
  }, [announcements]);
  const flatListRef = React.useRef<FlatList>(null);
  const currentIndexRef = React.useRef(0);

  React.useEffect(() => {
    if (carouselData.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = currentIndexRef.current + 1;
      if (nextIndex >= carouselData.length) {
        nextIndex = 0;
      }
      currentIndexRef.current = nextIndex;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselData]);

  const getItemLayout = React.useCallback(
    (_data: any, index: number) => ({
      length: Dimensions.get('window').width - 40,
      offset: (Dimensions.get('window').width - 40) * index,
      index,
    }),
    []
  );

  const onMomentumScrollEnd = React.useCallback((event: any) => {
    const slideSize = Dimensions.get('window').width - 40;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    currentIndexRef.current = index;
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <HomeHeader
        setIsSearchActive={setIsSearchActive}
      />

      {/* <BannerAd placement="home" /> */}

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSearchActive}
        >
          {/* Announcements Carousel */}
          {announcements.length > 0 && (
            <View style={styles.carouselContainer}>
              <FlatList
                ref={flatListRef}
                horizontal
                data={carouselData}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                snapToInterval={Dimensions.get('window').width - 40}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselList}
                getItemLayout={getItemLayout}
                onMomentumScrollEnd={onMomentumScrollEnd}
                renderItem={({ item }) => (
                  <SmallAnnouncementCard
                    item={item}
                    colors={colors}
                    onPress={() => {
                      analyticsService.trackEvent(AnalyticsEvents.ANNOUNCEMENT_CAROUSEL_CLICKED, { announcementId: item._id });
                      router.navigate({
                        pathname: '/(drawer)/(tabs)/announcements',
                        params: { id: item._id }
                      });
                    }}
                  />
                )}
              />
            </View>
          )}

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
    paddingTop: 0,
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
    width: 42,
    height: 42,
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
  carouselContainer: {
    marginBottom: 20,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 26,
    marginBottom: 10,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '800',
    opacity: 0.85,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  carouselList: {
    paddingHorizontal: 20,
  },
});
