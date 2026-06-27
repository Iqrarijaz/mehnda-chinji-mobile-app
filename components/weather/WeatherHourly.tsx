import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { getIconName, PRIMARY } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface HourlyCardProps { time: string; icon: string; temp: number; isNow: boolean; delay: number; }
const HourlyCard = React.memo(({ time, icon, temp, isNow, delay }: HourlyCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View
            entering={SlideInLeft.delay(delay).duration(400)}
            style={[
                styles.card,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.background },
                isNow && { backgroundColor: isDark ? colors.primary : PRIMARY }
            ]}
        >
            <ThemedText style={[styles.time, { color: colors.textSecondary }, isNow && styles.timeActive]}>{time}</ThemedText>
            <Ionicons name={getIconName(icon) as any} size={22} color={isNow ? '#FFFFFF' : colors.textSecondary} />
            <ThemedText style={[styles.temp, { color: colors.text }, isNow && styles.tempActive]}>{temp}°</ThemedText>
        </Animated.View>
    );
});

interface WeatherHourlyProps { data: { time: string; icon: string; temp: number }[]; }
const WeatherHourly = React.memo(({ data }: WeatherHourlyProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    if (!data.length) return null;
    return (
        <Animated.View entering={SlideInLeft.delay(450).duration(400)} style={[styles.wrapper, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
            <ThemedText style={[styles.title, { color: colors.text }]}>Hourly Forecast</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {data.map((h, i) => (
                    <HourlyCard key={i} time={h.time} icon={h.icon} temp={h.temp} isNow={i === 0} delay={i * 40} />
                ))}
            </ScrollView>
        </Animated.View>
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
