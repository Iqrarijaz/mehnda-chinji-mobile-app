import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { LPG_CYLINDERS } from '@/constants/fuel';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface FuelLpgOverviewCardProps {
    /** Per-kilogram LPG rate the estimates are derived from. */
    pricePerKg: number;
}

function formatPkr(value: number, decimals = 2) {
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

interface CylinderRowProps {
    label: string;
    kg: number;
    pricePerKg: number;
}

const CylinderRow = React.memo(function CylinderRow({ label, kg, pricePerKg }: CylinderRowProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const total = kg * pricePerKg;

    return (
        <View style={[styles.row, { backgroundColor: colors.background }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.cardBg }]}>
                <MaterialCommunityIcons name="propane-tank-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel} numberOfLines={1}>{label}</ThemedText>
                <ThemedText style={[styles.rowFormula, { color: colors.textSecondary }]} numberOfLines={1}>
                    {kg} kg × {formatPkr(pricePerKg)}
                </ThemedText>
            </View>
            <View style={styles.rowPriceWrap}>
                <ThemedText style={styles.rowPrice}>{formatPkr(total, 0)}</ThemedText>
                <ThemedText style={[styles.rowPriceUnit, { color: colors.textSecondary }]}>PKR</ThemedText>
            </View>
        </View>
    );
});

CylinderRow.displayName = 'CylinderRow';

/**
 * Cylinder estimates, shown where the other fuels show their trend chart.
 *
 * LPG is the one product bought by the cylinder rather than the litre, and the
 * published rate is per kilogram — so the number people actually need is a
 * multiplication they would otherwise do in their head at the shop.
 *
 * These are estimates from the per-kg rate: they exclude cylinder deposits and
 * local delivery, which is said plainly on the card rather than left to
 * surprise someone at the counter.
 */
export const FuelLpgOverviewCard = React.memo(function FuelLpgOverviewCard({
    pricePerKg,
}: FuelLpgOverviewCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const cylinders = useMemo(() => LPG_CYLINDERS, []);

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>Cylinder Estimate</ThemedText>
                <View style={[styles.regBadge, { backgroundColor: colors.background }]}>
                    <Ionicons name="shield-checkmark-outline" size={11} color={colors.textSecondary} />
                    <ThemedText style={[styles.regText, { color: colors.textSecondary }]}>OGRA regulated</ThemedText>
                </View>
            </View>

            <View style={styles.rows}>
                {cylinders.map((cylinder) => (
                    <CylinderRow
                        key={cylinder.id}
                        label={cylinder.label}
                        kg={cylinder.kg}
                        pricePerKg={pricePerKg}
                    />
                ))}
            </View>

            <View style={[styles.noteRow, { borderTopColor: colors.divider }]}>
                <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
                <ThemedText style={[styles.noteText, { color: colors.textSecondary }]}>
                    Estimated from the per-kg rate. Cylinder deposit and delivery are not included, and retail prices vary by area.
                </ThemedText>
            </View>
        </View>
    );
});

FuelLpgOverviewCard.displayName = 'FuelLpgOverviewCard';

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 14,
        marginBottom: 12,
        borderRadius: Layout.cardBorderRadius,
        padding: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        marginBottom: 10,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
    },
    regBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
    },
    regText: {
        fontSize: 10.5,
        fontWeight: '600',
    },
    rows: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        padding: 10,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rowText: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    rowFormula: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    rowPriceWrap: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    rowPrice: {
        fontSize: 16,
        fontWeight: '800',
    },
    rowPriceUnit: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 1,
    },
    noteRow: {
        flexDirection: 'row',
        gap: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        marginTop: 12,
        paddingTop: 10,
    },
    noteText: {
        flex: 1,
        fontSize: 10.5,
        fontWeight: '500',
        lineHeight: 15,
    },
});
