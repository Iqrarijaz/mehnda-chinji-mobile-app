import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

const SUNSET_INDIGO = '#6366F1';

interface WeatherSunriseProps { sunrise: string; sunset: string; }
const WeatherSunrise = React.memo(({ sunrise, sunset }: WeatherSunriseProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[
            styles.card,
            { backgroundColor: colors.cardBg }
        ]}>
            <View style={styles.row}>
                <View style={styles.item}>
                    <View style={[styles.iconWrap, { backgroundColor: `${colors.secondary}18` }]}>
                        <Ionicons name="sunny" size={24} color={colors.secondary} />
                    </View>
                    <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Sunrise</ThemedText>
                    <ThemedText style={[styles.time, { color: colors.text }]}>{sunrise}</ThemedText>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.item}>
                    <View style={[styles.iconWrap, { backgroundColor: `${SUNSET_INDIGO}18` }]}>
                        <Ionicons name="moon" size={22} color={SUNSET_INDIGO} />
                    </View>
                    <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Sunset</ThemedText>
                    <ThemedText style={[styles.time, { color: colors.text }]}>{sunset}</ThemedText>
                </View>
            </View>
        </View>
    );
});

export default WeatherSunrise;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius, padding: 18,
        overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center' },
    item: { flex: 1, alignItems: 'center', gap: 6 },
    iconWrap: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center' },
    divider: { width: 1, height: 76 },
    label: { fontSize: 10.5, fontWeight: '600' },
    time: { fontSize: 15.5, fontWeight: '800' } });
