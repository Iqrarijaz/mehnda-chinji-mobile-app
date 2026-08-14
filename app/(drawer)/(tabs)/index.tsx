import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { GlobalSearchOverlay } from '@/components/common/GlobalSearchOverlay';
import { CategoryGrid } from '@/components/home/categoryGrid';
import { ContentCard } from '@/components/home/contentCard';
import { CurrencyHomeCard } from '@/components/home/CurrencyHomeCard';
import { HomeHeader } from '@/components/home/homeHeader';
import { MetalsHomeCard } from '@/components/home/MetalsHomeCard';
import { PasswordModal } from '@/components/setting/passwordModal';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = React.useState(false);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <HomeHeader
        setIsSearchActive={setIsSearchActive}
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSearchActive}
        >
          {/* Categories */}
          <CategoryGrid />

          {/* Quick Access Section */}
          <Animated.View entering={SlideInLeft.delay(500).duration(400)} style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Quick Access</ThemedText>
          </Animated.View>

          <ContentCard
            icon="moon-outline"
            iconColor="#006666" // Matching your Islamic theme color
            title="Prayer Times"
            subtitle="Daily timings & Hadith"
            onPress={() => router.push('/prayerTimes' as any)}
            delay={500} // slight delay for stagger
          />

          <CurrencyHomeCard onPress={() => router.push('/currency' as any)} delay={525} />

          <MetalsHomeCard onPress={() => router.push('/metals' as any)} delay={540} />

          <ContentCard
            icon="help-buoy-outline"
            iconColor="#8B5CF6"
            title="Support"
            subtitle="Get help or report issues"
            onPress={() => router.push('/support/tickets')}
            delay={550}
          />

          {/* Insight Card */}
          {/* <Animated.View
            entering={SlideInLeft.delay(600).duration(450)}
            style={[styles.insightCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.insightIconWrap, { backgroundColor: colors.primary + '12' }]}>
              <ThemedText style={styles.insightEmoji}>💡</ThemedText>
            </View>
            <View style={styles.insightTextWrap}>
              <ThemedText style={styles.insightTitle}>Did you know?</ThemedText>
              <ThemedText style={[styles.insightSubtitle, { color: colors.textSecondary }]}>
                Complete your profile to help community members find and connect with you easily.
              </ThemedText>
            </View>
          </Animated.View> */}
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
    fontSize: 17,
    fontWeight: '700',
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
