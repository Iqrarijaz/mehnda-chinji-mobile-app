import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { MetalCard } from '@/components/metals/MetalCard';
import { MetalTrendsModal } from '@/components/metals/MetalTrendsModal';
import { MetalsListSkeleton } from '@/components/metals/MetalsListSkeleton';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { METALS_META, METALS_ORDER, MetalKey } from '@/constants/metals';
import { useTheme } from '@/context/ThemeContext';
import { useMetals } from '@/hooks/useMetals';

export default function MetalsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const { metalsData, isMetalsLoading, isMetalsFetching, metalsError, refetchMetals } = useMetals();
    const [selectedTrendMetal, setSelectedTrendMetal] = useState<MetalKey | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const handleCardPress = useCallback((metal: MetalKey) => {
        analyticsService.trackEvent(AnalyticsEvents.METAL_ROW_CLICKED, { metal });
        analyticsService.trackEvent(AnalyticsEvents.METAL_TRENDS_VIEWED, { metal });
        setSelectedTrendMetal(metal);
    }, []);

    const lastUpdatedLabel = useMemo(() => {
        if (!metalsData?.date) return null;
        const d = new Date(metalsData.date);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [metalsData?.date]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <Animated.View
                entering={FadeIn.duration(300)}
                style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
            >
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(drawer)/(tabs)' as any))}
                    style={[styles.backBtn, { backgroundColor: colors.card }]}
                >
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <ThemedText style={styles.headerTitle}>Metals & Gold</ThemedText>
                    <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        {lastUpdatedLabel ? `Last updated ${lastUpdatedLabel}` : 'Fetching latest rates…'}
                    </ThemedText>
                </View>
            </Animated.View>

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
                    contentContainerStyle={{ paddingTop: 14, paddingBottom: insets.bottom + 24 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing || (isMetalsFetching && !isMetalsLoading)}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {METALS_ORDER.map((key) => {
                        const entry = metalsData?.metals?.[key];
                        if (!entry) return null;
                        return (
                            <MetalCard
                                key={key}
                                meta={METALS_META[key]}
                                price={entry.price}
                                unit={metalsData?.unit || 'g'}
                                karats={key === 'gold' ? entry.karats : undefined}
                                onPress={() => handleCardPress(key)}
                            />
                        );
                    })}
                </ScrollView>
            )}

            <MetalTrendsModal metal={selectedTrendMetal} onClose={() => setSelectedTrendMetal(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
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
