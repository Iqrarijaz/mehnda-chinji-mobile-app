import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { PRIMARY } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface StatItemProps { icon: string; label: string; value: string; delay: number; }
const StatItem = React.memo(({ icon, label, value, delay }: StatItemProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(400)} style={styles.statItem}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : `${PRIMARY}12` }]}>
                <Ionicons name={icon as any} size={20} color={isDark ? colors.text : PRIMARY} />
            </View>
            <ThemedText style={[styles.value, { color: colors.text }]}>{value}</ThemedText>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{label}</ThemedText>
        </Animated.View>
    );
});

interface WeatherStatsProps { weather: any; forecast: any; }
const WeatherStats = React.memo(({ weather, forecast }: WeatherStatsProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    if (!weather) return null;
    const rainPct = forecast ? `${Math.round((forecast.list[0]?.pop || 0) * 100)}%` : '—';
    return (
        <Animated.View entering={SlideInLeft.delay(350).duration(400)} style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
            <View style={styles.grid}>
                <StatItem icon="water" label="Humidity" value={`${weather.main.humidity}%`} delay={400} />
                <StatItem icon="send" label="Wind" value={`${Math.round(weather.wind.speed)} m/s`} delay={450} />
                <StatItem icon="speedometer" label="Pressure" value={`${weather.main.pressure}`} delay={500} />
                <StatItem icon="rainy" label="Rain" value={rainPct} delay={550} />
            </View>
        </Animated.View>
    );
});

export default WeatherStats;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius, padding: 18, marginBottom: 14,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    grid: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    iconWrap: {
        width: 40, height: 40, borderRadius: Layout.borderRadius,
        justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    value: { fontSize: 15, fontWeight: '800' },
    label: { fontSize: 11, fontWeight: '600' },
});
