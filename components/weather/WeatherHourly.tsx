import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

    const inner = (
        <>
            <ThemedText style={[styles.time, { color: colors.textSecondary }, isNow && styles.timeActive]}>{time}</ThemedText>
            <Ionicons name={getIconName(icon) as any} size={22} color={isNow ? '#FFFFFF' : colors.textSecondary} />
            <ThemedText style={[styles.temp, { color: colors.text }, isNow && styles.tempActive]}>{temp}°</ThemedText>
        </>
    );

    if (isNow) {
        // "Now" gets a warm Primary → Secondary gradient to stand out.
        return (
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                {inner}
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.background }]}>
            {inner}
        </View>
    );
});

interface WeatherHourlyProps { data: { time: string; icon: string; temp: number }[]; }
const WeatherHourly = React.memo(({ data }: WeatherHourlyProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    if (!data.length) return null;
    return (
        <View style={[styles.wrapper, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
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
        borderRadius: Layout.borderRadius, padding: 18, marginBottom: 14,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    title: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3, marginBottom: 14 },
    scroll: { gap: 10, paddingBottom: 4 },
    card: {
        borderRadius: Layout.borderRadius, paddingVertical: 12, paddingHorizontal: 14,
        alignItems: 'center', gap: 6, minWidth: 62,
    },
    time: { fontSize: 11, fontWeight: '600' },
    timeActive: { color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
    temp: { fontSize: 14, fontWeight: '800' },
    tempActive: { color: '#FFFFFF' },
});
