import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { PRIMARY } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface StatItemProps { icon: string; label: string; value: string; }
const StatItem = React.memo(({ icon, label, value }: StatItemProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.statItem}>
            <View style={[styles.iconWrap, { backgroundColor: colors.limeSoft }]}>
                <Ionicons name={icon as any} size={19} color={PRIMARY} />
            </View>
            <ThemedText style={[styles.value, { color: colors.text }]}>{value}</ThemedText>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{label}</ThemedText>
        </View>
    );
});

interface WeatherStatsProps { weather: any; forecast: any; }
const WeatherStats = React.memo(({ weather, forecast }: WeatherStatsProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    if (!weather) return null;
    const rainPct = forecast ? `${Math.round((forecast.list[0]?.pop || 0) * 100)}%` : '—';
    return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.grid}>
                <StatItem icon="water" label="Humidity" value={`${weather.main.humidity}%`} />
                <StatItem icon="send" label="Wind" value={`${Math.round(weather.wind.speed)} m/s`} />
                <StatItem icon="speedometer" label="Pressure" value={`${weather.main.pressure}`} />
                <StatItem icon="rainy" label="Rain" value={rainPct} />
            </View>
        </View>
    );
});

export default WeatherStats;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.cardBorderRadius, padding: 18, marginBottom: 14,
    },
    grid: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    iconWrap: {
        width: 42, height: 42, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    value: { fontSize: 15, fontWeight: '800' },
    label: { fontSize: 11, fontWeight: '600' },
});
