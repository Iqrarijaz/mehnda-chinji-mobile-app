import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GlobalSearchOverlay } from '@/components/common/GlobalSearchOverlay';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { UtilsGrid } from '@/components/home/UtilsGrid';
import { HomeHeader } from '@/components/home/HomeHeader';
import BannerAd from '@/ads/components/BannerAd';
import { ThemedView } from '@/components/ThemedView';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordModal } from '@/components/setting/PasswordModal';
import messaging from '@react-native-firebase/messaging';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = React.useState(false);

  React.useEffect(() => {
    // Subscribe to marketplace reminders so already registered users receive them
    messaging()
      .subscribeToTopic('marketplace_reminder')
      .then(() => console.log('Subscribed to marketplace_reminder from Home'))
      .catch(err => console.log('Failed to subscribe to topic', err));
  }, []);

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
});
