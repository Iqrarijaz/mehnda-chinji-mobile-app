import React, { useMemo, memo } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface OnboardingNavigationProps {
  step: number; // 1-based step: 1, 2, 3
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

const OnboardingNavigation = memo(function OnboardingNavigation({
  step,
  totalSteps,
  onBack,
  onNext,
  isLoading = false }: OnboardingNavigationProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  // CTA Text depending on step
  const ctaText = useMemo(() => {
    if (step === totalSteps) {
      return 'Get Started';
    }
    return 'Next';
  }, [step, totalSteps]);

  const progressDots = useMemo(() => {
    const dots = [];
    for (let i = 1; i <= totalSteps; i++) {
      dots.push(i);
    }
    return dots;
  }, [totalSteps]);

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    onBack();
  };

  const handleNextPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    onNext();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBg,
          paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >

      {/* Progress Dots Indicator */}
      <View style={styles.dotsRow}>
        {progressDots.map((dotIndex) => {
          const isActive = dotIndex === step;
          return (
            <View
              key={dotIndex}
              style={[
                styles.progressDot,
                isActive ? styles.progressDotActive : styles.progressDotInactive,
                { backgroundColor: isActive ? colors.secondary : colors.icon },
              ]}
            />
          );
        })}
      </View>

      {/* Buttons Container */}
      <View style={styles.buttonsContainer}>
        {/* Back Button */}
        <Pressable
          onPress={handleBackPress}
          disabled={step === 1 || isLoading}
          style={[
            styles.backBtn,
            {
              opacity: step === 1 ? 0 : 1,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
          ]}
        >
          <Ionicons name="arrow-back" size={14} color={colors.text} style={{ marginRight: 4 }} />
          <Text allowFontScaling={false} style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
        </Pressable>

        {/* Continue CTA */}
        <Pressable
          onPress={handleNextPress}
          disabled={isLoading}
          style={[
            styles.nextBtn,
            { backgroundColor: colors.primary },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.ctaContent}>
              <Text allowFontScaling={false} style={styles.nextBtnText}>
                {ctaText}
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
});

export default OnboardingNavigation;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 11,
    borderTopRightRadius: 28,
    borderTopLeftRadius: 28,
    alignItems: 'center',
    width: '100%' },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 10 },
  progressDot: {
    height: 5,
    borderRadius: Layout.borderRadius,
    marginHorizontal: 3 },
  progressDotActive: {
    width: 18,
    opacity: 1.0 },
  progressDotInactive: {
    width: 8,
    opacity: 0.3 },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 12 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 13,
    borderRadius: Layout.borderRadius },
  backBtnText: {
    fontSize: 11.5,
    fontWeight: '600' },
  nextBtn: {
    height: 40,
    borderRadius: Layout.borderRadius,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center' },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center' },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600' } });
