import React from 'react';
import { StyleSheet } from 'react-native';

import { CategoryGrid } from '@/components/home/CategoryGrid';
import { HomeHeader } from '@/components/home/HomeHeader';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ScrollView } from 'react-native-gesture-handler';

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme === 'dark' ? '#222831' : undefined }]}>
      {/* Custom Header */}
      <HomeHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CategoryGrid />

        {/* Future: Recent Places or Popular Places can go here */}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  }
});
