import React from 'react';
import { StyleSheet, View, RefreshControl } from 'react-native';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { GlobalSearchOverlay } from '@/components/common/GlobalSearchOverlay';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { UtilsGrid } from '@/components/home/UtilsGrid';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSkeleton } from '@/components/home/HomeSkeleton';
import BannerAd from '@/ads/components/BannerAd';
import { ThemedView } from '@/components/ThemedView';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordModal } from '@/components/setting/PasswordModal';
import messaging from '@react-native-firebase/messaging';

import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { useHomePageConfig } from '@/hooks/useHomePageConfig';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { categories, utilities, isLoading, isFetching, isRefetching, refetch } = useHomePageConfig();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = React.useState(false);

  // isLoading alone is false whenever the query is merely paused — restoring
  // from disk, or offline — so the screen fell through to two grids that render
  // null on an empty list, i.e. nothing at all with no loader. Skeleton whenever
  // a fetch is genuinely in flight and there is still nothing to draw.
  const showSkeleton = (isLoading || isFetching) && categories.length === 0 && utilities.length === 0;

  React.useEffect(() => {
    // Subscribe to marketplace reminders so already registered users receive them
    messaging()
      .subscribeToTopic('marketplace_reminder')
      .then(() => console.log('Subscribed to marketplace_reminder from Home'))
      .catch(err => console.log('Failed to subscribe to topic', err));
  }, []);

  return (
    <ErrorBoundary>
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
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {showSkeleton ? (
              <HomeSkeleton />
            ) : (
              <>
                {/* Dynamic Categories */}
                <CategoryGrid />

                {/* Dynamic Daily Utilities */}
                <UtilsGrid />
              </>
            )}
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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
});
