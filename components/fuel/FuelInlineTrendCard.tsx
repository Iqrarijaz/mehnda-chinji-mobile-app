import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from 'react-native';

import { TrendChart, TrendChartPoint } from '@/components/currency/TrendChart';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { LPG_KEY } from '@/constants/fuel';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface FuelInlineTrendCardProps {
    /** Product being charted. LPG renders nothing — see below. */
    product: string;
    points: TrendChartPoint[];
    isLoading: boolean;
    isError: boolean;
    /** City the series represents, when the product is priced per city. */
    cityLabel?: string | null;
}

const CARD_H_MARGIN = 14;
const CARD_PADDING = 12;

function formatPkr(value: number) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface StatProps {
    label: string;
    value: string;
    color?: string;
}

const TrendStat = React.memo(function TrendStat({ label, value, color }: StatProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={styles.stat}>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</ThemedText>
            <ThemedText style={[styles.statValue, color ? { color } : null]}>{value}</ThemedText>
        </View>
    );
});

TrendStat.displayName = 'TrendStat';

/**
 * The 30-day line, inline on the screen rather than behind a tap.
 *
 * Renders nothing for LPG: it is regulated by OGRA and revised monthly, so a
 * daily series is a flat line that implies precision the data does not have.
 * The screen shows a cylinder estimate in this slot instead.
 */
export const FuelInlineTrendCard = React.memo(function FuelInlineTrendCard({
    product,
    points,
    isLoading,
    isError,
    cityLabel,
}: FuelInlineTrendCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { width: windowWidth } = useWindowDimensions();

    // +16 offsets the axis gutter chart-kit reserves, so the line sits flush
    // with the card's left edge — same adjustment RateTrendsSheet makes.
    const chartWidth = windowWidth - CARD_H_MARGIN * 2 - CARD_PADDING * 2 + 16;

    const stats = useMemo(() => {
        if (points.length < 2) return null;
        const values = points.map((p) => p.value);
        const sum = values.reduce((total, v) => total + v, 0);
        return {
            low: Math.min(...values),
            high: Math.max(...values),
            average: sum / values.length,
        };
    }, [points]);

    if (product === LPG_KEY) return null;

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>30-Day Trend</ThemedText>
                {!!cityLabel && (
                    <View style={[styles.cityBadge, { backgroundColor: colors.background }]}>
                        <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                        <ThemedText style={[styles.cityText, { color: colors.textSecondary }]}>{cityLabel}</ThemedText>
                    </View>
                )}
            </View>

            {isLoading ? (
                <View style={styles.stateWrap}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : isError ? (
                <View style={styles.stateWrap}>
                    <Ionicons name="cloud-offline-outline" size={22} color={colors.textSecondary} />
                    <ThemedText style={[styles.stateText, { color: colors.textSecondary }]}>
                        Couldn&apos;t load the trend. Pull down to retry.
                    </ThemedText>
                </View>
            ) : (
                <>
                    <TrendChart points={points} width={chartWidth} />

                    {stats && (
                        <View style={[styles.statsBar, { borderTopColor: colors.divider }]}>
                            <TrendStat label="30-day low" value={formatPkr(stats.low)} color={colors.success} />
                            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                            <TrendStat label="30-day high" value={formatPkr(stats.high)} color={colors.danger} />
                            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                            <TrendStat label="Average" value={formatPkr(stats.average)} />
                        </View>
                    )}
                </>
            )}
        </View>
    );
});

FuelInlineTrendCard.displayName = 'FuelInlineTrendCard';

const styles = StyleSheet.create({
    card: {
        marginHorizontal: CARD_H_MARGIN,
        marginBottom: 12,
        borderRadius: Layout.cardBorderRadius,
        padding: CARD_PADDING,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
    },
    cityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
    },
    cityText: {
        fontSize: 10.5,
        fontWeight: '600',
    },
    stateWrap: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    stateText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 17,
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        marginTop: 10,
        paddingTop: 10,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '800',
    },
    statDivider: {
        width: StyleSheet.hairlineWidth,
        height: 24,
    },
});
