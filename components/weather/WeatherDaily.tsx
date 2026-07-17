import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { getIconName } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface DailyRowProps { day: string; date: string; icon: string; high: number; low: number; pop: number; }
const DailyRow = React.memo(({ day, date, icon, high, low, pop }: DailyRowProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.dayContainer}>
                <ThemedText style={[styles.day, { color: colors.text }]}>{day}</ThemedText>
                <ThemedText style={[styles.date, { color: colors.textSecondary }]}>{date}</ThemedText>
            </View>
            <Ionicons name={getIconName(icon) as any} size={20} color={colors.textSecondary} style={{ marginHorizontal: 8 }} />
            {pop > 0 && <ThemedText style={styles.pop}>{pop}%</ThemedText>}
            <View style={styles.temps}>
                <ThemedText style={[styles.low, { color: colors.textSecondary }]}>{low}°</ThemedText>
                <View style={[styles.bar, { backgroundColor: colors.border }]}>
                    <View style={styles.barFill} />
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
    const { theme } = useTheme();
    const colors = Colors[theme];
    if (!data.length) return null;
    return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.title, { color: colors.text }]}>7-Day Forecast</ThemedText>
            {data.map((d, i) => (
                <DailyRow key={i} day={d.day} date={d.date} icon={d.icon} high={d.high} low={d.low} pop={d.pop} />
            ))}
        </View>
    );
});

export default WeatherDaily;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.cardBorderRadius, padding: 18, marginBottom: 14,
    },
    title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 6 },
    row: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dayContainer: { width: 70 },
    day: { fontSize: 13, fontWeight: '700' },
    date: { fontSize: 11, fontWeight: '600', opacity: 0.8 },
    pop: { fontSize: 11, color: '#4B8B27', fontWeight: '700', width: 40, textAlign: 'right' },
    temps: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
    low: { fontSize: 13, fontWeight: '600', width: 28, textAlign: 'right' },
    bar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 2, backgroundColor: '#7BC043', width: '100%' },
    high: { fontSize: 13, fontWeight: '700', width: 28 },
});
