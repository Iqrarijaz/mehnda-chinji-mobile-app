import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { isFuelReading } from '@/apis/fuel';
import { FuelCard } from '@/components/fuel/FuelCard';
import { FuelCitiesSheet } from '@/components/fuel/FuelCitiesSheet';
import { FuelHeader } from '@/components/fuel/FuelHeader';
import { FuelListSkeleton } from '@/components/fuel/FuelListSkeleton';
import { FuelTrendsModal } from '@/components/fuel/FuelTrendsModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { FUEL_PRODUCTS_ORDER, OCTANE_PLUS_KEY, OCTANE_PLUS_META, getFuelProductMeta } from '@/constants/fuel';
import { useTheme } from '@/context/ThemeContext';
import { useFuelPrices } from '@/hooks/useFuel';

export default function FuelScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const { fuelData, isFuelLoading, isFuelFetching, fuelError, refetchFuel } = useFuelPrices();
    const [selectedTrendProduct, setSelectedTrendProduct] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const trendsSheetRef = useRef<BottomSheetModal>(null);
    const citiesSheetRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
        analyticsService.trackEvent(AnalyticsEvents.FUEL_VIEWED);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await refetchFuel();
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchFuel]);

    const handleProductPress = useCallback((product: string) => {
        analyticsService.trackEvent(AnalyticsEvents.FUEL_ROW_CLICKED, { product });
        analyticsService.trackEvent(AnalyticsEvents.FUEL_TRENDS_VIEWED, { product });
        setSelectedTrendProduct(product);
        trendsSheetRef.current?.present();
    }, []);

    const handleOctanePress = useCallback(() => {
        analyticsService.trackEvent(AnalyticsEvents.FUEL_ROW_CLICKED, { product: OCTANE_PLUS_KEY });
        citiesSheetRef.current?.present();
    }, []);

    const lastUpdatedLabel = useMemo(() => {
        if (!fuelData?.date) return null;
        const d = new Date(fuelData.date);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, [fuelData?.date]);

    // National products (petrol, hsd, lpg, ...) — a single reading each.
    const nationalProducts = useMemo(() => {
        const prices = fuelData?.prices ?? {};
        return FUEL_PRODUCTS_ORDER
            .map((key) => {
                const entry = prices[key];
                if (!entry || !isFuelReading(entry)) return null;
                return { key, meta: getFuelProductMeta(key), price: entry.price_pkr };
            })
            .filter((p): p is NonNullable<typeof p> => !!p);
    }, [fuelData]);

    // Octane Plus — PSO's only per-city product. Represented on the card by
    // its most common price nationwide; outliers are visible in the breakdown sheet.
    const octaneCities = useMemo(() => {
        const entry = fuelData?.prices?.[OCTANE_PLUS_KEY];
        if (!entry || isFuelReading(entry)) return [];
        return Object.entries(entry)
            .map(([city, reading]) => ({ city, price_pkr: reading.price_pkr }))
            .sort((a, b) => a.city.localeCompare(b.city));
    }, [fuelData]);

    const octaneRepresentativePrice = useMemo(() => {
        if (!octaneCities.length) return null;
        const counts = new Map<number, number>();
        for (const { price_pkr } of octaneCities) {
            counts.set(price_pkr, (counts.get(price_pkr) ?? 0) + 1);
        }
        let mode = octaneCities[0].price_pkr;
        let modeCount = 0;
        for (const [price, count] of counts) {
            if (count > modeCount) {
                mode = price;
                modeCount = count;
            }
        }
        return mode;
    }, [octaneCities]);

    const hasResults = nationalProducts.length > 0 || octaneCities.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <FuelHeader lastUpdatedLabel={lastUpdatedLabel} />

            {isFuelLoading ? (
                <View style={styles.listWrap}>
                    <FuelListSkeleton />
                </View>
            ) : fuelError ? (
                <View style={styles.centerWrap}>
                    <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
                    <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                        Couldn&apos;t load fuel prices. Pull down to try again.
                    </ThemedText>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingTop: 14, paddingBottom: insets.bottom + 24 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing || (isFuelFetching && !isFuelLoading)}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {!hasResults ? (
                        <View style={styles.centerWrap}>
                            <Ionicons name="cloud-offline-outline" size={36} color={colors.textSecondary} />
                            <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                                No PSO fuel prices available yet — check back soon.
                            </ThemedText>
                        </View>
                    ) : (
                        <>
                            {nationalProducts.map((p) => (
                                <FuelCard
                                    key={p.key}
                                    meta={p.meta}
                                    price={p.price}
                                    onPress={() => handleProductPress(p.key)}
                                />
                            ))}

                            {octaneCities.length > 0 && octaneRepresentativePrice !== null && (
                                <FuelCard
                                    meta={OCTANE_PLUS_META}
                                    price={octaneRepresentativePrice}
                                    subtitle={`${octaneCities.length} cities · tap for breakdown`}
                                    trailingIcon="chevron-right"
                                    onPress={handleOctanePress}
                                />
                            )}
                        </>
                    )}
                </ScrollView>
            )}

            <FuelTrendsModal
                ref={trendsSheetRef}
                product={selectedTrendProduct}
                onDismiss={() => setSelectedTrendProduct(null)}
            />
            <FuelCitiesSheet
                ref={citiesSheetRef}
                cities={octaneCities}
                representativePrice={octaneRepresentativePrice}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listWrap: {
        flex: 1,
        paddingTop: 14,
    },
    centerWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    errorText: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 18,
    },
});
