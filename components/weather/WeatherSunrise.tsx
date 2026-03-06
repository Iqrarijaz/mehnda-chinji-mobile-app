import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ThemedText } from '../themedText';
import { PRIMARY } from './weatherUtils';

interface WeatherSunriseProps { sunrise: string; sunset: string; }
const WeatherSunrise = React.memo(({ sunrise, sunset }: WeatherSunriseProps) => (
    <Animated.View entering={FadeInUp.delay(650).springify().damping(16)} style={styles.card}>
        <LinearGradient
            colors={[`${PRIMARY}18`, `${PRIMARY}08`]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
        <View style={styles.row}>
            <View style={styles.item}>
                <Ionicons name="sunny-outline" size={28} color={PRIMARY} />
                <ThemedText style={styles.label}>Sunrise</ThemedText>
                <ThemedText style={styles.time}>{sunrise}</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.item}>
                <Ionicons name="moon-outline" size={28} color={PRIMARY} />
                <ThemedText style={styles.label}>Sunset</ThemedText>
                <ThemedText style={styles.time}>{sunset}</ThemedText>
            </View>
        </View>
    </Animated.View>
));

export default WeatherSunrise;

const styles = StyleSheet.create({
    card: {
        borderRadius: 20, padding: 20, marginBottom: 14,
        backgroundColor: '#FFFFFF', overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    item: { flex: 1, alignItems: 'center', gap: 6 },
    divider: { width: 1, height: 60, backgroundColor: '#E2E8F0' },
    label: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    time: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
});
