import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
    item: {
        id: string;
        title: string;
        description: string;
        animation: any;
    };
    index: number;
    scrollX: Animated.Value;
    /** Whether this slide is the currently active/visible one. Off-screen
     * slides pause their Lottie animation instead of playing in the
     * background. Defaults to true so existing callers keep working. */
    isActive?: boolean;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = React.memo(({ item, index, scrollX, isActive = true }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const lottieRef = useRef<LottieView>(null);

    useEffect(() => {
        if (isActive) {
            lottieRef.current?.play();
        } else {
            lottieRef.current?.pause();
        }
    }, [isActive]);

    // Slide animations mapping scroll position
    const translateY = scrollX.interpolate({
        inputRange: [(index - 1) * width, index * width, (index + 1) * width],
        outputRange: [50, 0, -50],
        extrapolate: 'clamp' });

    const opacity = scrollX.interpolate({
        inputRange: [(index - 0.6) * width, index * width, (index + 0.6) * width],
        outputRange: [0, 1, 0],
        extrapolate: 'clamp' });

    const scale = scrollX.interpolate({
        inputRange: [(index - 1) * width, index * width, (index + 1) * width],
        outputRange: [0.85, 1, 0.85],
        extrapolate: 'clamp' });

    return (
        <View style={styles.container}>
            {/* Lottie Animation Display */}
            <Animated.View style={[styles.animationContainer, { transform: [{ scale }] }]}>
                <LottieView
                    ref={lottieRef}
                    source={item.animation}
                    autoPlay={isActive}
                    loop
                    style={styles.lottie}
                    hardwareAccelerationAndroid
                    renderMode="HARDWARE"
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.cardContainer,
                    {
                        opacity,
                        transform: [{ translateY }],
                        backgroundColor: colors.card }
                ]}
            >
                <ThemedText
                    type="urdu"
                    style={[
                        styles.title,
                        {
                            color: colors.primary,
                            textAlign: 'center'
                        }
                    ]}
                >
                    {item.title}
                </ThemedText>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                    {item.description}
                </ThemedText>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24 },
    animationContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8 },
    lottie: {
        width: width * 0.76,
        height: width * 0.76 },
    cardContainer: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        paddingVertical: 16,
        paddingHorizontal: 15,
        alignItems: 'center' },
    title: {
        fontSize: 16.5,
        lineHeight: 34,
        fontWeight: '800',
        paddingTop: 4,
        letterSpacing: 0.2 },
    divider: {
        width: 32,
        height: 2,
        borderRadius: Layout.borderRadius,
        marginVertical: 12 },
    description: {
        fontSize: 10.5,
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '600',
        paddingHorizontal: 7 } });
