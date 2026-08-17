import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming } from 'react-native-reanimated';

const SkimBox = React.memo(({ w, h, radius = 8, color }: { w: number | string; h: number; radius?: number; color: string }) => (
    <View style={{ width: w as any, height: h, borderRadius: radius, backgroundColor: color }} />
));

const SkeletonCard = React.memo(({ colors }: { colors: typeof Colors.light }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
        <SkimBox w={46} h={46} radius={14} color={colors.skeletonBase} />
        <View style={styles.lines}>
            <SkimBox w="70%" h={14} radius={6} color={colors.skeletonBase} />
            <View style={{ height: 6 }} />
            <SkimBox w="90%" h={12} radius={5} color={colors.skeletonBase} />
            <View style={{ height: 4 }} />
            <SkimBox w="40%" h={12} radius={5} color={colors.skeletonBase} />
            <View style={{ height: 6 }} />
            <SkimBox w="25%" h={10} radius={4} color={colors.skeletonBase} />
        </View>
    </View>
));

const NotificationSkeleton = React.memo(() => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Single shared opacity pulse for the whole skeleton, instead of one
    // loop per skeleton box.
    const opacity = useSharedValue(0.35);
    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(withTiming(0.7, { duration: 650 }), withTiming(0.35, { duration: 650 })),
            -1,
            true
        );
    }, [opacity]);
    const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={[styles.container, pulseStyle]}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} colors={colors} />)}
        </Animated.View>
    );
});

export default NotificationSkeleton;

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, paddingTop: 7 },
    card: {
        flexDirection: 'row',
        borderRadius: Layout.borderRadius,
        padding: 13,
        marginBottom: 10
    },
    lines: { flex: 1, marginLeft: 14 }
});
