import React, { useEffect, useMemo, memo } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface OnboardingNavigationProps {
  step: number; // 1-based step: 1, 2, 3
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const OnboardingNavigation = memo(function OnboardingNavigation({
  step,
  totalSteps,
  onBack,
  onNext,
  isLoading = false,
}: OnboardingNavigationProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  // Navigation mounting fade-in
  const navOpacity = useSharedValue(0);
  useEffect(() => {
    navOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedNavStyle = useAnimatedStyle(() => {
    return {
      opacity: navOpacity.value,
    };
  });

  // Motivational Messages for Rehbar App
  const motivationalMessage = useMemo(() => {
    switch (step) {
      case 1:
        return 'ہر رابطہ، ایک جگہ — Your complete community directory';
      case 2:
        return 'ایک قطرہ، ایک زندگی — Connect with blood donors near you';
      case 3:
        return 'اپنا کاروبار بڑھائیں — Grow your business with the community';
      default:
        return 'Welcome to Rehbar Community';
    }
  }, [step]);

  // CTA Text depending on step
  const ctaText = useMemo(() => {
    if (step === totalSteps) {
      return 'Get Started';
    }
    return 'Next';
  }, [step, totalSteps]);

  // CTA Arrow Nudge Animation
  const arrowTranslateX = useSharedValue(0);
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        arrowTranslateX.value = withSequence(
          withTiming(4, { duration: 150 }),
          withSpring(0, { damping: 6, stiffness: 100 })
        );
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const animatedArrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: arrowTranslateX.value }],
    };
  });

  const backScale = useSharedValue(1);
  const nextScale = useSharedValue(1);

  const animatedBackBtnStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: backScale.value }],
    };
  });

  const animatedNextBtnStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: nextScale.value }],
    };
  });

  const progressDots = useMemo(() => {
    const dots = [];
    for (let i = 1; i <= totalSteps; i++) {
      dots.push(i);
    }
    return dots;
  }, [totalSteps]);

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onBack();
  };

  const handleNextPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onNext();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 16),
        },
        animatedNavStyle,
      ]}
    >
      {/* Dynamic Motivational Message */}
      <View style={styles.motivationContainer}>
        <Text style={[styles.motivationText, { color: colors.textSecondary }]}>
          {motivationalMessage}
        </Text>
      </View>

      {/* Progress Dots Indicator */}
      <View style={styles.dotsRow}>
        {progressDots.map((dotIndex) => {
          const isActive = dotIndex === step;
          return (
            <Dot
              key={dotIndex}
              isActive={isActive}
              theme={theme}
              colors={colors}
            />
          );
        })}
      </View>

      {/* Buttons Container */}
      <View style={styles.buttonsContainer}>
        {/* Back Button */}
        <AnimatedPressable
          onPressIn={() => {
            if (step > 1 && !isLoading) backScale.value = withTiming(0.95, { duration: 100 });
          }}
          onPressOut={() => {
            backScale.value = withSpring(1, {});
          }}
          onPress={handleBackPress}
          disabled={step === 1 || isLoading}
          style={[
            styles.backBtn,
            {
              opacity: step === 1 ? 0 : 1,
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            },
            animatedBackBtnStyle,
          ]}
        >
          <Ionicons name="arrow-back" size={14} color={colors.text} style={{ marginRight: 4 }} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
        </AnimatedPressable>

        {/* Continue CTA */}
        <AnimatedPressable
          onPressIn={() => {
            if (!isLoading) nextScale.value = withTiming(0.95, { duration: 100 });
          }}
          onPressOut={() => {
            nextScale.value = withSpring(1, {});
          }}
          onPress={handleNextPress}
          disabled={isLoading}
          style={[
            styles.nextBtn,
            animatedNextBtnStyle,
          ]}
        >
          <LinearGradient
            colors={[colors.primary, '#008080']}
            style={styles.nextBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.ctaContent}>
                <Text style={styles.nextBtnText}>
                  {ctaText}
                </Text>
                <Animated.View style={animatedArrowStyle}>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </Animated.View>
              </View>
            )}
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
});

export default OnboardingNavigation;

function Dot({ isActive, theme, colors }: { isActive: boolean; theme: any; colors: any }) {
  const dotWidth = useSharedValue(8);
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    dotWidth.value = withSpring(isActive ? 18 : 8, { damping: 10, stiffness: 120 });
    dotOpacity.value = withTiming(isActive ? 1.0 : 0.3, { duration: 250 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: dotWidth.value,
      opacity: dotOpacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.progressDot,
        {
          backgroundColor: isActive ? colors.secondary : colors.icon,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  motivationContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 10,
  },
  progressDot: {
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 3,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
