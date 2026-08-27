import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useWeather } from '@/hooks/useWeather';
import { useWeatherLocation } from '@/hooks/useWeatherLocation';
import { buildDailyForecast } from '@/utils/forecastDaily';
import { getWeatherIconName } from '@/utils/weatherTheme';
import { ThemedText } from '../ThemedText';

const WEATHER_BG = require('@/assets/images/widgets/weather_bg.png');

// The plate is authored 2:1 with its safe zones measured at that ratio, so the
// card tracks that aspect and the art is never cropped in the common case.
//
// MIN_CARD_HEIGHT is the floor the content genuinely needs: on a narrow phone
// (~328pt of card width) pure aspect sizing yields a box too short for the
// stack below, and since the card clips its overflow the strip would be
// silently cut off rather than visibly break. Below that width the card grows
// slightly taller than 2:1 and cover-crops a few percent off the sides, which
// the safe zones absorb.
const CARD_ASPECT = 1.9;
const MIN_CARD_HEIGHT = 168;

interface HomeHeaderWeatherWidgetProps {
    onPress?: () => void;
}

/** OpenWeather returns metres per second under units=metric. */
const msToKmh = (ms: number) => Math.round(ms * 3.6);

function relativeTime(unixSec?: number): string {
    if (!unixSec) return '';
    const diffMin = Math.max(0, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const h = Math.floor(diffMin / 60);
    return `${h}h ago`;
}

// ── Small pieces ───────────────────────────────────────────────────────────

const Metric = React.memo(function Metric({
    icon, value, label,
}: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
    return (
        <View style={styles.metric}>
            <Ionicons name={icon} size={11} color="rgba(255,255,255,0.72)" />
            <View>
                <ThemedText style={styles.metricValue}>{value}</ThemedText>
                <ThemedText style={styles.metricLabel}>{label}</ThemedText>
            </View>
        </View>
    );
});

const DayColumn = React.memo(function DayColumn({
    label, icon, high, isToday,
}: { label: string; icon?: string; high: number; isToday: boolean }) {
    return (
        <View style={[styles.day, isToday && styles.dayToday]}>
            <ThemedText style={[styles.dayLabel, isToday && styles.dayLabelToday]} numberOfLines={1}>
                {label.toUpperCase()}
            </ThemedText>
            <Ionicons name={getWeatherIconName(icon)} size={13} color="#FCC968" />
            <ThemedText style={styles.dayTemp}>{high}°</ThemedText>
        </View>
    );
});

const WeatherSkeleton = React.memo(function WeatherSkeleton() {
    return (
        <View style={styles.wrapper}>
            <View style={[styles.card, styles.skeletonCard]}>
                <Skeleton width={96} height={18} borderRadius={9} />
                <View style={{ height: 10 }} />
                <Skeleton width={'52%'} height={40} borderRadius={8} />
                <View style={{ height: 10 }} />
                <Skeleton width={'42%'} height={14} borderRadius={6} />
                <View style={{ flex: 1 }} />
                <Skeleton width={'100%'} height={40} borderRadius={10} />
            </View>
        </View>
    );
});

// ── Widget ─────────────────────────────────────────────────────────────────

const HomeHeaderWeatherWidget = React.memo(function HomeHeaderWeatherWidget({
    onPress,
}: HomeHeaderWeatherWidgetProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const { coords, fallbackCity } = useWeatherLocation();
    const { weather, forecast, isWeatherLoading } = useWeather(
        fallbackCity,
        coords ? { lat: coords.latitude, lon: coords.longitude } : null,
    );

    const days = useMemo(() => buildDailyForecast((forecast as any)?.list, 5), [forecast]);

    // Today's range comes from the forecast when it is loaded, since the current
    // observation's own min/max covers only the reporting window.
    const { high, low } = useMemo(() => {
        if (days.length) return { high: days[0].high, low: days[0].low };
        return {
            high: weather ? Math.round(weather.main.temp_max) : null,
            low: weather ? Math.round(weather.main.temp_min) : null,
        };
    }, [days, weather]);

    if (!weather || isWeatherLoading) return <WeatherSkeleton />;

    const temp = Math.round(weather.main.temp);
    const condition = weather.weather?.[0]?.main ?? '—';
    const icon = weather.weather?.[0]?.icon;
    const city = (weather.name || fallbackCity || '').split(',')[0].trim();
    const updated = relativeTime(weather.dt);

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.card}>
                <ImageBackground
                    source={WEATHER_BG}
                    style={styles.bg}
                    imageStyle={styles.bgImage}
                    resizeMode="cover"
                >
                    {/* No scrim over the plate: its own gradients were tuned until
                        every safe zone cleared AA against white, and stacking
                        another one would only dull the art without helping. */}
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.headerRow}>
                            <View style={[styles.pill, { backgroundColor: colors.accent }]}>
                                <ThemedText style={styles.pillText}>WEATHER NOW</ThemedText>
                            </View>
                            <View style={styles.locationRow}>
                                <Ionicons name="location" size={10} color="rgba(255,255,255,0.78)" />
                                <ThemedText style={styles.locationText} numberOfLines={1}>
                                    {city}
                                </ThemedText>
                            </View>
                            {updated ? (
                                <ThemedText style={styles.updated} numberOfLines={1}>{updated}</ThemedText>
                            ) : null}
                        </View>

                        {/* Primary metric */}
                        <View style={styles.tempRow}>
                            <ThemedText style={styles.temp}>{temp}</ThemedText>
                            <ThemedText style={styles.degree}>°C</ThemedText>
                            <Ionicons
                                name={getWeatherIconName(icon)}
                                size={22}
                                color="#FFFFFF"
                                style={styles.conditionIcon}
                            />
                        </View>

                        <View style={styles.conditionRow}>
                            <ThemedText style={styles.condition} numberOfLines={1}>{condition}</ThemedText>
                            <ThemedText style={styles.range}>
                                {high != null ? `H ${high}°` : 'H --'} · {low != null ? `L ${low}°` : 'L --'}
                            </ThemedText>
                        </View>

                        {/* Compact metrics */}
                        <View style={styles.metricsRow}>
                            <Metric icon="water-outline" value={`${weather.main.humidity}%`} label="HUMIDITY" />
                            <Metric icon="navigate-outline" value={`${msToKmh(weather.wind.speed)} km/h`} label="WIND" />
                            <Metric icon="thermometer-outline" value={`${Math.round(weather.main.feels_like)}°`} label="FEELS" />
                        </View>

                        {/* 5-day strip. Hidden rather than shown empty while the
                            forecast is still in flight -- the current conditions
                            above already carry the card. */}
                        {days.length > 0 ? (
                            <View style={styles.strip}>
                                {days.map(d => (
                                    <DayColumn
                                        key={d.date}
                                        label={d.label}
                                        icon={d.icon}
                                        high={d.high}
                                        isToday={d.label === 'Today'}
                                    />
                                ))}
                            </View>
                        ) : null}

                    </View>
                </ImageBackground>
            </TouchableOpacity>
        </View>
    );
});

HomeHeaderWeatherWidget.displayName = 'HomeHeaderWeatherWidget';
export default HomeHeaderWeatherWidget;

const styles = StyleSheet.create({
    wrapper: { width: '100%', marginTop: 4, marginBottom: 14 },
    card: {
        width: '100%',
        aspectRatio: CARD_ASPECT,
        minHeight: MIN_CARD_HEIGHT,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 4,
    },
    skeletonCard: {
        backgroundColor: 'rgba(255,255,255,0.10)',
        padding: 14,
    },
    bg: { flex: 1 },
    bgImage: { borderRadius: 22 },
    content: { flex: 1, paddingHorizontal: 14, paddingVertical: 11 },

    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 7 },
    pillText: { fontSize: 8, fontWeight: '900', color: '#222831', letterSpacing: 0.6 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
    locationText: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.82)', flexShrink: 1 },

    tempRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 3 },
    temp: { fontSize: 40, fontWeight: '900', color: '#FFFFFF', lineHeight: 42, letterSpacing: -1 },
    degree: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.88)', marginTop: 5, marginLeft: 1 },
    conditionIcon: { marginLeft: 10, marginTop: 9 },

    conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -2 },
    condition: { fontSize: 12, fontWeight: '800', color: '#FFFFFF', flexShrink: 1 },
    range: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.78)' },

    metricsRow: { flexDirection: 'row', gap: 13, marginTop: 6 },
    metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metricValue: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', lineHeight: 13 },
    metricLabel: { fontSize: 7, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },

    strip: { flexDirection: 'row', gap: 5, marginTop: 'auto' },
    day: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.10)',
        gap: 1,
    },
    dayToday: { backgroundColor: 'rgba(255,255,255,0.18)' },
    dayLabel: { fontSize: 7, fontWeight: '800', color: 'rgba(255,255,255,0.68)', letterSpacing: 0.4 },
    dayLabelToday: { color: '#FCC968' },
    dayTemp: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },

    updated: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
});
