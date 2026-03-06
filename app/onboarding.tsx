import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Animated,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { PaginationDots } from '@/components/onboarding/PaginationDots';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { clientStorage } from '@/utils/storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Stay Updated',
        description: 'Get the latest community news and announcements from local administrators.',
        animation: require('../public/json/onboarding1.json'),
    },
    {
        id: '2',
        title: 'Save Lives',
        description: 'Quickly find blood donors and help people in emergencies.',
        animation: require('../public/json/onboarding2.json'),
    },
    {
        id: '3',
        title: 'Support Local Businesses',
        description: 'Discover and register local businesses in your community directory.',
        animation: require('../public/json/onboarding3.json'),
    },
];

import * as Haptics from 'expo-haptics';

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const buttonScale = useRef(new Animated.Value(1)).current;

    // Elite touch: Background color interpolation
    const backgroundColor = scrollX.interpolate({
        inputRange: SLIDES.map((_, i) => i * width),
        outputRange: isDark
            ? ['#1A1A1A', '#1E293B', '#1E1B4B'] // Dark mode elite palette
            : ['#F8FAFC', '#F0F9FF', '#F5F3FF'], // Light mode elite palette
        extrapolate: 'clamp',
    });

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            const nextIndex = viewableItems[0].index;
            if (nextIndex !== currentIndex) {
                Haptics.selectionAsync(); // Tactile feedback on snap
                setCurrentIndex(nextIndex);
            }
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        try {
            await clientStorage.setItem('onboarding_completed', 'true');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            router.replace('/(tabs)');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={handleSkip}
                        style={[styles.skipButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ThemedText style={[styles.skipText, { color: colors.textSecondary }]}>
                            Skip
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <FlatList
                        data={SLIDES}
                        renderItem={({ item, index }) => <OnboardingSlide item={item} index={index} scrollX={scrollX} />}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        bounces={false}
                        keyExtractor={(item) => item.id}
                        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                            useNativeDriver: false,
                        })}
                        scrollEventThrottle={32}
                        onViewableItemsChanged={viewableItemsChanged}
                        viewabilityConfig={viewConfig}
                        ref={slidesRef}
                    />
                </View>

                <View style={styles.footer}>
                    <PaginationDots data={SLIDES} scrollX={scrollX} activeColor={colors.primary} />

                    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            onPress={handleNext}
                            onPressIn={() => Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start()}
                            onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
                            activeOpacity={0.9}
                        >
                            <ThemedText style={styles.buttonText}>
                                {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                            </ThemedText>
                            {currentIndex < SLIDES.length - 1 && (
                                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 30,
        height: 80,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingBottom: 10,
    },
    skipButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    skipText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    footer: {
        paddingHorizontal: 30,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        paddingTop: 10,
    },
    button: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
