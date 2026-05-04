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
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface DailyRowProps { day: string; date: string; icon: string; high: number; low: number; pop: number; delay: number; }
const DailyRow = React.memo(({ day, date, icon, high, low, pop, delay }: DailyRowProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const barAnim = useSharedValue(0);
    useEffect(() => {
        barAnim.value = withTiming(1, { duration: 800 + delay });
    }, []);
    const barStyle = useAnimatedStyle(() => ({ width: `${barAnim.value * 100}%` }));

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(400)} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.dayContainer}>
                <ThemedText style={[styles.day, { color: colors.text }]}>{day}</ThemedText>
                <ThemedText style={[styles.date, { color: colors.textSecondary }]}>{date}</ThemedText>
            </View>
            <Ionicons name={getIconName(icon) as any} size={20} color={colors.textSecondary} style={{ marginHorizontal: 8 }} />
            {pop > 0 && <ThemedText style={styles.pop}>{pop}%</ThemedText>}
            <View style={styles.temps}>
                <ThemedText style={[styles.low, { color: colors.textSecondary }]}>{low}°</ThemedText>
                <View style={[styles.bar, { backgroundColor: colors.border }]}>
                    <Animated.View style={[styles.barFill, barStyle]} />
                </View>
                <ThemedText style={[styles.high, { color: colors.text }]}>{high}°</ThemedText>
            </View>
        </Animated.View>
    );
});

interface WeatherDailyProps {
    data: { day: string; date: string; icon: string; high: number; low: number; pop: number }[];
}
const WeatherDaily = React.memo(({ data }: WeatherDailyProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    if (!data.length) return null;
    return (
        <Animated.View entering={FadeInUp.delay(550).springify().damping(16)} style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
            <ThemedText style={[styles.title, { color: colors.text }]}>7-Day Forecast</ThemedText>
            {data.map((d, i) => (
                <DailyRow key={i} day={d.day} date={d.date} icon={d.icon} high={d.high} low={d.low} pop={d.pop} delay={i * 60} />
            ))}
        </Animated.View>
    );
});

export default WeatherDaily;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius, padding: 18, marginBottom: 14,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    title: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6 },
    row: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dayContainer: { width: 70 },
    day: { fontSize: 13, fontWeight: '700' },
    date: { fontSize: 11, fontWeight: '600', opacity: 0.8 },
    pop: { fontSize: 11, color: PRIMARY, fontWeight: '700', width: 40, textAlign: 'right' },
    temps: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
    low: { fontSize: 13, fontWeight: '600', width: 28, textAlign: 'right' },
    bar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 2, backgroundColor: PRIMARY },
    high: { fontSize: 13, fontWeight: '700', width: 28 },
});
