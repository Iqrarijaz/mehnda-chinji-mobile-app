import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemeColors } from '@/constants/colors';
import { DailySummary } from '@/utils/forecastDaily';
import { getWeatherIconName } from '@/utils/weatherTheme';

/** OpenWeather returns metres per second under units=metric. */
const msToKmh = (ms: number) => Math.round(ms * 3.6);

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

interface WeatherSlideProps {
    colors: ThemeColors;
    city: string;
    updated: string;
    temp: number;
    condition: string;
    icon?: string;
    high: number | null;
    low: number | null;
    humidity: number;
    windMs: number;
    feelsLike: number;
    days: DailySummary[];
}

function WeatherSlideComponent({
    colors, city, updated, temp, condition, icon, high, low, humidity, windMs, feelsLike, days,
}: WeatherSlideProps) {
    return (
        <View style={styles.slide}>
            <View style={styles.headerRow}>
                <View style={[styles.pill, { backgroundColor: colors.accent }]}>
                    <ThemedText style={styles.pillText}>WEATHER NOW</ThemedText>
                </View>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={10} color="rgba(255,255,255,0.78)" />
                    <ThemedText style={styles.locationText} numberOfLines={1}>{city}</ThemedText>
                </View>
                {updated ? <ThemedText style={styles.updated} numberOfLines={1}>{updated}</ThemedText> : null}
            </View>

            <View style={styles.tempRow}>
                <ThemedText style={styles.temp}>{temp}</ThemedText>
                <ThemedText style={styles.degree}>°C</ThemedText>
                <Ionicons name={getWeatherIconName(icon)} size={22} color="#FFFFFF" style={styles.conditionIcon} />
            </View>

            <View style={styles.conditionRow}>
                <ThemedText style={styles.condition} numberOfLines={1}>{condition}</ThemedText>
                <ThemedText style={styles.range}>
                    {high != null ? `H ${high}°` : 'H --'} · {low != null ? `L ${low}°` : 'L --'}
                </ThemedText>
            </View>

            <View style={styles.metricsRow}>
                <Metric icon="water-outline" value={`${humidity}%`} label="HUMIDITY" />
                <Metric icon="navigate-outline" value={`${msToKmh(windMs)} km/h`} label="WIND" />
                <Metric icon="thermometer-outline" value={`${Math.round(feelsLike)}°`} label="FEELS" />
            </View>

            {/* Hidden rather than shown empty while the forecast is still in
                flight -- the current conditions above already carry the slide. */}
            {days.length > 0 ? (
                <View style={styles.strip}>
                    {days.map(d => (
                        <DayColumn key={d.date} label={d.label} icon={d.icon} high={d.high} isToday={d.label === 'Today'} />
                    ))}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    slide: { flex: 1 },

    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 7 },
    pillText: { fontSize: 8, fontWeight: '900', color: '#222831', letterSpacing: 0.6 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
    locationText: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.82)', flexShrink: 1 },
    updated: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

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
        flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.10)', gap: 1,
    },
    dayToday: { backgroundColor: 'rgba(255,255,255,0.18)' },
    dayLabel: { fontSize: 7, fontWeight: '800', color: 'rgba(255,255,255,0.68)', letterSpacing: 0.4 },
    dayLabelToday: { color: '#FCC968' },
    dayTemp: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
});

export const WeatherSlide = React.memo(WeatherSlideComponent);
WeatherSlide.displayName = 'WeatherSlide';
