import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { FUEL_TAB_SHORT_LABELS, getFuelTabMeta } from '@/constants/fuel';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface FuelComparisonEntry {
    key: string;
    price: number;
}

export interface FuelQuickComparisonProps {
    entries: FuelComparisonEntry[];
    activeKey: string;
    onSelect: (key: string) => void;
}

function formatPkr(value: number) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface RowProps {
    entry: FuelComparisonEntry;
    isActive: boolean;
    onSelect: (key: string) => void;
}

const ComparisonRow = React.memo(function ComparisonRow({ entry, isActive, onSelect }: RowProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const meta = getFuelTabMeta(entry.key);

    const handlePress = useCallback(() => onSelect(entry.key), [onSelect, entry.key]);

    return (
        <PressableScale intensity={0.03} onPress={handlePress} containerStyle={styles.rowWrap}>
            <View
                style={[
                    styles.row,
                    { backgroundColor: colors.background },
                    isActive && { backgroundColor: meta.gradient[0] + '14' },
                ]}
            >
                <LinearGradient
                    colors={meta.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tile}
                >
                    <MaterialCommunityIcons name={meta.icon} size={16} color="#FFFFFF" />
                </LinearGradient>

                <View style={styles.textWrap}>
                    <ThemedText style={styles.label} numberOfLines={1}>
                        {FUEL_TAB_SHORT_LABELS[entry.key] ?? meta.label}
                    </ThemedText>
                    <ThemedText style={[styles.unit, { color: colors.textSecondary }]} numberOfLines={1}>
                        {meta.unitLabel}
                    </ThemedText>
                </View>

                <ThemedText style={styles.price}>{formatPkr(entry.price)}</ThemedText>
            </View>
        </PressableScale>
    );
});

ComparisonRow.displayName = 'ComparisonRow';

/**
 * All rates at a glance, at the foot of the screen.
 *
 * Tapping a row switches the tab above rather than opening anything, so
 * comparing two fuels never costs a round trip through a modal.
 */
export const FuelQuickComparison = React.memo(function FuelQuickComparison({
    entries,
    activeKey,
    onSelect,
}: FuelQuickComparisonProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (entries.length < 2) return null;

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <ThemedText style={styles.title}>All PSO Rates</ThemedText>
            <View style={styles.rows}>
                {entries.map((entry) => (
                    <ComparisonRow
                        key={entry.key}
                        entry={entry}
                        isActive={entry.key === activeKey}
                        onSelect={onSelect}
                    />
                ))}
            </View>
        </View>
    );
});

FuelQuickComparison.displayName = 'FuelQuickComparison';

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 14,
        marginBottom: 12,
        borderRadius: Layout.cardBorderRadius,
        padding: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
        paddingHorizontal: 2,
        marginBottom: 10,
    },
    rows: {
        gap: 8,
    },
    rowWrap: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingVertical: 8,
        paddingHorizontal: 10,
        minHeight: 44,
    },
    tile: {
        width: 32,
        height: 32,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textWrap: {
        flex: 1,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
    },
    unit: {
        fontSize: 10.5,
        fontWeight: '500',
        marginTop: 1,
    },
    price: {
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 8,
    },
});
