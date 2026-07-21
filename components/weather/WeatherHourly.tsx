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
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[
            styles.card,
            isNow
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : `${colors.primary}0D` },
        ]}>
            <ThemedText style={[
                styles.time,
                { color: isNow ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
                isNow && styles.timeActive,
            ]}>{time}</ThemedText>
            <Ionicons
                name={getIconName(icon) as any}
                size={22}
                color={isNow ? '#FFFFFF' : colors.primary}
            />
            <ThemedText style={[
                styles.temp,
                { color: isNow ? '#FFFFFF' : colors.text },
            ]}>{temp}°</ThemedText>
        </View>
    );
});

interface WeatherHourlyProps { data: { time: string; icon: string; temp: number }[]; }
const WeatherHourly = React.memo(({ data }: WeatherHourlyProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    if (!data.length) return null;
    return (
        <View style={[styles.wrapper, { backgroundColor: colors.cardBg }]}>
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
        borderRadius: Layout.borderRadius, padding: 20, marginBottom: 14 },
    title: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3, marginBottom: 14 },
    scroll: { gap: 10, paddingBottom: 4 },
    card: {
        borderRadius: Layout.borderRadius, paddingVertical: 14, paddingHorizontal: 16,
        alignItems: 'center', gap: 6, minWidth: 66 },
    time: { fontSize: 11, fontWeight: '600' },
    timeActive: { fontWeight: '700' },
    temp: { fontSize: 14, fontWeight: '800' } });
