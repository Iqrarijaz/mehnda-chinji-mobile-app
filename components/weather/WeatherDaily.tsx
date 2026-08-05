import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { getIconName } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

const RAIN_BLUE = '#3B82F6';

interface DailyRowProps { day: string; date: string; icon: string; high: number; low: number; pop: number; weekMin: number; weekMax: number; }
const DailyRow = React.memo(({ day, date, icon, high, low, pop, weekMin, weekMax }: DailyRowProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Position the coloured segment within the week's overall range so the bar
    // actually communicates how warm/cool the day is.
    const span = Math.max(1, weekMax - weekMin);
    const leftPct = ((low - weekMin) / span) * 100;
    const widthPct = Math.max(12, ((high - low) / span) * 100);

    return (
        <View style={styles.row}>
            <View style={styles.dayContainer}>
                <ThemedText style={[styles.day, { color: colors.text }]}>{day}</ThemedText>
                <ThemedText style={[styles.date, { color: colors.textSecondary }]}>{date}</ThemedText>
            </View>
            <Ionicons name={getIconName(icon) as any} size={20} color={colors.primary} style={{ marginHorizontal: 8 }} />
            {pop > 0 ? <ThemedText style={[styles.pop, { color: RAIN_BLUE }]}>{pop}%</ThemedText> : <View style={{ width: 40 }} />}
            <View style={styles.temps}>
                <ThemedText style={[styles.low, { color: colors.textSecondary }]}>{low}°</ThemedText>
                <View style={[styles.bar, { backgroundColor: colors.border }]}>
                    {/* Solid secondary colour bar fill instead of gradient */}
                    <View
                        style={[
                            styles.barFill,
                            {
                                left: `${leftPct}%` as any,
                                width: `${widthPct}%` as any,
                                backgroundColor: colors.secondary },
                        ]}
                    />
                </View>
                <ThemedText style={[styles.high, { color: colors.text }]}>{high}°</ThemedText>
            </View>
        </View>
    );
});

interface WeatherDailyProps {
    data: { day: string; date: string; icon: string; high: number; low: number; pop: number }[];
}
const WeatherDaily = React.memo(({ data }: WeatherDailyProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    if (!data.length) return null;
    const weekMin = Math.min(...data.map((d) => d.low));
    const weekMax = Math.max(...data.map((d) => d.high));
    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <ThemedText style={[styles.title, { color: colors.text }]}>7-Day Forecast</ThemedText>
            {data.map((d, i) => (
                <DailyRow key={i} day={d.day} date={d.date} icon={d.icon} high={d.high} low={d.low} pop={d.pop} weekMin={weekMin} weekMax={weekMax} />
            ))}
        </View>
    );
});

export default WeatherDaily;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius, padding: 16, marginBottom: 14 },
    title: { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6 },
    row: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    dayContainer: { width: 70 },
    day: { fontSize: 11.5, fontWeight: '700' },
    date: { fontSize: 10, fontWeight: '600', opacity: 0.8 },
    pop: { fontSize: 10, fontWeight: '700', width: 40, textAlign: 'right' },
    temps: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
    low: { fontSize: 11.5, fontWeight: '600', width: 28, textAlign: 'right' },
    bar: { flex: 1, height: 6, borderRadius: Layout.borderRadius, overflow: 'hidden', justifyContent: 'center' },
    barFill: { position: 'absolute', height: '100%', borderRadius: Layout.borderRadius },
    high: { fontSize: 11.5, fontWeight: '700', width: 28 } });
