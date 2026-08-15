import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRewardedAd } from '@/ads/hooks/useAds';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CurrencyConverter } from '@/components/currency/CurrencyConverter';
import { CurrencyHeader } from '@/components/currency/CurrencyHeader';
import { CurrencyListSkeleton } from '@/components/currency/CurrencyListSkeleton';
import { CurrencyRow } from '@/components/currency/CurrencyRow';
import { CurrencyTrendsModal } from '@/components/currency/CurrencyTrendsModal';
import { PremiumUnlockBanner } from '@/components/currency/PremiumUnlockBanner';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { currencyMatchesQuery, getCurrencyMeta, matchesAnyKnownCurrency } from '@/constants/currencies';
import { useTheme } from '@/context/ThemeContext';
import { useExchangeRates } from '@/hooks/useCurrency';
import { useIsOffline } from '@/hooks/useIsOffline';
import { useFavoriteCurrencies, useIsPremiumUnlocked, useCurrencyStore } from '@/store/currencyStore';

type CurrencyEntry = [code: string, rate: number];

export default function CurrencyScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const isPremiumUnlocked = useIsPremiumUnlocked();
    const unlockPremium = useCurrencyStore((s) => s.unlockPremium);
    const toggleFavoriteCurrency = useCurrencyStore((s) => s.toggleFavoriteCurrency);
    const favorites = useFavoriteCurrencies();
    const isOffline = useIsOffline();
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
        // PKR (the base currency) always leads, then pinned favorites in pin
        // order, then everything else A-Z.
        entries.sort(([a], [b]) => {
            if (a === 'PKR') return -1;
            if (b === 'PKR') return 1;
            const favA = favorites.indexOf(a);
            const favB = favorites.indexOf(b);
            if (favA !== -1 || favB !== -1) {
                if (favA === -1) return 1;
                if (favB === -1) return -1;
                return favA - favB;
            }
            return a.localeCompare(b);
        });
        return entries;
    }, [ratesData, favorites]);

    const nonPkrCodes = useMemo(
        () => currencyEntries.filter(([code]) => code !== 'PKR').map(([code]) => code),
        [currencyEntries]
    );

    const filteredEntries = useMemo(() => {
        if (!searchQuery.trim()) return currencyEntries;
        return currencyEntries.filter(([code]) => currencyMatchesQuery(code, getCurrencyMeta(code), searchQuery));
    }, [currencyEntries, searchQuery]);

    // Free tier only ever has 5 currencies loaded, so a search for anything
    // outside that set always comes back empty — distinguish "no such
    // currency" from "exists, but you haven't unlocked it yet" so the empty
    // state can point at the unlock banner instead of looking like search is
    // just broken.
    const isSearchingLockedCurrency = !isPremiumUnlocked && !!searchQuery.trim() && filteredEntries.length === 0 && matchesAnyKnownCurrency(searchQuery);

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
        <ErrorBoundary>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <CurrencyHeader
                lastUpdatedLabel={lastUpdatedLabel}
                currencyCount={ratesData?.currencyCount}
                isUnlocked={isPremiumUnlocked}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isOffline={isOffline}
            />

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
                        <CurrencyRow
                            code={code}
                            rate={rate}
                            onPress={() => handleRowPress(code)}
                            isFavorite={favorites.includes(code)}
                            onToggleFavorite={() => toggleFavoriteCurrency(code)}
                        />
                    )}
                    ListHeaderComponent={
                        <CurrencyConverter rates={ratesData?.rates} codes={nonPkrCodes} favorites={favorites} />
                    }
                    contentContainerStyle={{
                        paddingTop: 12,
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
                            <Ionicons
                                name={isSearchingLockedCurrency ? 'lock-closed-outline' : 'search-outline'}
                                size={36}
                                color={colors.textSecondary}
                            />
                            <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                                {isSearchingLockedCurrency
                                    ? `"${searchQuery}" is available after unlocking — watch a quick ad below to search all 160+ currencies.`
                                    : `No currencies match "${searchQuery}"`}
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
    bannerWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 12,
    },
});
