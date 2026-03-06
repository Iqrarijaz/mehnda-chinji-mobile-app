import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '../themedText';
import { getIconName, PRIMARY } from './weatherUtils';

interface HourlyCardProps { time: string; icon: string; temp: number; isNow: boolean; delay: number; }
const HourlyCard = React.memo(({ time, icon, temp, isNow, delay }: HourlyCardProps) => (
    <Animated.View
        entering={SlideInLeft.delay(delay).duration(400)}
        style={[styles.card, isNow && styles.cardActive]}
    >
        <ThemedText style={[styles.time, isNow && styles.timeActive]}>{time}</ThemedText>
        <Ionicons name={getIconName(icon) as any} size={22} color={isNow ? '#FFFFFF' : '#94A3B8'} />
        <ThemedText style={[styles.temp, isNow && styles.tempActive]}>{temp}°</ThemedText>
    </Animated.View>
));

interface WeatherHourlyProps { data: { time: string; icon: string; temp: number }[]; }
const WeatherHourly = React.memo(({ data }: WeatherHourlyProps) => {
    if (!data.length) return null;
    return (
        <Animated.View entering={SlideInLeft.delay(450).duration(400)} style={styles.wrapper}>
            <ThemedText style={styles.title}>Hourly Forecast</ThemedText>
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
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    title: { fontSize: 14, fontWeight: '700', color: '#0F172A', letterSpacing: 0.3, marginBottom: 14 },
    scroll: { gap: 10, paddingBottom: 4 },
    card: {
        backgroundColor: '#F8FAFC', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14,
        alignItems: 'center', gap: 6, minWidth: 62,
    },
    cardActive: { backgroundColor: PRIMARY },
    time: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    timeActive: { color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
    temp: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    tempActive: { color: '#FFFFFF' },
});
