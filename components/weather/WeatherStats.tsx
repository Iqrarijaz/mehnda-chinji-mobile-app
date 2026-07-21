import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

const RAIN_BLUE = '#3B82F6';

interface StatItemProps { icon: string; label: string; value: string; accent: string; }
const StatItem = React.memo(({ icon, label, value, accent }: StatItemProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.statItem}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? `${accent}26` : `${accent}18` }]}>
                <Ionicons name={icon as any} size={20} color={accent} />
            </View>
            <ThemedText style={[styles.value, { color: colors.text }]}>{value}</ThemedText>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{label}</ThemedText>
        </View>
    );
});

interface WeatherStatsProps { weather: any; forecast: any; }
const WeatherStats = React.memo(({ weather, forecast }: WeatherStatsProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    if (!weather) return null;
    const rainPct = forecast ? `${Math.round((forecast.list[0]?.pop || 0) * 100)}%` : '—';
    return (
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
            <View style={styles.grid}>
                <StatItem icon="water" label="Humidity" value={`${weather.main.humidity}%`} accent={colors.primary} />
                <StatItem icon="send" label="Wind" value={`${Math.round(weather.wind.speed)} m/s`} accent={colors.lime} />
                <StatItem icon="speedometer" label="Pressure" value={`${weather.main.pressure}`} accent={colors.secondary} />
                <StatItem icon="rainy" label="Rain" value={rainPct} accent={RAIN_BLUE} />
            </View>
        </View>
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
