import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    SlideInLeft,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '../themedText';
import { getIconName, PRIMARY } from './weatherUtils';

interface DailyRowProps { day: string; icon: string; high: number; low: number; pop: number; delay: number; }
const DailyRow = React.memo(({ day, icon, high, low, pop, delay }: DailyRowProps) => {
    const barAnim = useSharedValue(0);
    useEffect(() => {
        barAnim.value = withTiming(1, { duration: 800 + delay });
    }, []);
    const barStyle = useAnimatedStyle(() => ({ width: `${barAnim.value * 100}%` }));

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(400)} style={styles.row}>
            <ThemedText style={styles.day}>{day}</ThemedText>
            <Ionicons name={getIconName(icon) as any} size={20} color="#94A3B8" style={{ marginHorizontal: 8 }} />
            {pop > 0 && <ThemedText style={styles.pop}>{pop}%</ThemedText>}
            <View style={styles.temps}>
                <ThemedText style={styles.low}>{low}°</ThemedText>
                <View style={styles.bar}>
                    <Animated.View style={[styles.barFill, barStyle]} />
                </View>
                <ThemedText style={styles.high}>{high}°</ThemedText>
            </View>
        </Animated.View>
    );
});

interface WeatherDailyProps {
    data: { day: string; icon: string; high: number; low: number; pop: number }[];
}
const WeatherDaily = React.memo(({ data }: WeatherDailyProps) => {
    if (!data.length) return null;
    return (
        <Animated.View entering={FadeInUp.delay(550).springify().damping(16)} style={styles.card}>
            <ThemedText style={styles.title}>7-Day Forecast</ThemedText>
            {data.map((d, i) => (
                <DailyRow key={i} day={d.day} icon={d.icon} high={d.high} low={d.low} pop={d.pop} delay={i * 60} />
            ))}
        </Animated.View>
    );
});

export default WeatherDaily;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    title: { fontSize: 14, fontWeight: '700', color: '#0F172A', letterSpacing: 0.3, marginBottom: 6 },
    row: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F1F5F9',
    },
    day: { fontSize: 14, fontWeight: '700', color: '#0F172A', width: 44 },
    pop: { fontSize: 11, color: PRIMARY, fontWeight: '700', width: 30, textAlign: 'right' },
    temps: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
    low: { fontSize: 13, color: '#94A3B8', fontWeight: '600', width: 28, textAlign: 'right' },
    bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 2, backgroundColor: PRIMARY },
    high: { fontSize: 13, color: '#0F172A', fontWeight: '700', width: 28 },
});
