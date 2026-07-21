import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

function Dot({ delay, color }: { delay: number; color: string }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
                    withTiming(0, { duration: 260 })
                ),
                -1,
                false
            )
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: 0.35 + progress.value * 0.65,
        transform: [{ translateY: -progress.value * 5 }] }));

    return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

/**
 * Three softly bouncing brand-colored dots — the app's premium loading
 * indicator for list footers and inline waits.
 */
export function LoadingDots() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.row}>
            <Dot delay={0} color={colors.primary} />
            <Dot delay={140} color={colors.secondary} />
            <Dot delay={280} color={colors.lime} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7 },
    dot: {
        width: 8,
        height: 8,
        borderRadius: Layout.borderRadius } });
