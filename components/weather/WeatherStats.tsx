import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '../themedText';
import { PRIMARY } from './weatherUtils';

interface StatItemProps { icon: string; label: string; value: string; delay: number; }
const StatItem = React.memo(({ icon, label, value, delay }: StatItemProps) => (
    <Animated.View entering={SlideInLeft.delay(delay).duration(400)} style={styles.statItem}>
        <View style={styles.iconWrap}>
            <Ionicons name={icon as any} size={20} color={PRIMARY} />
        </View>
        <ThemedText style={styles.value}>{value}</ThemedText>
        <ThemedText style={styles.label}>{label}</ThemedText>
    </Animated.View>
));

interface WeatherStatsProps { weather: any; forecast: any; }
const WeatherStats = React.memo(({ weather, forecast }: WeatherStatsProps) => {
    if (!weather) return null;
    const rainPct = forecast ? `${Math.round((forecast.list[0]?.pop || 0) * 100)}%` : '—';
    return (
        <Animated.View entering={SlideInLeft.delay(350).duration(400)} style={styles.card}>
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
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    grid: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    iconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: `${PRIMARY}12`, justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    value: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    label: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
});
