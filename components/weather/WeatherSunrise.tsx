import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
            {/* Dawn → dusk warm-to-cool wash */}
            <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] : [`${colors.secondary}20`, `${SUNSET_INDIGO}14`]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />
            <View style={styles.row}>
                <View style={styles.item}>
                    <Ionicons name="sunny" size={28} color={colors.secondary} />
                    <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Sunrise</ThemedText>
                    <ThemedText style={[styles.time, { color: colors.text }]}>{sunrise}</ThemedText>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.item}>
                    <Ionicons name="moon" size={26} color={SUNSET_INDIGO} />
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
        borderRadius: Layout.borderRadius, padding: 20,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    item: { flex: 1, alignItems: 'center', gap: 6 },
    divider: { width: 1, height: 60 },
    label: { fontSize: 12, fontWeight: '600' },
    time: { fontSize: 18, fontWeight: '800' },
});
