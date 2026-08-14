import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRewardedAd } from '@/ads/hooks/useAds';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { SearchBar } from '@/components/common/SearchBar';
import { CurrencyHeader } from '@/components/currency/CurrencyHeader';
import { CurrencyListSkeleton } from '@/components/currency/CurrencyListSkeleton';
import { CurrencyRow } from '@/components/currency/CurrencyRow';
import { CurrencyTrendsModal } from '@/components/currency/CurrencyTrendsModal';
import { PremiumUnlockBanner } from '@/components/currency/PremiumUnlockBanner';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { getCurrencyMeta } from '@/constants/currencies';
import { useTheme } from '@/context/ThemeContext';
import { useExchangeRates } from '@/hooks/useCurrency';
import { useIsPremiumUnlocked, useCurrencyStore } from '@/store/currencyStore';

type CurrencyEntry = [code: string, rate: number];

export default function CurrencyScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const isPremiumUnlocked = useIsPremiumUnlocked();
    const unlockPremium = useCurrencyStore((s) => s.unlockPremium);
    const { ratesData, isRatesLoading, isRatesFetching, ratesError, refetchRates } = useExchangeRates(isPremiumUnlocked);
    const { showAd, isShowing: isAdShowing, isAdLoaded } = useRewardedAd();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrendCurrency, setSelectedTrendCurrency] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const trendsSheetRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
        analyticsService.trackEvent(AnalyticsEvents.CURRENCY_VIEWED, { unlocked: isPremiumUnlocked });
        // Fire only once per screen visit, not every time the unlock state flips mid-visit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currencyEntries: CurrencyEntry[] = useMemo(() => {
        if (!ratesData?.rates) return [];
        const entries = Object.entries(ratesData.rates) as CurrencyEntry[];
        // PKR (the base currency) always leads; everything else A-Z.
        entries.sort(([a], [b]) => {
            if (a === 'PKR') return -1;
            if (b === 'PKR') return 1;
            return a.localeCompare(b);
        });
        return entries;
    }, [ratesData]);

    const filteredEntries = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return currencyEntries;
        return currencyEntries.filter(([code]) => {
            const meta = getCurrencyMeta(code);
            return code.toLowerCase().includes(q) || meta.name.toLowerCase().includes(q);
        });
    }, [currencyEntries, searchQuery]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await refetchRates();
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchRates]);

    const handleUnlockPress = useCallback(() => {
        showAd(() => {
            unlockPremium();
        });
    }, [showAd, unlockPremium]);

    const handleRowPress = useCallback((code: string) => {
        analyticsService.trackEvent(AnalyticsEvents.CURRENCY_ROW_CLICKED, { code });
        if (code === 'PKR') return; // base currency has no meaningful trend against itself
        analyticsService.trackEvent(AnalyticsEvents.CURRENCY_TRENDS_VIEWED, { code });
        setSelectedTrendCurrency(code);
        trendsSheetRef.current?.present();
    }, []);

    const lastUpdatedLabel = useMemo(() => {
        if (!ratesData?.date) return null;
        const d = new Date(ratesData.date);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, [ratesData?.date]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <CurrencyHeader
                lastUpdatedLabel={lastUpdatedLabel}
                currencyCount={ratesData?.currencyCount}
                isUnlocked={isPremiumUnlocked}
            />

            <View style={styles.searchWrap}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search currency (e.g. USD, Euro)"
                    style={styles.searchBar}
                />
            </View>

            {/* List */}
            {isRatesLoading ? (
                <View style={styles.listWrap}>
                    <CurrencyListSkeleton />
                </View>
            ) : ratesError ? (
                <View style={styles.centerWrap}>
                    <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
                    <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                        Couldn&apos;t load exchange rates. Pull down to try again.
                    </ThemedText>
                </View>
            ) : (
                <FlashList
                    data={filteredEntries}
                    keyExtractor={([code]) => code}
                    renderItem={({ item: [code, rate] }) => (
                        <CurrencyRow code={code} rate={rate} onPress={() => handleRowPress(code)} />
                    )}
                    contentContainerStyle={{
                        paddingTop: 6,
                        paddingBottom: insets.bottom + (isPremiumUnlocked ? 24 : 110),
                    }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing || (isRatesFetching && !isRatesLoading)}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerWrap}>
                            <Ionicons name="search-outline" size={36} color={colors.textSecondary} />
                            <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                                No currencies match &ldquo;{searchQuery}&rdquo;
                            </ThemedText>
                        </View>
                    }
                />
            )}

            {/* Ad-gated unlock banner */}
            {!isPremiumUnlocked && !isRatesLoading && !ratesError && (
                <View style={[styles.bannerWrap, { paddingBottom: insets.bottom + 12 }]}>
                    <PremiumUnlockBanner onPress={handleUnlockPress} isAdLoaded={isAdLoaded} isAdShowing={isAdShowing} />
                </View>
            )}

            <CurrencyTrendsModal
                ref={trendsSheetRef}
                currency={selectedTrendCurrency}
                onDismiss={() => setSelectedTrendCurrency(null)}
            />
        </View>
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
    bannerWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 12,
    },
});
