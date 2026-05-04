import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ThemedText } from '../themedText';
import { PRIMARY } from './weatherUtils';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface WeatherSunriseProps { sunrise: string; sunset: string; }
const WeatherSunrise = React.memo(({ sunrise, sunset }: WeatherSunriseProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
    <Animated.View entering={FadeInUp.delay(650).springify().damping(16)} style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
        <LinearGradient
            colors={isDark ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] : [`${PRIMARY}18`, `${PRIMARY}08`]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
        <View style={styles.row}>
            <View style={styles.item}>
                <Ionicons name="sunny-outline" size={28} color={isDark ? colors.primary : PRIMARY} />
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Sunrise</ThemedText>
                <ThemedText style={[styles.time, { color: colors.text }]}>{sunrise}</ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.item}>
                <Ionicons name="moon-outline" size={28} color={isDark ? colors.primary : PRIMARY} />
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Sunset</ThemedText>
                <ThemedText style={[styles.time, { color: colors.text }]}>{sunset}</ThemedText>
            </View>
        </View>
    </Animated.View>
    );
});

export default WeatherSunrise;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius, padding: 20, marginBottom: 14,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    item: { flex: 1, alignItems: 'center', gap: 6 },
    divider: { width: 1, height: 60 },
    label: { fontSize: 12, fontWeight: '600' },
    time: { fontSize: 18, fontWeight: '800' },
});
