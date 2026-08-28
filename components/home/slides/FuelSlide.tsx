import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Sparkline } from '@/components/home/Sparkline';
import { ThemedText } from '@/components/ThemedText';
import { FuelSummaryItem } from '@/apis/fuel';
import { ThemeColors } from '@/constants/colors';

/**
 * How wide the trend line may be.
 *
 * Measured, not chosen: on the fuel plate the right edge carries the ember glow
 * and gauge sweep, and contrast against white falls below AA past ~90% of the
 * card. The line stops at 88% so it stays on the calm field.
 */
const SPARK_W = 104;
const SPARK_H = 30;

const PRODUCT_LABELS: Record<string, string> = {
    petrol: 'Petrol',
    octane_plus: 'High Octane',
    diesel: 'Diesel',
    lpg: 'LPG',
};

function labelFor(product: string) {
    return PRODUCT_LABELS[product] ?? product.replace(/_/g, ' ');
}

/** "litre" -> "/L", "kg" -> "/kg". */
function unitSuffix(unit: string | null) {
    if (!unit) return '';
    const u = unit.toLowerCase();
    if (u.startsWith('lit')) return '/L';
    return `/${unit}`;
}

interface RowProps {
    item: FuelSummaryItem;
    colors: ThemeColors;
}

const FuelRow = React.memo(function FuelRow({ item, colors }: RowProps) {
    // A price rise is bad news for the reader, so it takes the warning colour
    // and a fall takes the positive one -- the opposite of a stock ticker.
    const up = item.direction === 'up';
    const flat = item.direction === 'flat' || item.change === null;
    const deltaColor = flat ? colors.textSecondary : up ? colors.danger : colors.lime;

    return (
        <View style={styles.row}>
            <View style={styles.rowLeft}>
                <ThemedText style={styles.product} numberOfLines={1}>{labelFor(item.product)}</ThemedText>

                {item.available && item.price_pkr !== null ? (
                    <View style={styles.priceLine}>
                        <ThemedText style={styles.price}>
                            Rs {item.price_pkr.toFixed(2)}
                        </ThemedText>
                        <ThemedText style={styles.unit}>{unitSuffix(item.unit)}</ThemedText>
                    </View>
                ) : (
                    <ThemedText style={styles.unavailable}>Not available</ThemedText>
                )}

                {item.available && !flat ? (
                    <View style={[styles.delta, { backgroundColor: `${deltaColor}26` }]}>
                        <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={9} color={deltaColor} />
                        <ThemedText style={[styles.deltaText, { color: deltaColor }]}>
                            {Math.abs(item.change as number).toFixed(2)}
                            {item.changePercent !== null ? ` (${Math.abs(item.changePercent).toFixed(2)}%)` : ''}
                        </ThemedText>
                    </View>
                ) : item.available ? (
                    <View style={[styles.delta, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
                        <ThemedText style={[styles.deltaText, { color: 'rgba(255,255,255,0.7)' }]}>No change</ThemedText>
                    </View>
                ) : null}
            </View>

            {/* Two points are the minimum that can describe a direction. */}
            {item.series.length > 1 ? (
                <Sparkline
                    values={item.series.map(p => p.price_pkr)}
                    width={SPARK_W}
                    height={SPARK_H}
                    color={flat ? colors.accent : up ? colors.danger : colors.lime}
                />
            ) : (
                <View style={{ width: SPARK_W, height: SPARK_H }} />
            )}
        </View>
    );
});

interface FuelSlideProps {
    items: FuelSummaryItem[];
    days: number;
    colors: ThemeColors;
}

function FuelSlideComponent({ items, days, colors }: FuelSlideProps) {
    return (
        <View style={styles.slide}>
            <View style={styles.headerRow}>
                <View style={[styles.pill, { backgroundColor: colors.accent }]}>
                    <ThemedText style={styles.pillText}>FUEL PRICES</ThemedText>
                </View>
                <ThemedText style={styles.tagline} numberOfLines={1}>
                    Know before you fill up
                </ThemedText>
            </View>

            <View style={styles.rows}>
                {items.map(item => (
                    <FuelRow key={item.product} item={item} colors={colors} />
                ))}
            </View>

            <ThemedText style={styles.footnote} numberOfLines={1}>
                Last {days} days · PSO
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    slide: { flex: 1 },

    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 7 },
    pillText: { fontSize: 8, fontWeight: '900', color: '#222831', letterSpacing: 0.6 },
    tagline: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.78)', flexShrink: 1 },

    rows: { marginTop: 6, gap: 6 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLeft: { flexShrink: 1 },
    product: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.68)', letterSpacing: 0.4 },
    priceLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 1 },
    price: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
    unit: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.62)', marginLeft: 2 },
    unavailable: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)', marginTop: 3 },
    delta: {
        flexDirection: 'row', alignItems: 'center', gap: 2,
        alignSelf: 'flex-start', marginTop: 3,
        paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5,
    },
    deltaText: { fontSize: 8.5, fontWeight: '800' },

    footnote: { fontSize: 8.5, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginTop: 'auto' },
});

export const FuelSlide = React.memo(FuelSlideComponent);
FuelSlide.displayName = 'FuelSlide';
