import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SearchBar } from '@/components/common/SearchBar';
import { MetalCard } from '@/components/metals/MetalCard';
import { MetalsHeader } from '@/components/metals/MetalsHeader';
import { MetalTrendsModal } from '@/components/metals/MetalTrendsModal';
import { MetalsListSkeleton } from '@/components/metals/MetalsListSkeleton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { BASE_METALS_META, BASE_METALS_ORDER, METALS_META, METALS_ORDER } from '@/constants/metals';
import { useTheme } from '@/context/ThemeContext';
import { useMetals } from '@/hooks/useMetals';

export default function MetalsScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const { metalsData, isMetalsLoading, isMetalsFetching, metalsError, refetchMetals } = useMetals();
    const [selectedTrendMetal, setSelectedTrendMetal] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const trendsSheetRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
        analyticsService.trackEvent(AnalyticsEvents.METALS_VIEWED);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await refetchMetals();
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchMetals]);

    const handleCardPress = useCallback((metal: string) => {
        analyticsService.trackEvent(AnalyticsEvents.METAL_ROW_CLICKED, { metal });
        analyticsService.trackEvent(AnalyticsEvents.METAL_TRENDS_VIEWED, { metal });
        setSelectedTrendMetal(metal);
        trendsSheetRef.current?.present();
    }, []);

    const lastUpdatedLabel = useMemo(() => {
        if (!metalsData?.date) return null;
        const d = new Date(metalsData.date);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, [metalsData?.date]);

    // Precious metals (gold/silver/platinum/palladium) — always present when data loads.
    const preciousMetals = useMemo(() => {
        return METALS_ORDER
            .map((key) => {
                const entry = metalsData?.metals?.[key];
                if (!entry) return null;
                return { key, meta: METALS_META[key], price: entry.price, karats: key === 'gold' ? entry.karats : undefined };
            })
            .filter((m): m is NonNullable<typeof m> => !!m);
    }, [metalsData]);

    // Base (industrial) metals, sourced from the backend's `raw` passthrough —
    // gives the search bar real breadth beyond the 4 precious metals.
    const baseMetals = useMemo(() => {
        const raw = metalsData?.raw ?? {};
        return BASE_METALS_ORDER
            .filter((key) => typeof raw[key] === 'number')
            .map((key) => ({ key, meta: BASE_METALS_META[key], price: raw[key], karats: undefined }));
    }, [metalsData]);

    const q = searchQuery.trim().toLowerCase();
    const filteredPrecious = q ? preciousMetals.filter((m) => m.meta.label.toLowerCase().includes(q)) : preciousMetals;
    const filteredBase = q ? baseMetals.filter((m) => m.meta.label.toLowerCase().includes(q)) : baseMetals;
    const hasResults = filteredPrecious.length > 0 || filteredBase.length > 0;

    return (
        <ErrorBoundary>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <MetalsHeader lastUpdatedLabel={lastUpdatedLabel} />

            <View style={styles.searchWrap}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search metals (e.g. Gold, Copper)"
                    style={[styles.searchBar, { backgroundColor: colors.cardBg }]}
                />
            </View>

            {/* List */}
            {isMetalsLoading ? (
                <View style={styles.listWrap}>
                    <MetalsListSkeleton />
                </View>
            ) : metalsError ? (
                <View style={styles.centerWrap}>
                    <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
                    <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                        Couldn&apos;t load metal rates. Pull down to try again.
                    </ThemedText>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingTop: 6, paddingBottom: insets.bottom + 24 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing || (isMetalsFetching && !isMetalsLoading)}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {!hasResults ? (
                        <View style={styles.centerWrap}>
                            <Ionicons name="search-outline" size={36} color={colors.textSecondary} />
                            <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                                No metals match &ldquo;{searchQuery}&rdquo;
                            </ThemedText>
                        </View>
                    ) : (
                        <>
                            {filteredPrecious.length > 0 && (
                                <>
                                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                        PRECIOUS METALS
                                    </ThemedText>
                                    {filteredPrecious.map((m) => (
                                        <MetalCard
                                            key={m.key}
                                            meta={m.meta}
                                            price={m.price}
                                            unit={metalsData?.unit || 'g'}
                                            karats={m.karats}
                                            onPress={() => handleCardPress(m.key)}
                                        />
                                    ))}
                                </>
                            )}

                            {filteredBase.length > 0 && (
                                <>
                                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: filteredPrecious.length > 0 ? 18 : 0 }]}>
                                        BASE METALS
                                    </ThemedText>
                                    {filteredBase.map((m) => (
                                        <MetalCard
                                            key={m.key}
                                            meta={m.meta}
                                            price={m.price}
                                            unit={metalsData?.unit || 'g'}
                                            onPress={() => handleCardPress(m.key)}
                                        />
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </ScrollView>
            )}

            <MetalTrendsModal
                ref={trendsSheetRef}
                metal={selectedTrendMetal}
                onDismiss={() => setSelectedTrendMetal(null)}
            />
        </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchWrap: {
        paddingHorizontal: 20,
        marginTop: 14,
    },
    searchBar: {
        height: 46,
    },
    sectionLabel: {
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.7,
        marginHorizontal: 20,
        marginBottom: 10,
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
