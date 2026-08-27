import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemeColors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

interface StatProps {
    colors: ThemeColors;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    hint?: string;
}

function Stat({ colors, icon, label, value, hint }: StatProps) {
    return (
        <View style={styles.item}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
                <Ionicons name={icon} size={15} color={colors.primary} />
            </View>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{label}</ThemedText>
            <ThemedText style={[styles.value, { color: colors.text }]} numberOfLines={1}>{value}</ThemedText>
            {hint ? (
                <ThemedText style={[styles.hint, { color: colors.textSecondary }]} numberOfLines={1}>{hint}</ThemedText>
            ) : null}
        </View>
    );
}

interface QiblaStatsProps {
    colors: ThemeColors;
    bearing: string;
    bearingHint?: string;
    distance: string;
}

/** Bearing and distance, side by side beneath the dial. */
function QiblaStatsComponent({ colors, bearing, bearingHint, distance }: QiblaStatsProps) {
    return (
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Stat colors={colors} icon="navigate-outline" label="QIBLA BEARING" value={bearing} hint={bearingHint} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Stat colors={colors} icon="footsteps-outline" label="DISTANCE TO MECCA" value={distance} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        width: '100%',
        borderRadius: Layout.cardBorderRadius,
        borderWidth: StyleSheet.hairlineWidth,
        paddingVertical: 16,
    },
    item: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
    iconWrap: {
        width: 30, height: 30, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
    value: { fontSize: 17, fontWeight: '900', marginTop: 4 },
    hint: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },
    divider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
});

export const QiblaStats = React.memo(QiblaStatsComponent);
QiblaStats.displayName = 'QiblaStats';
