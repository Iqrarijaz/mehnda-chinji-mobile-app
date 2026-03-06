import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const SkimBox = React.memo(({ w, h, radius = 8 }: { w: number | string; h: number; radius?: number }) => {
    const opacity = useSharedValue(0.35);
    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(withTiming(0.7, { duration: 650 }), withTiming(0.35, { duration: 650 })),
            -1,
            true
        );
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return (
        <Animated.View
            style={[{ width: w as any, height: h, borderRadius: radius, backgroundColor: '#E2E8F0' }, style]}
        />
    );
});

const SkeletonCard = React.memo(() => (
    <View style={styles.card}>
        <SkimBox w={46} h={46} radius={14} />
        <View style={styles.lines}>
            <SkimBox w="70%" h={14} radius={6} />
            <View style={{ height: 6 }} />
            <SkimBox w="90%" h={12} radius={5} />
            <View style={{ height: 4 }} />
            <SkimBox w="40%" h={12} radius={5} />
            <View style={{ height: 6 }} />
            <SkimBox w="25%" h={10} radius={4} />
        </View>
    </View>
));

const NotificationSkeleton = React.memo(() => (
    <View style={styles.container}>
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </View>
));

export default NotificationSkeleton;

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 8 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    lines: { flex: 1, marginLeft: 14 },
});
