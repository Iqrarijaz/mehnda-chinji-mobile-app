import React, { useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useWeather } from '@/hooks/useWeather';
import { useWeatherLocation } from '@/hooks/useWeatherLocation';
import { useNextPrayer } from '@/hooks/useNextPrayer';
import { getWeatherIconName, getWeatherAccent } from '@/utils/weatherTheme';
import { ThemedText } from '../ThemedText';

interface HomeHeaderWeatherWidgetProps {
    onPress?: () => void;
}

// ── Isolated prayer block (re-renders every second for the live countdown) ──
const PrayerBlock = React.memo(({ city, accent }: { city: string; accent: string }) => {
    const { nextPrayer } = useNextPrayer(city);
    return (
        <View style={styles.glassPanel}>
            <ThemedText style={styles.glassLabel}>NEXT PRAYER</ThemedText>
            <View style={styles.prayerNameRow}>
                <Ionicons name="moon-outline" size={13} color={accent} style={{ marginRight: 5 }} />
                <ThemedText style={styles.prayerName} numberOfLines={1}>
                    {nextPrayer?.name ?? '—'}
                </ThemedText>
            </View>
            <ThemedText style={[styles.prayerCountdown, { color: accent }]} numberOfLines={1}>
                {nextPrayer ? `in ${nextPrayer.countdownLabel}` : '· · ·'}
            </ThemedText>
            <ThemedText style={styles.prayerTime}>{nextPrayer?.time ?? ''}</ThemedText>
        </View>
    );
});
PrayerBlock.displayName = 'PrayerBlock';

// ── Loading skeleton (shimmering blocks) ──
const Skeleton = ({ backgroundColor }: { backgroundColor: string }) => {
    const shimmer = useSharedValue(0.4);
    React.useEffect(() => {
        shimmer.value = withRepeat(withTiming(0.9, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true);
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: shimmer.value }));
    const Block = ({ w, h, mt = 0 }: { w: number | string; h: number; mt?: number }) => (
        <Animated.View style={[{ width: w as any, height: h, borderRadius: Layout.borderRadius, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: mt }, style]} />
    );
    return (
        <View style={[styles.card, { backgroundColor }]}>
            <View style={styles.row}>
                <View style={{ flex: 1.3 }}>
                    <Block w={90} h={28} />
                    <Block w={70} h={10} mt={6} />
                    <Block w={110} h={10} mt={6} />
                </View>
                <View style={[styles.glassPanel, { justifyContent: 'center' }]}>
                    <Block w={'70%'} h={10} />
                    <Block w={'55%'} h={16} mt={6} />
                    <Block w={'45%'} h={10} mt={6} />
                </View>
            </View>
        </View>
    );
};

const HomeHeaderWeatherWidget = React.memo(({ onPress }: HomeHeaderWeatherWidgetProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const palette = { primary: colors.primary, secondary: colors.secondary, lime: colors.lime };

    // Current location when permitted, else the profile/default city.
    const { coords, fallbackCity } = useWeatherLocation();
    const { weather, forecast, isWeatherLoading } = useWeather(
        fallbackCity,
        coords ? { lat: coords.latitude, lon: coords.longitude } : null,
    );

    const icon = weather?.weather?.[0]?.icon;
    const accent = getWeatherAccent(icon, palette);

    // Today's high / low from the 3-hourly forecast (falls back to current).
    const { high, low } = useMemo(() => {
        const list = (forecast as any)?.list;
        if (Array.isArray(list) && list.length) {
            const todayStr = new Date().toISOString().slice(0, 10);
            const temps = list
                .filter((i: any) => new Date(i.dt * 1000).toISOString().slice(0, 10) === todayStr)
                .map((i: any) => i.main?.temp)
                .filter((t: any) => typeof t === 'number');
            if (temps.length) return { high: Math.round(Math.max(...temps)), low: Math.round(Math.min(...temps)) };
        }
        return {
            high: weather ? Math.round(weather.main.temp_max) : null,
            low: weather ? Math.round(weather.main.temp_min) : null
        };
    }, [forecast, weather]);

    if (isWeatherLoading && !weather) {
        return (
            <Pressable onPress={onPress}>
                <Skeleton backgroundColor={colors.primary} />
            </Pressable>
        );
    }

    const temp = weather ? Math.round(weather.main.temp) : '--';
    const condition = weather?.weather?.[0]?.main ?? '—';
    const city = (weather?.name || fallbackCity || '').split(',')[0].trim();
    const prayerCity = city || 'Talagang';
    const updatedLabel = relativeTime(weather?.dt);

    return (
        <Animated.View entering={FadeInDown.duration(450)}>
            <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.92 }}>
                <View style={[styles.card, { backgroundColor: colors.primary }]}>
                    <View style={styles.row}>
                        {/* Weather column */}
                        <View style={styles.weatherCol}>
                            <View style={styles.tempRow}>
                                <Ionicons name={getWeatherIconName(icon)} size={30} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Animated.View key={String(temp)} entering={FadeIn.duration(400)}>
                                    <ThemedText style={styles.temp}>{temp}°</ThemedText>
                                </Animated.View>
                            </View>
                            <ThemedText style={styles.condition} numberOfLines={1}>{condition}</ThemedText>
                            <View style={styles.metaRow}>
                                <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
                                <ThemedText style={styles.city} numberOfLines={1}>{city}</ThemedText>
                            </View>
                            <View style={styles.metaRow}>
                                <Ionicons name="arrow-up" size={11} color={accent} />
                                <ThemedText style={styles.highLow}>{high != null ? `${high}°` : '--'}</ThemedText>
                                <Ionicons name="arrow-down" size={11} color="rgba(255,255,255,0.85)" style={{ marginLeft: 8 }} />
                                <ThemedText style={styles.highLow}>{low != null ? `${low}°` : '--'}</ThemedText>
                            </View>
                        </View>

                        {/* Prayer glass panel */}
                        <PrayerBlock city={prayerCity} accent={accent} />
                    </View>

                    {updatedLabel ? (
                        <View style={styles.updatedRow}>
                            <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
                            <ThemedText style={styles.updated}>Updated {updatedLabel}</ThemedText>
                        </View>
                    ) : null}
                </View>
            </Pressable>
        </Animated.View>
    );
});

HomeHeaderWeatherWidget.displayName = 'HomeHeaderWeatherWidget';
export default HomeHeaderWeatherWidget;

function relativeTime(unixSec?: number): string {
    if (!unixSec) return '';
    const diffMin = Math.max(0, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const h = Math.floor(diffMin / 60);
    return `${h}h ago`;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch'
    },
    weatherCol: {
        flex: 1.3,
        justifyContent: 'center'
    },
    tempRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    temp: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 34
    },
    condition: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)'
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2
    },
    city: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        flexShrink: 1
    },
    highLow: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 2
    },
    // Glassmorphism panel
    glassPanel: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: Layout.borderRadius,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginLeft: 12,
        justifyContent: 'center'
    },
    glassLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.6,
        color: 'rgba(255,255,255,0.75)'
    },
    prayerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2
    },
    prayerName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        flexShrink: 1
    },
    prayerCountdown: {
        fontSize: 13,
        fontWeight: '800',
        marginTop: 1
    },
    prayerTime: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)'
    },
    updatedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6
    },
    updated: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)'
    }
});
