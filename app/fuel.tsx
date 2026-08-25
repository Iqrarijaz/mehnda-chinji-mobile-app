import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { isFuelReading } from '@/apis/fuel';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { FuelCitiesSheet } from '@/components/fuel/FuelCitiesSheet';
import { FuelHeader } from '@/components/fuel/FuelHeader';
import { FuelHeroCard } from '@/components/fuel/FuelHeroCard';
import { FuelInlineTrendCard } from '@/components/fuel/FuelInlineTrendCard';
import { FuelListSkeleton } from '@/components/fuel/FuelListSkeleton';
import { FuelLpgOverviewCard } from '@/components/fuel/FuelLpgOverviewCard';
import { FuelOctaneCitiesCard } from '@/components/fuel/FuelOctaneCitiesCard';
import { FuelQuickComparison } from '@/components/fuel/FuelQuickComparison';
import { FuelSegmentTabs } from '@/components/fuel/FuelSegmentTabs';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { FUEL_TAB_KEYS, LPG_KEY, OCTANE_PLUS_KEY, getFuelTabMeta } from '@/constants/fuel';
import { useTheme } from '@/context/ThemeContext';
import { useFuelPrices, useFuelPriceTrends } from '@/hooks/useFuel';

export default function FuelScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const { fuelData, isFuelLoading, isFuelFetching, fuelError, refetchFuel } = useFuelPrices();
    const [activeKey, setActiveKey] = useState<string>('petrol');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const citiesSheetRef = useRef<BottomSheetModal>(null);

    // LPG has no chart, so there is nothing to fetch for it.
    const { trendsData, isTrendsLoading, trendsError } = useFuelPriceTrends(
        activeKey === LPG_KEY ? null : activeKey
    );

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

    const handleSelect = useCallback((key: string) => {
        setActiveKey(key);
        analyticsService.trackEvent(AnalyticsEvents.FUEL_ROW_CLICKED, { product: key });
        if (key !== LPG_KEY) {
            analyticsService.trackEvent(AnalyticsEvents.FUEL_TRENDS_VIEWED, { product: key });
        }
    }, []);

    const handleViewAllCities = useCallback(() => {
        citiesSheetRef.current?.present();
    }, []);

    const lastUpdatedLabel = useMemo(() => {
        if (!fuelData?.date) return null;
        const d = new Date(fuelData.date);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, [fuelData?.date]);

    // Octane Plus is PSO's only per-city product, so it needs unpacking before
    // it can sit alongside the national products.
    const octaneCities = useMemo(() => {
        const entry = fuelData?.prices?.[OCTANE_PLUS_KEY];
        if (!entry || isFuelReading(entry)) return [];
        return Object.entries(entry)
            .map(([city, reading]) => ({ city, price_pkr: reading.price_pkr }))
            .sort((a, b) => a.city.localeCompare(b.city));
    }, [fuelData]);

    /** The most common city price — an outlier shouldn't headline the screen. */
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

    /** Price per tab key, national and per-city alike. */
    const pricesByKey = useMemo(() => {
        const prices = fuelData?.prices ?? {};
        const map: Record<string, number> = {};
        for (const key of FUEL_TAB_KEYS) {
            if (key === OCTANE_PLUS_KEY) {
                if (octaneRepresentativePrice !== null) map[key] = octaneRepresentativePrice;
                continue;
            }
            const entry = prices[key];
            if (entry && isFuelReading(entry)) map[key] = entry.price_pkr;
        }
        return map;
    }, [fuelData, octaneRepresentativePrice]);

    const availableKeys = useMemo(() => Object.keys(pricesByKey), [pricesByKey]);

    // If today's feed is missing the selected product, fall back to one it has
    // rather than leaving the screen blank under a selected tab.
    const resolvedKey = useMemo(() => {
        if (pricesByKey[activeKey] !== undefined) return activeKey;
        return availableKeys[0] ?? activeKey;
    }, [activeKey, availableKeys, pricesByKey]);

    const activePrice = pricesByKey[resolvedKey];
    const activeMeta = useMemo(() => getFuelTabMeta(resolvedKey), [resolvedKey]);

    const chartPoints = useMemo(() => {
        if (!trendsData?.trends) return [];
        return trendsData.trends.map((t) => ({ date: t.date, value: t.price_pkr }));
    }, [trendsData]);

    /** Move across the loaded window, feeding the hero card's trend pill. */
    const changePct = useMemo(() => {
        if (chartPoints.length < 2) return null;
        const first = chartPoints[0].value;
        const last = chartPoints[chartPoints.length - 1].value;
        if (!first) return null;
        return ((last - first) / first) * 100;
    }, [chartPoints]);

    const comparisonEntries = useMemo(
        () => FUEL_TAB_KEYS
            .filter((key) => pricesByKey[key] !== undefined)
            .map((key) => ({ key, price: pricesByKey[key] })),
        [pricesByKey]
    );

    const octaneContextLabel = useMemo(() => {
        if (resolvedKey !== OCTANE_PLUS_KEY || !octaneCities.length) return null;
        return `Most common of ${octaneCities.length} cities`;
    }, [resolvedKey, octaneCities.length]);

    const hasResults = availableKeys.length > 0;

    return (
        <ErrorBoundary>
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
                        contentContainerStyle={{ paddingTop: 10, paddingBottom: insets.bottom + 24 }}
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
                                <FuelSegmentTabs
                                    active={resolvedKey}
                                    onSelect={handleSelect}
                                    availableKeys={availableKeys}
                                />

                                {activePrice !== undefined && (
                                    <FuelHeroCard
                                        meta={activeMeta}
                                        price={activePrice}
                                        changePct={changePct}
                                        effectiveDateLabel={lastUpdatedLabel}
                                        contextLabel={octaneContextLabel}
                                    />
                                )}

                                {/* Renders nothing for LPG — the cylinder card takes this slot. */}
                                <FuelInlineTrendCard
                                    product={resolvedKey}
                                    points={chartPoints}
                                    isLoading={isTrendsLoading}
                                    isError={!!trendsError}
                                    cityLabel={resolvedKey === OCTANE_PLUS_KEY ? trendsData?.city ?? null : null}
                                />

                                {resolvedKey === LPG_KEY && activePrice !== undefined && (
                                    <FuelLpgOverviewCard pricePerKg={activePrice} />
                                )}

                                {resolvedKey === OCTANE_PLUS_KEY && (
                                    <FuelOctaneCitiesCard cities={octaneCities} onViewAll={handleViewAllCities} />
                                )}

                                <FuelQuickComparison
                                    entries={comparisonEntries}
                                    activeKey={resolvedKey}
                                    onSelect={handleSelect}
                                />
                            </>
                        )}
                    </ScrollView>
                )}

                <FuelCitiesSheet
                    ref={citiesSheetRef}
                    cities={octaneCities}
                    representativePrice={octaneRepresentativePrice}
                />
            </View>
        </ErrorBoundary>
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
