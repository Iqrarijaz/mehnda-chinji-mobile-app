import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { getIconName } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface HourlyCardProps { time: string; icon: string; temp: number; isNow: boolean; }
const HourlyCard = React.memo(({ time, icon, temp, isNow }: HourlyCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: colors.field },
                isNow && { backgroundColor: colors.primary }
            ]}
        >
            <ThemedText style={[styles.time, { color: colors.textSecondary }, isNow && styles.timeActive]}>{time}</ThemedText>
            <Ionicons name={getIconName(icon) as any} size={22} color={isNow ? '#FFFFFF' : colors.textSecondary} />
            <ThemedText style={[styles.temp, { color: colors.text }, isNow && styles.tempActive]}>{temp}°</ThemedText>
        </View>
    );
});

interface WeatherHourlyProps { data: { time: string; icon: string; temp: number }[]; }
const WeatherHourly = React.memo(({ data }: WeatherHourlyProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    if (!data.length) return null;
    return (
        <View style={[styles.wrapper, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.title, { color: colors.text }]}>Hourly Forecast</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {data.map((h, i) => (
                    <HourlyCard key={i} time={h.time} icon={h.icon} temp={h.temp} isNow={i === 0} />
                ))}
            </ScrollView>
        </View>
    );
});

export default WeatherHourly;

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: Layout.cardBorderRadius, padding: 18, marginBottom: 14,
    },
    title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 14 },
    scroll: { gap: 10, paddingBottom: 4 },
    card: {
        borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14,
        alignItems: 'center', gap: 7, minWidth: 62,
    },
    time: { fontSize: 11, fontWeight: '600' },
    timeActive: { color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
    temp: { fontSize: 14, fontWeight: '800' },
    tempActive: { color: '#FFFFFF' },
});
