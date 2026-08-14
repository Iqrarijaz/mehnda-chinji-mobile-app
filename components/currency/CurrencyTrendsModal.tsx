import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { PremiumModal } from '@/components/common/PremiumModal';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { getCurrencyFlagUrl, getCurrencyMeta } from '@/constants/currencies';
import { useTheme } from '@/context/ThemeContext';
import { useExchangeRateTrends } from '@/hooks/useCurrency';
import { TrendChart } from './TrendChart';

interface CurrencyTrendsModalProps {
    /** Currency code to show trends for; modal is visible whenever this is non-null. */
    currency: string | null;
    onClose: () => void;
}

// PremiumModal's bottom-sheet is 95% of screen width with 20px horizontal padding on each side.
const SHEET_HORIZONTAL_PADDING = 20;

export function CurrencyTrendsModal({ currency, onClose }: CurrencyTrendsModalProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { width: windowWidth } = useWindowDimensions();
    const { trendsData, isTrendsLoading, trendsError } = useExchangeRateTrends(currency);

    const meta = currency ? getCurrencyMeta(currency) : null;
    const flagUrl = currency ? getCurrencyFlagUrl(currency) : null;
    const chartWidth = windowWidth * 0.95 - SHEET_HORIZONTAL_PADDING * 2;

    const chartPoints = useMemo(() => {
        if (!trendsData?.trends) return [];
        // Backend stores "1 PKR = X <currency>"; invert to the user-facing "1 <currency> = X PKR".
        return trendsData.trends
            .filter((t) => t.rate > 0)
            .map((t) => ({ date: t.date, value: 1 / t.rate }));
    }, [trendsData]);

    return (
        <PremiumModal visible={!!currency} onClose={onClose} type="bottom-sheet">
            {currency && (
                <View>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            {flagUrl ? (
                                <Image source={{ uri: flagUrl }} style={styles.flag} contentFit="cover" />
                            ) : (
                                <View style={[styles.flag, styles.flagFallback, { backgroundColor: colors.background }]}>
                                    <Ionicons name="globe-outline" size={18} color={colors.icon} />
                                </View>
                            )}
                            <View style={styles.headerText}>
                                <ThemedText style={styles.title}>{currency} Trend</ThemedText>
                                <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                                    {meta?.name} · last 30 days
                                </ThemedText>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: colors.background }]}
                        >
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {isTrendsLoading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : trendsError ? (
                        <View style={styles.loadingWrap}>
                            <ThemedText style={{ color: colors.textSecondary }}>
                                Couldn&apos;t load trend data. Please try again later.
                            </ThemedText>
                        </View>
                    ) : (
                        <TrendChart points={chartPoints} width={chartWidth} />
                    )}
                </View>
            )}
        </PremiumModal>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    flag: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
    },
    flagFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingWrap: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
