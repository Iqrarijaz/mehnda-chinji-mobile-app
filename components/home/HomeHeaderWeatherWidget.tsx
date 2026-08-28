import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    ImageBackground,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { useWeather } from '@/hooks/useWeather';
import { useWeatherLocation } from '@/hooks/useWeatherLocation';
import { buildDailyForecast } from '@/utils/forecastDaily';
import { getWeatherIconName } from '@/utils/weatherTheme';
import { ThemedText } from '../ThemedText';

const WEATHER_BG = require('@/assets/images/widgets/weather_bg.png');

const CARD_ASPECT = 2.4;
const MIN_CARD_HEIGHT = 118;

interface HomeHeaderWeatherWidgetProps {
    onPress?: () => void;
}

/** OpenWeather returns metres per second under units=metric. */
const msToKmh = (ms: number) => Math.round(ms * 3.6);

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

const WeatherSkeleton = React.memo(function WeatherSkeleton() {
    return (
        <View style={styles.wrapper}>
            <View style={[styles.card, styles.skeletonCard]}>
                <Skeleton width={'45%'} height={30} borderRadius={8} />
                <View style={{ height: 6 }} />
                <Skeleton width={'35%'} height={12} borderRadius={5} />
                <View style={{ height: 8 }} />
                <Skeleton width={'80%'} height={14} borderRadius={5} />
            </View>
        </View>
    );
});

// ── Widget ─────────────────────────────────────────────────────────────────

const HomeHeaderWeatherWidget = React.memo(function HomeHeaderWeatherWidget({
    onPress,
}: HomeHeaderWeatherWidgetProps) {
    const { coords, fallbackCity } = useWeatherLocation();
    const { weather, forecast, isWeatherLoading } = useWeather(
        fallbackCity,
        coords ? { lat: coords.latitude, lon: coords.longitude } : null,
    );

    const days = useMemo(() => buildDailyForecast((forecast as any)?.list, 5), [forecast]);

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

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.card}>
                <ImageBackground
                    source={WEATHER_BG}
                    style={styles.bg}
                    imageStyle={styles.bgImage}
                    resizeMode="cover"
                >
                    <View style={styles.content}>
                        {/* Primary metric */}
                        <View style={styles.tempRow}>
                            <ThemedText style={styles.temp}>{temp}</ThemedText>
                            <ThemedText style={styles.degree}>°C</ThemedText>
                            <Ionicons
                                name={getWeatherIconName(icon)}
                                size={20}
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

                        {/* Compact metrics including Location */}
                        <View style={styles.metricsRow}>
                            {city ? (
                                <View style={styles.metric}>
                                    <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.72)" />
                                    <View style={{ maxWidth: 90 }}>
                                        <ThemedText style={styles.metricValue} numberOfLines={1}>{city}</ThemedText>
                                        <ThemedText style={styles.metricLabel}>LOCATION</ThemedText>
                                    </View>
                                </View>
                            ) : null}
                            <Metric icon="water-outline" value={`${weather.main.humidity}%`} label="HUMIDITY" />
                            <Metric icon="navigate-outline" value={`${msToKmh(weather.wind.speed)} km/h`} label="WIND" />
                            <Metric icon="thermometer-outline" value={`${Math.round(weather.main.feels_like)}°`} label="FEELS" />
                        </View>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        </View>
    );
});

HomeHeaderWeatherWidget.displayName = 'HomeHeaderWeatherWidget';
export default HomeHeaderWeatherWidget;

const styles = StyleSheet.create({
    wrapper: { width: '100%', marginTop: 2, marginBottom: 10 },
    card: {
        width: '100%',
        aspectRatio: CARD_ASPECT,
        minHeight: MIN_CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
        elevation: 3,
    },
    skeletonCard: {
        backgroundColor: 'rgba(255,255,255,0.10)',
        padding: 12,
    },
    bg: { flex: 1 },
    bgImage: { borderRadius: 20 },
    content: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'space-between' },

    tempRow: { flexDirection: 'row', alignItems: 'flex-start' },
    temp: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', lineHeight: 38, letterSpacing: -1 },
    degree: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.88)', marginTop: 4, marginLeft: 1 },
    conditionIcon: { marginLeft: 8, marginTop: 7 },

    conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: -2 },
    condition: { fontSize: 12, fontWeight: '800', color: '#FFFFFF', flexShrink: 1 },
    range: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.78)' },

    metricsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    metric: { flexDirection: 'row', alignItems: 'center', gap: 3.5 },
    metricValue: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF', lineHeight: 12 },
    metricLabel: { fontSize: 6.5, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
});
