import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { getIconName } from './weatherUtils';

interface WeatherHeroProps {
    weather: any;
    isLoading: boolean;
}

// ── Shimmer ──────────────────────────────────────────────────────────────────
const ShimmerBox = React.memo(({ w, h, radius = 12 }: { w: number | string; h: number; radius?: number }) => {
    const opacity = useSharedValue(0.4);
    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
            -1,
            true
        );
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return (
        <Animated.View
            style={[{ width: w as any, height: h, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.25)' }, style]}
        />
    );
});

// ── Floating Icon ────────────────────────────────────────────────────────────
const FloatingIcon = React.memo(({ icon }: { icon: string }) => {
    const float = useSharedValue(0);
    useEffect(() => {
        float.value = withRepeat(
            withSequence(withTiming(-8, { duration: 2000 }), withTiming(0, { duration: 2000 })),
            -1,
            true
        );
    }, []);
    const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
    return (
        <Animated.View style={floatStyle}>
            <Ionicons
                name={icon as any}
                size={Platform.OS === 'android' ? 72 : 80}
                color="rgba(255,255,255,0.95)"
            />
        </Animated.View>
    );
});

// ── Hero ─────────────────────────────────────────────────────────────────────
const WeatherHero = React.memo(({ weather, isLoading }: WeatherHeroProps) => {
    const scaleAnim = useSharedValue(0.92);
    useEffect(() => {
        if (weather) scaleAnim.value = withSpring(1, { damping: 14 });
    }, [weather]);
    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleAnim.value }] }));

    if (isLoading && !weather) {
        return (
            <View style={styles.hero}>
                <ShimmerBox w={200} h={100} radius={16} />
                <View style={{ height: 12 }} />
                <ShimmerBox w={140} h={24} radius={10} />
                <View style={{ height: 8 }} />
                <ShimmerBox w={100} h={18} radius={8} />
            </View>
        );
    }

    if (!weather) return null;

    return (
        <Animated.View style={[styles.hero, scaleStyle]}>
            <Animated.View entering={FadeIn.delay(100).duration(500)}>
                <FloatingIcon icon={getIconName(weather.weather[0].icon)} />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ alignItems: 'center' }}>
                <ThemedText style={styles.temp}>{Math.round(weather.main.temp)}°</ThemedText>
                <ThemedText style={styles.condition}>{weather.weather[0].description}</ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ alignItems: 'center', marginTop: 12 }}>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                    <ThemedText style={styles.city}>{weather.name}</ThemedText>
                </View>
                <ThemedText style={styles.date}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.metaPill}>
                <ThemedText style={styles.metaText}>Feels like {Math.round(weather.main.feels_like)}°</ThemedText>
                <View style={styles.metaDot} />
                <ThemedText style={styles.metaText}>
                    H:{Math.round(weather.main.temp_max)}° L:{Math.round(weather.main.temp_min)}°
                </ThemedText>
            </Animated.View>
        </Animated.View>
    );
});

export default WeatherHero;

const styles = StyleSheet.create({
    hero: { alignItems: 'center', paddingVertical: 16, marginBottom: 20 },
    temp: {
        fontSize: Platform.OS === 'android' ? 80 : 90,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -4,
        lineHeight: Platform.OS === 'android' ? 88 : 100,
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    condition: { fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: '600', textTransform: 'capitalize', marginTop: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    city: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
    date: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: '500' },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    metaText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
    metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
});
