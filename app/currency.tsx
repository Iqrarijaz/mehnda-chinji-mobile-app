import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { SearchBar } from '@/components/common/SearchBar';
import { CurrencyListSkeleton } from '@/components/currency/CurrencyListSkeleton';
import { CurrencyRow } from '@/components/currency/CurrencyRow';
import { CurrencyTrendsModal } from '@/components/currency/CurrencyTrendsModal';
import { PremiumUnlockBanner } from '@/components/currency/PremiumUnlockBanner';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { getCurrencyMeta } from '@/constants/currencies';
import { useTheme } from '@/context/ThemeContext';
import { useExchangeRates } from '@/hooks/useCurrency';
import { useCurrencyRewardedAd } from '@/hooks/useCurrencyRewardedAd';
import { useIsPremiumUnlocked } from '@/store/currencyStore';

type CurrencyEntry = [code: string, rate: number];

export default function CurrencyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const isPremiumUnlocked = useIsPremiumUnlocked();
    const { ratesData, isRatesLoading, isRatesFetching, ratesError, refetchRates } = useExchangeRates(isPremiumUnlocked);
    const { isAdLoaded, isAdShowing, showAd } = useCurrencyRewardedAd();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrendCurrency, setSelectedTrendCurrency] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const handleRowPress = useCallback((code: string) => {
        analyticsService.trackEvent(AnalyticsEvents.CURRENCY_ROW_CLICKED, { code });
        if (code === 'PKR') return; // base currency has no meaningful trend against itself
        analyticsService.trackEvent(AnalyticsEvents.CURRENCY_TRENDS_VIEWED, { code });
        setSelectedTrendCurrency(code);
    }, []);

    const lastUpdatedLabel = useMemo(() => {
        if (!ratesData?.date) return null;
        const d = new Date(ratesData.date);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [ratesData?.date]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <Animated.View
                entering={FadeIn.duration(300)}
                style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
            >
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(drawer)/(tabs)' as any))}
                        style={[styles.backBtn, { backgroundColor: colors.card }]}
                    >
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTextWrap}>
                        <ThemedText style={styles.headerTitle}>Currency Exchange</ThemedText>
                        <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            {lastUpdatedLabel ? `Last updated ${lastUpdatedLabel}` : 'Fetching latest rates…'}
                        </ThemedText>
                    </View>
                </View>

                <SearchBar
                    placeholder="Search currency (e.g. USD, Euro)"
                    onSearch={setSearchQuery}
                    style={styles.searchBar}
                />
            </Animated.View>

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
                        paddingTop: 14,
                        paddingBottom: insets.bottom + (isPremiumUnlocked ? 24 : 110),
                    }}
                    showsVerticalScrollIndicator={false}
                    refreshing={isRefreshing || (isRatesFetching && !isRatesLoading)}
                    onRefresh={handleRefresh}
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
                    <PremiumUnlockBanner onPress={showAd} isAdLoaded={isAdLoaded} isAdShowing={isAdShowing} />
                </View>
            )}

            <CurrencyTrendsModal currency={selectedTrendCurrency} onClose={() => setSelectedTrendCurrency(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 12,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 2,
    },
    searchBar: {
        height: 44,
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
