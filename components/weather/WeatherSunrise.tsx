import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { PRIMARY } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface WeatherSunriseProps { sunrise: string; sunset: string; }
const WeatherSunrise = React.memo(({ sunrise, sunset }: WeatherSunriseProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.card, { backgroundColor: colors.cream }]}>
            <View style={styles.row}>
                <View style={styles.item}>
                    <Ionicons name="sunny-outline" size={28} color="#F0803C" />
                    <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Sunrise</ThemedText>
                    <ThemedText style={[styles.time, { color: colors.text }]}>{sunrise}</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.item}>
                    <Ionicons name="moon-outline" size={28} color={PRIMARY} />
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
        borderRadius: Layout.cardBorderRadius, padding: 20,
        overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    item: { flex: 1, alignItems: 'center', gap: 6 },
    divider: { width: 1, height: 52, backgroundColor: 'rgba(0,61,54,0.15)' },
    label: { fontSize: 12, fontWeight: '600' },
    time: { fontSize: 18, fontWeight: '800' },
});
