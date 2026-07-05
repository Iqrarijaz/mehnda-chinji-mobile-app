import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    FlatList,
    Animated,
    Dimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { clientStorage } from '@/utils/storage';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'ہر رابطہ، ایک جگہ',
        description: 'Find and connect with local services, contacts, and community resources instantly.',
        animation: require('../public/json/onboarding1.json'),
    },
    {
        id: '2',
        title: 'ایک قطرہ، ایک زندگی',
        description: 'Be a hero in your neighborhood. Join our  network or request donations.',
        animation: require('../public/json/onboarding2.json'),
    },
    {
        id: '3',
        title: 'اپنا کاروبار بڑھائیں، ہمارے ساتھ',
        description: 'Register and promote your local business directly within the community directory.',
        animation: require('../public/json/onboarding3.json'),
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);
    const router = useRouter();
    const { theme } = useTheme();
    const { isAuthenticated } = useAuth();
    const isDark = theme === 'dark';
    const colors = Colors[theme];

    // Background color interpolation for an elite visual fade transition
    const backgroundColor = scrollX.interpolate({
        inputRange: SLIDES.map((_, i) => i * width),
        outputRange: isDark
            ? ['#111827', '#0F172A', '#1E1B4B'] // Dark mode backgrounds
            : ['#F8FAFC', '#F0F9FF', '#FAF5FF'], // Light mode backgrounds
        extrapolate: 'clamp',
    });

    // Handle tactile feedback when snap indices change
    useEffect(() => {
        if (currentIndex >= 0) {
            Haptics.selectionAsync().catch(() => {});
        }
    }, [currentIndex]);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            const nextIndex = viewableItems[0].index ?? 0;
            setCurrentIndex(nextIndex);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            completeOnboarding();
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            slidesRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
    };

    const completeOnboarding = async () => {
        try {
            await clientStorage.setItem('onboarding_completed', 'true');
            if (isAuthenticated) {
                router.replace('/(drawer)/(tabs)' as any);
            } else {
                router.replace('/(auth)/login');
            }
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            router.replace('/(auth)/login');
        }
    };

    return (
        <Animated.View style={[styles.container, { backgroundColor }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <FlatList
                        data={SLIDES}
                        renderItem={({ item, index }) => (
                            <OnboardingSlide
                                item={item}
                                index={index}
                                scrollX={scrollX}
                            />
                        )}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        bounces={false}
                        keyExtractor={(item) => item.id}
                        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                            useNativeDriver: false,
                        })}
                        scrollEventThrottle={16}
                        onViewableItemsChanged={viewableItemsChanged}
                        viewabilityConfig={viewConfig}
                        ref={slidesRef}
                    />
                </View>

                {/* Premium Navigation Footer */}
                <OnboardingNavigation
                    step={currentIndex + 1}
                    totalSteps={SLIDES.length}
                    onBack={handleBack}
                    onNext={handleNext}
                />
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
});
