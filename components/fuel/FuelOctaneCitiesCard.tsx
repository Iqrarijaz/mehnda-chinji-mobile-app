import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { OCTANE_FEATURED_CITIES } from '@/constants/fuel';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface OctaneCityRate {
    city: string;
    price_pkr: number;
}

export interface FuelOctaneCitiesCardProps {
    cities: OctaneCityRate[];
    onViewAll: () => void;
}

function formatPkr(value: number) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface CityTileProps {
    city: string;
    price: number;
}

const CityTile = React.memo(function CityTile({ city, price }: CityTileProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={[styles.tile, { backgroundColor: colors.background }]}>
            <ThemedText style={[styles.tileCity, { color: colors.textSecondary }]} numberOfLines={1}>
                {city}
            </ThemedText>
            <ThemedText style={styles.tilePrice} numberOfLines={1}>{formatPkr(price)}</ThemedText>
        </View>
    );
});

CityTile.displayName = 'CityTile';

/**
 * City rates for Octane Plus — PSO's only per-city product.
 *
 * Shows the major markets inline and defers the long tail to the existing
 * breakdown sheet: a dozen-plus cities inline would push the comparison grid
 * off the screen, and most people only want to know their own.
 */
export const FuelOctaneCitiesCard = React.memo(function FuelOctaneCitiesCard({
    cities,
    onViewAll,
}: FuelOctaneCitiesCardProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Featured cities first, in the order they are listed; anything else is
    // reachable through the sheet.
    const featured = useMemo(() => {
        const byName = new Map(cities.map((c) => [c.city.toLowerCase(), c]));
        return OCTANE_FEATURED_CITIES
            .map((name) => byName.get(name.toLowerCase()))
            .filter((c): c is OctaneCityRate => !!c);
    }, [cities]);

    if (!cities.length) return null;

    // Nothing recognised means PSO published a set we do not feature; fall back
    // to the first few alphabetically rather than rendering an empty card.
    const shown = featured.length > 0 ? featured : cities.slice(0, 6);

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>City Rates</ThemedText>
                <ThemedText style={[styles.count, { color: colors.textSecondary }]}>
                    {cities.length} cities
                </ThemedText>
            </View>

            <View style={styles.grid}>
                {shown.map((entry) => (
                    <CityTile key={entry.city} city={entry.city} price={entry.price_pkr} />
                ))}
            </View>

            <PressableScale intensity={0.03} onPress={onViewAll} containerStyle={styles.viewAllWrap}>
                <View style={[styles.viewAll, { backgroundColor: colors.background }]}>
                    <ThemedText style={[styles.viewAllText, { color: colors.primary }]}>View all cities</ThemedText>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
            </PressableScale>
        </View>
    );
});

FuelOctaneCitiesCard.displayName = 'FuelOctaneCitiesCard';

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
    count: {
        fontSize: 11,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tile: {
        // Three per row, accounting for the 8pt gaps between them.
        width: '31.5%',
        borderRadius: Layout.borderRadius,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    tileCity: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 2,
    },
    tilePrice: {
        fontSize: 13,
        fontWeight: '800',
    },
    viewAllWrap: {
        marginTop: 10,
    },
    viewAll: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: 44,
        borderRadius: Layout.borderRadius,
    },
    viewAllText: {
        fontSize: 12.5,
        fontWeight: '700',
    },
});
