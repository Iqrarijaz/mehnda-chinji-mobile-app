import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { FuelProductMeta } from '@/constants/fuel';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface FuelHeroCardProps {
    meta: FuelProductMeta;
    price: number;
    /** Percentage move across the loaded trend window; null while unknown. */
    changePct?: number | null;
    /** PSO effective date for this reading, already formatted. */
    effectiveDateLabel?: string | null;
    /** Extra line under the unit, e.g. "Karachi rate · 12 cities". */
    contextLabel?: string | null;
}

const TILE_SIZE = 54;
/** Below this the move is noise, not a trend worth colouring. */
const STABLE_THRESHOLD_PCT = 0.01;

function formatPrice(value: number) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * The screen's headline: what this fuel costs right now.
 *
 * Deliberately the only large number on the page — the comparison grid and the
 * chart are supporting detail, and competing type sizes would flatten the
 * hierarchy the screen depends on.
 */
export const FuelHeroCard = React.memo(function FuelHeroCard({
    meta,
    price,
    changePct,
    effectiveDateLabel,
    contextLabel,
}: FuelHeroCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const trend = useMemo(() => {
        if (changePct === null || changePct === undefined || Number.isNaN(changePct)) return null;
        if (Math.abs(changePct) < STABLE_THRESHOLD_PCT) {
            return { label: 'Stable', color: colors.textSecondary, icon: 'remove' as const };
        }
        const up = changePct > 0;
        return {
            label: `${up ? '+' : ''}${changePct.toFixed(2)}%`,
            color: up ? colors.danger : colors.success,
            icon: up ? ('trending-up' as const) : ('trending-down' as const),
        };
    }, [changePct, colors]);

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.topRow}>
                <LinearGradient
                    colors={meta.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tile}
                >
                    <MaterialCommunityIcons name={meta.icon} size={26} color="#FFFFFF" />
                </LinearGradient>

                <View style={styles.titleWrap}>
                    <ThemedText style={styles.label} numberOfLines={1}>{meta.label}</ThemedText>
                    <View style={styles.officialRow}>
                        <View style={[styles.officialDot, { backgroundColor: colors.lime }]} />
                        <ThemedText style={[styles.officialText, { color: colors.textSecondary }]} numberOfLines={1}>
                            Official PSO pump price
                        </ThemedText>
                    </View>
                </View>

                {trend && (
                    <View style={[styles.trendPill, { backgroundColor: trend.color + '18' }]}>
                        <Ionicons name={trend.icon} size={13} color={trend.color} />
                        <ThemedText style={[styles.trendText, { color: trend.color }]}>{trend.label}</ThemedText>
                    </View>
                )}
            </View>

            <View style={styles.priceRow}>
                <ThemedText style={[styles.currency, { color: colors.textSecondary }]}>PKR</ThemedText>
                <ThemedText style={styles.price}>{formatPrice(price)}</ThemedText>
                <ThemedText style={[styles.unit, { color: colors.textSecondary }]}>{meta.unitLabel}</ThemedText>
            </View>

            {(effectiveDateLabel || contextLabel) && (
                <View style={styles.metaRow}>
                    {!!contextLabel && (
                        <ThemedText style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {contextLabel}
                        </ThemedText>
                    )}
                    {!!effectiveDateLabel && (
                        <View style={[styles.dateBadge, { backgroundColor: colors.background }]}>
                            <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} />
                            <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                                {effectiveDateLabel}
                            </ThemedText>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
});

FuelHeroCard.displayName = 'FuelHeroCard';

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 14,
        marginBottom: 12,
        borderRadius: Layout.cardBorderRadius,
        padding: 14,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleWrap: {
        flex: 1,
        marginLeft: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '800',
    },
    officialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 3,
    },
    officialDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    officialText: {
        fontSize: 11,
        fontWeight: '500',
        flexShrink: 1,
    },
    trendPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        marginLeft: 8,
    },
    trendText: {
        fontSize: 11.5,
        fontWeight: '800',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 14,
        gap: 6,
    },
    currency: {
        fontSize: 13,
        fontWeight: '700',
    },
    price: {
        fontSize: 38,
        fontWeight: '800',
        letterSpacing: -1,
        // The default 24pt line height clips a 38pt numeral.
        lineHeight: 44,
    },
    unit: {
        fontSize: 12,
        fontWeight: '500',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 8,
    },
    metaText: {
        fontSize: 11.5,
        fontWeight: '500',
        flexShrink: 1,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
    },
    dateText: {
        fontSize: 10.5,
        fontWeight: '600',
    },
});
