import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

// OpenWeather AQI is a 1–5 scale.
const aqiInfo = (aqi?: number | null, lime = '#7BC043', secondary = '#FF9B51') => {
    switch (aqi) {
        case 1: return { label: 'Good', color: lime };
        case 2: return { label: 'Fair', color: '#A3C644' };
        case 3: return { label: 'Moderate', color: secondary };
        case 4: return { label: 'Poor', color: '#EF4444' };
        case 5: return { label: 'Very Poor', color: '#9333EA' };
        default: return { label: '—', color: '#94A3B8' };
    }
};

const uvInfo = (uv?: number | null, lime = '#7BC043', secondary = '#FF9B51') => {
    if (uv == null) return { label: '—', color: '#94A3B8', value: '—' };
    const v = Math.round(uv);
    if (uv < 3) return { label: 'Low', color: lime, value: String(v) };
    if (uv < 6) return { label: 'Moderate', color: secondary, value: String(v) };
    if (uv < 8) return { label: 'High', color: '#F97316', value: String(v) };
    if (uv < 11) return { label: 'Very High', color: '#EF4444', value: String(v) };
    return { label: 'Extreme', color: '#9333EA', value: String(v) };
};

interface TileProps { icon: any; accent: string; value: string; label: string; sub?: string; }
const Tile = React.memo(({ icon, accent, value, label, sub }: TileProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={styles.tile}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? `${accent}26` : `${accent}18` }]}>
                <Ionicons name={icon} size={18} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{label}</ThemedText>
                <View style={styles.valueRow}>
                    <ThemedText style={[styles.value, { color: colors.text }]}>{value}</ThemedText>
                    {sub ? <ThemedText style={[styles.sub, { color: accent }]}>{sub}</ThemedText> : null}
                </View>
            </View>
        </View>
    );
});

interface WeatherDetailsProps {
    visibilityKm?: number | null;
    uv?: number | null;
    aqi?: number | null;
    updatedLabel?: string;
}

const WeatherDetails = React.memo(({ visibilityKm, uv, aqi, updatedLabel }: WeatherDetailsProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const uvi = uvInfo(uv, colors.lime, colors.secondary);
    const aq = aqiInfo(aqi, colors.lime, colors.secondary);

    return (
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? 'transparent' : '#000' }]}>
            <ThemedText style={[styles.title, { color: colors.text }]}>Details</ThemedText>
            <View style={styles.grid}>
                <Tile
                    icon="eye-outline"
                    accent={colors.primary}
                    value={visibilityKm != null ? `${visibilityKm}` : '—'}
                    sub={visibilityKm != null ? 'km' : undefined}
                    label="Visibility"
                />
                <Tile icon="sunny-outline" accent={uvi.color} value={uvi.value} sub={uvi.label} label="UV Index" />
                <Tile icon="leaf-outline" accent={aq.color} value={aq.label} label="Air Quality" />
                <Tile
                    icon="time-outline"
                    accent={colors.secondary}
                    value={updatedLabel || '—'}
                    label="Last Updated"
                />
            </View>
        </View>
    );
});

export default WeatherDetails;

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius, padding: 18, marginBottom: 14,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    },
    title: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3, marginBottom: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    tile: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        paddingRight: 8,
    },
    iconWrap: {
        width: 38, height: 38, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    label: { fontSize: 11, fontWeight: '600' },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 1 },
    value: { fontSize: 15, fontWeight: '800' },
    sub: { fontSize: 11, fontWeight: '700' },
});
